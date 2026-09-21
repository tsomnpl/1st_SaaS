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
  applyRepair,
  isCriticalQcFailure,
  MAX_QC_ATTEMPTS,
  parseQcReport,
  qcPrompt,
  shouldRepair,
  skippedQcReport,
} from "@/lib/quality-control";
import { dnaSummaryLine } from "@/lib/creative-dna";
import { prisma } from "@/lib/prisma";
import { consumeOneMint, grantCredits } from "@/server/credits";
import { generateWithRodium, reviewPosterQuality } from "@/server/rodium";
import { saveBrandKit } from "@/server/brand-kit";
import { resolveVisualLibrary } from "@/server/visual-library";

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
    let prompt = buildPrompt(brief, artDirection, {
      hasVisualReferenceImage: Boolean(visual.dataUrl),
      dna: visual.dna,
    });
    let imageUrl = "";
    let model = "pending";
    let rodiCost = 0;
    let qc = skippedQcReport();
    let repaired = false;
    const modelsUsed: string[] = [];
    const dnaSummary = dnaSummaryLine(visual.dna);

    for (let attempt = 0; attempt < MAX_QC_ATTEMPTS; attempt += 1) {
      const rendered = await generateWithRodium({
        prompt,
        brief,
        styleReferenceDataUrl: visual.dataUrl || undefined,
      });
      if (!rendered.imageUrl) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");
      imageUrl = rendered.imageUrl;
      modelsUsed.push(rendered.model);
      rodiCost = Number((rodiCost + rendered.rodiCostEstimate).toFixed(3));
      model = modelsUsed.join("+repair:");

      const qcRaw = await reviewPosterQuality({
        imageUrl,
        prompt: qcPrompt(brief.title, brief.domain, factsForQc(brief), brief.format, dnaSummary),
        referenceImageUrl: visual.dataUrl || undefined,
      });
      qc = qcRaw ? parseQcReport(qcRaw) : skippedQcReport();
      if (!shouldRepair(qc)) break;
      if (attempt === MAX_QC_ATTEMPTS - 1) break;
      prompt = applyRepair(prompt, qc);
      repaired = true;
    }

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
          bitmapAttached: Boolean(visual.dataUrl),
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
      visualReference: {
        source: visual.source,
        id: visual.referenceId,
        attached: Boolean(visual.dataUrl),
      },
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
