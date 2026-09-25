import { CreditTransactionType, GenerationStatus, Prisma } from "@prisma/client";
import {
  applyVisualLibrary,
  buildArtDirection,
  buildPrompt,
  createBriefSchema,
  factsForQc,
  mergeRegeneratedBrief,
  scoreQuality,
  type CreateBriefInput,
} from "@/lib/flyermint";
import {
  applyReferenceCheck,
  applyRepair,
  applyTextCheck,
  isCriticalQcFailure,
  MAX_QC_ATTEMPTS,
  parseQcReport,
  qcPrompt,
  qcWasSkipped,
  shouldRepair,
  skippedQcReport,
} from "@/lib/quality-control";
import { ADAPTIVE_FIELDS } from "@/lib/domains";

function adaptiveLabels(brief: CreateBriefInput) {
  return (ADAPTIVE_FIELDS[brief.domain] ?? []).map((field) => field.label);
}
import { dnaSummaryLine } from "@/lib/creative-dna";
import { prisma } from "@/lib/prisma";
import { consumeOneMint, grantCredits } from "@/server/credits";
import { generateWithRodium, reviewPosterQuality } from "@/server/rodium";
import { saveBrandKit } from "@/server/brand-kit";
import { analyzePersonalReference, resolveVisualLibrary } from "@/server/visual-library";
import { buildLayoutPlan, finalChecklist } from "@/lib/reference-selection";

