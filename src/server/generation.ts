import { CreditTransactionType, GenerationStatus, Prisma } from "@prisma/client";
import {
  applyExactCopyRepair,
  exactCopyQcPrompt,
  exactCopyShouldRegenerate,
  generationProof,
  isExactCopy,
  judgeExactCopyTranscript,
} from "@/lib/exact-copy";
import {
  buildArtDirection,
  buildPrompt,
  createBriefSchema,
  factsForQc,
  mergeRegeneratedBrief,
  scoreQuality,
  type CreateBriefInput,
} from "@/lib/flyermint";
import { downloadReferenceDataUrl, loadDomainReferences } from "@/lib/inspiration-source";
import { selectReferenceInDomain, type ReferenceSelection } from "@/lib/reference-select";
import { applyRepair, parseQcReport, qcPrompt, shouldRepair, skippedQcReport } from "@/lib/quality-control";
import { prisma } from "@/lib/prisma";
import { consumeOneMint, grantCredits } from "@/server/credits";
import { notifyAdmin, sendGenerationFailed, sendGenerationSucceeded } from "@/server/mail";
import { generateWithRodium, reviewPosterQuality } from "@/server/rodium";
import { saveBrandKit } from "@/server/brand-kit";

async function resolveReferenceSelection(brief: CreateBriefInput): Promise<ReferenceSelection> {
  const candidates = await loadDomainReferences(brief.domain);
  return selectReferenceInDomain({ domain: brief.domain, brief, candidates });
}

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
  brief = { ...brief, creativeFreedom: "copie_exacte" };

  const selection = await resolveReferenceSelection(brief);
  const exact = isExactCopy(brief);
  if (exact && !selection.selected) throw new Error("EXACT_COPY_NO_REFERENCE");
  const referenceImageDataUrl =
    exact && selection.selected ? await downloadReferenceDataUrl(selection.selected.storagePath) : undefined;
  if (exact && !referenceImageDataUrl) throw new Error("EXACT_COPY_REFERENCE_MISSING");

  const artDirection = buildArtDirection(brief, selection);
  let prompt = buildPrompt(brief, artDirection, selection);
  const qualityScores = scoreQuality(brief, prompt);

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
        artDirection: artDirection as Prisma.JsonObject,
        prompt,
        model: "pending",
        status: GenerationStatus.PENDING,
      },
    });
  });

  try {
    const first = await generateWithRodium({ prompt, brief, referenceImageDataUrl });
    if (!first.imageUrl) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");

    let imageUrl = first.imageUrl;
    let model = first.model;
    let responseModel = first.responseModel;
    let referenceUsed = first.referenceUsed;
    let rodiCost = first.rodiCostEstimate;
    let qc: unknown = skippedQcReport();
    let repaired = false;
    let regenerationCount = 0;

    if (exact) {
      const qcRaw = await reviewPosterQuality({
        imageUrl,
        referenceImageUrl: referenceImageDataUrl,
        prompt: exactCopyQcPrompt(brief, selection),
      });
      let exactQc = judgeExactCopyTranscript(brief, qcRaw);
      qc = exactQc;
      if (exactCopyShouldRegenerate(exactQc)) {
        prompt = applyExactCopyRepair(prompt, exactQc);
        const second = await generateWithRodium({ prompt, brief, referenceImageDataUrl });
        regenerationCount = 1;
        if (second.imageUrl) {
          imageUrl = second.imageUrl;
          model = second.model;
          responseModel = second.responseModel;
          referenceUsed = second.referenceUsed;
          rodiCost = Number((first.rodiCostEstimate + second.rodiCostEstimate).toFixed(3));
          repaired = true;
          const secondQc = await reviewPosterQuality({
            imageUrl,
            referenceImageUrl: referenceImageDataUrl,
            prompt: exactCopyQcPrompt(brief, selection),
          });
          exactQc = judgeExactCopyTranscript(brief, secondQc);
          qc = exactQc;
        }
      }
    } else {
      const qcRaw = await reviewPosterQuality({
        imageUrl,
        prompt: qcPrompt(brief.title, brief.domain, factsForQc(brief)),
      });
      if (qcRaw) {
        const report = parseQcReport(qcRaw);
        qc = report;
        if (shouldRepair(report)) {
          prompt = applyRepair(prompt, report);
          const second = await generateWithRodium({ prompt, brief });
          regenerationCount = 1;
          if (second.imageUrl) {
            imageUrl = second.imageUrl;
            model = `${first.model}+repair:${second.model}`;
            responseModel = second.responseModel;
            referenceUsed = second.referenceUsed;
            rodiCost = Number((first.rodiCostEstimate + second.rodiCostEstimate).toFixed(3));
            repaired = true;
            const secondQc = await reviewPosterQuality({
              imageUrl,
              prompt: qcPrompt(brief.title, brief.domain, factsForQc(brief)),
            });
            if (secondQc) qc = parseQcReport(secondQc);
          }
        }
      }
    }

    const proof = generationProof({
      brief,
      selection,
      model,
      responseModel,
      referenceUsed,
      qualityCheck: qc,
      regenerationCount,
    });

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
        model,
        rodiCost,
        outputUrl: imageUrl,
        qualityScore: qualityScores.overall_score,
        qualityDetails: {
          ...qualityScores,
          qc,
          repaired,
          durationMs: Date.now() - generation.createdAt.getTime(),
          checks: exact
            ? ["exact_copy", "domain_lock", "reference_image", "qc_reference_vs_result"]
            : ["human_required", "art_direction", "qc_vision", "domain_lock"],
          generationLog: proof,
        } as Prisma.JsonObject,
        status: GenerationStatus.COMPLETED,
      },
    });

    if (user.email) {
      await sendGenerationSucceeded({
        to: user.email,
        title: brief.title,
        generationId: updated.id,
      });
    }

    return {
      generationId: updated.id,
      outputUrl: updated.outputUrl,
      quality: qualityScores,
      artDirection,
      repaired,
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
          metadata: { reason: "RODIUM_FAILURE_REFUND" },
        },
        null,
      );
    });

    if (user.email) {
      await sendGenerationFailed({
        to: user.email,
        title: brief.title,
        generationId: generation.id,
      });
      await notifyAdmin(
        `Génération non aboutie, ${generation.id}`,
        `La génération ${generation.id} a échoué. Le Mint a été recrédité.`,
        user.email,
      );
    }

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