export async function runGeneration(clerkUserId: string, unsafeInput: unknown) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.status === "SUSPENDED") throw new Error("ACCOUNT_SUSPENDED");

  let brief = createBriefSchema.parse(unsafeInput);
  if (brief.regenerateFromId) {
    const previous = await prisma.generation.findFirst({
      where: { id: brief.regenerateFromId, userId: user.id, status: GenerationStatus.COMPLETED },
    });
    if (previous) {
      const parsed = createBriefSchema.safeParse(previous.brief);
      if (parsed.success) {
        brief = mergeRegeneratedBrief(parsed.data, brief);
      }
    }
  }

  let personalReferenceRejected = false;
  if (brief.personalReferenceUrl && !(await userHasPersonalReferencePlan(user.id))) {
    brief = { ...brief, personalReferenceUrl: undefined };
    personalReferenceRejected = true;
  }

  const baseDirection = buildArtDirection(brief);
  const qualityScores = scoreQuality(brief, buildPrompt(brief, baseDirection));

  const generation = await prisma.$transaction(async (tx) => {
    await consumeOneMint(user.id, {
      tx,
      reference: "GENERATION_LOCK",
      metadata: { domain: brief.domain, format: brief.format },
    });

    return tx.generation.create({
      data: {
        userId: user.id,
        mintCost: 1,
        brief: brief as Prisma.JsonObject,
        artDirection: baseDirection as Prisma.JsonObject,
        prompt: buildPrompt(brief, baseDirection),
        model: "pending",
        status: GenerationStatus.PENDING,
      },
    });
  });

  try {
    const visual = await resolveVisualLibrary(brief, baseDirection.visual_reference_paths);
    const artDirection = applyVisualLibrary(baseDirection, visual, brief.colors);
    const personalUrl = brief.personalReferenceUrl || "";
    const personalAnalysis = personalUrl ? await analyzePersonalReference(personalUrl, brief.domain) : null;
    // The client's own poster is the model when given; the library pick then only helps free modes.
    const primaryReference = personalUrl || visual.dataUrl;
    const secondaryReference = personalUrl && brief.referenceMode !== "exact_copy" ? visual.dataUrl : "";
    const referenceAnalysis = personalUrl ? personalAnalysis : visual.analysis;
    const referenceType = personalUrl ? "personal" : visual.source === "none" ? "none" : `internal_${visual.source}`;
    let prompt = buildPrompt(brief, artDirection, {
      hasVisualReferenceImage: Boolean(primaryReference),
      dna: personalUrl ? null : visual.dna,
      analysis: referenceAnalysis,
      personalReference: Boolean(personalUrl),
    });
    const layoutPlan = buildLayoutPlan(brief, referenceAnalysis);
    let imageUrl = "";
    let model = "pending";
    let rodiCost = 0;
    let qc = skippedQcReport();
    let repaired = false;
    const modelsUsed: string[] = [];
    const dnaSummary = dnaSummaryLine(visual.dna);
    let bitmapAttached = false;
    let attachmentsSent: string[] = [];
    let modelSent = "";
    let modelReturned = "";
    let regenerationCount = 0;
    const referenceCopy = Boolean(primaryReference) && brief.referenceMode === "exact_copy";
    const composition = Boolean(primaryReference) && brief.referenceMode === "composition";
    const allowedText = [...factsForQc(brief), ...adaptiveLabels(brief)];
    const runQc = async () => {
      const qcRequest = {
        imageUrl,
        prompt: qcPrompt(brief.title, brief.domain, factsForQc(brief), brief.format, personalUrl ? "" : dnaSummary, {
          referenceCopy,
          composition,
        }),
        referenceImageUrl: primaryReference || undefined,
      };
      const raw = (await reviewPosterQuality(qcRequest)) || (await reviewPosterQuality(qcRequest));
      if (!raw) return skippedQcReport();
      const report = applyTextCheck(parseQcReport(raw), allowedText);
      return primaryReference
        ? applyReferenceCheck(report, {
            originalText: referenceAnalysis?.originalText ?? [],
            clientText: allowedText,
            strictStructure: referenceCopy || composition,
          })
        : report;
    };

    for (let attempt = 0; attempt < MAX_QC_ATTEMPTS; attempt += 1) {
      const rendered = await generateWithRodium({
        prompt,
        brief,
        styleReferenceDataUrl: primaryReference || undefined,
        secondaryReferenceDataUrl: secondaryReference || undefined,
      });
      if (!rendered.imageUrl) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");
      imageUrl = rendered.imageUrl;
      bitmapAttached = rendered.bitmapAttached;
      attachmentsSent = rendered.attachmentsSent;
      modelSent = rendered.modelSent;
      modelReturned = rendered.modelReturned;
      regenerationCount = attempt;
      modelsUsed.push(rendered.model);
      rodiCost = Number((rodiCost + rendered.rodiCostEstimate).toFixed(3));
      model = modelsUsed.join("+repair:");

      qc = await runQc();
      // Without a QC report a repair would be blind and burn RODI for nothing.
      if (qcWasSkipped(qc)) break;
      if (!shouldRepair(qc)) break;
      if (attempt === MAX_QC_ATTEMPTS - 1) break;
      prompt = applyRepair(prompt, qc, { referenceCopy });
      repaired = true;
    }

    const checklist = finalChecklist({
      brief,
      visibleText: qcWasSkipped(qc) ? undefined : qc.visible_text,
      attachmentsSent,
      referenceRequired: Boolean(primaryReference),
    });
    const referenceLog = {
      domain: brief.domain,
      domainKey: visual.domainKey || null,
      mode: primaryReference ? brief.referenceMode.toUpperCase() : "NO_REFERENCE",
      referenceType,
      referenceId: personalUrl ? "personal" : visual.referenceId || null,
      referencePath: personalUrl ? null : visual.storagePath || null,
      referenceRole: primaryReference ? "reference" : null,
      referenceUsed: attachmentsSent.includes("reference"),
      secondaryReferenceId: secondaryReference ? visual.referenceId : null,
      secondaryReferenceUsed: attachmentsSent.includes("reference_secondary"),
      selectionReason: personalUrl ? "référence personnelle fournie par le client" : visual.selection?.reason ?? null,
      selectionScore: personalUrl ? null : visual.selection?.score ?? null,
      candidates: visual.selection?.candidates ?? 0,
      analyzed: visual.selection?.analyzed ?? 0,
      runnersUp: visual.selection?.runnersUp ?? [],
      referenceAnalysis: referenceAnalysis
        ? {
            subject: referenceAnalysis.subject,
            textSlots: referenceAnalysis.textSlots,
            zones: referenceAnalysis.zones,
            aspectRatio: referenceAnalysis.aspectRatio,
          }
        : null,
      modelSent,
      modelReturned,
      logoUsed: attachmentsSent.includes("logo"),
      productImageUsed: attachmentsSent.includes("photo"),
      personalReferenceUsed: Boolean(personalUrl) && attachmentsSent.includes("reference"),
      personalReferenceRejected,
      qualityCheck: qcWasSkipped(qc) ? "unverified" : qc.pass ? "passed" : "failed",
      structureScore: qc.structure_score ?? null,
      leftovers: qc.leftovers ?? [],
      regenerationCount,
      layoutPlan,
      finalChecklist: checklist,
    };
    console.info("[generation]", generation.id, JSON.stringify({ ...referenceLog, layoutPlan: undefined }));

    if (isCriticalQcFailure(qc)) {
      throw new Error("RODIUM_QUALITY_FAILED");
    }

    if (brief.rememberBrand) {
      await saveBrandKit(user.id, {
        colors: brief.colors.slice(0, 3),
        logoUrl: brief.logoUrl,
      });
    }

    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        prompt,
        artDirection: artDirection as Prisma.JsonObject,
        model,
        rodiCost,
        outputUrl: imageUrl,
        qualityScore: qualityScores.overall_score,
        qualityDetails: {
          ...qualityScores,
          qc,
          repaired,
          task: "IMAGE_GENERATION",
          visualLibrarySource: visual.source,
          visualReferenceId: visual.referenceId || null,
          visualReferencePath: visual.storagePath || null,
          visualReferenceBytes: visual.bytes,
          bitmapAttached,
          attachmentsSent,
          generationMode: primaryReference ? brief.referenceMode : "art_direction",
          referenceLog,
          qcStatus: qcWasSkipped(qc) ? "unverified" : qc.pass ? "passed" : "failed",
          creativeDna: visual.dna,
          visualReferenceIds: artDirection.visual_reference_ids,
          durationMs: Date.now() - generation.createdAt.getTime(),
          checks: [
            "human_required",
            "art_direction",
            "visual_library",
            "bitmap_attached",
            "qc_vision",
            "composition_match",
            "format",
          ],
        } as Prisma.JsonObject,
        status: GenerationStatus.COMPLETED,
      },
    });

    return {
      generationId: updated.id,
      outputUrl: updated.outputUrl,
      quality: qualityScores,
      artDirection,
      repaired,
      qcStatus: qcWasSkipped(qc) ? "unverified" : qc.pass ? "passed" : "failed",
      typos: qc.typos ?? [],
      visualReference: {
        source: visual.source,
        id: visual.referenceId,
        attached: bitmapAttached,
        inputs: attachmentsSent,
      },
      referenceLog,
    };
  } catch (error) {
    await prisma.$transaction(async (tx) => {
      await tx.generation.update({
        where: { id: generation.id },
        data: { status: GenerationStatus.FAILED },
      });

      await grantCredits(
        user.id,
        1,
        CreditTransactionType.REFUND,
        {
          tx,
          reference: generation.id,
          metadata: { reason: error instanceof Error ? error.message : "RODIUM_FAILURE_REFUND" },
        },
        null,
      );
    });

    throw error;
  }
}

/** Personal references are a 20k/25k feature: same paid plans as the editable export. */
export async function userHasPersonalReferencePlan(userId: string) {
  return userHasEditableExport(userId);
}

export async function userHasEditableExport(userId: string) {
  const paid = await prisma.payment.findFirst({
    where: {
      userId,
      status: "COMPLETED",
      plan: { editableExport: true },
    },
  });
  return Boolean(paid);
}

export type { CreateBriefInput };
