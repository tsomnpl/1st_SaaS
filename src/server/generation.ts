import { CreditTransactionType, GenerationStatus, Prisma } from "@prisma/client";
import {
  buildArtDirection,
  buildPrompt,
  createBriefSchema,
  factsForQc,
  mergeRegeneratedBrief,
  scoreQuality,
  type CreateBriefInput,
} from "@/lib/flyermint";
import { applyRepair, parseQcReport, qcPrompt, shouldRepair, skippedQcReport } from "@/lib/quality-control";
import { prisma } from "@/lib/prisma";
import { consumeOneMint, grantCredits } from "@/server/credits";
import { generateWithRodium, reviewPosterQuality } from "@/server/rodium";
import { saveBrandKit } from "@/server/brand-kit";
import {
  briefSubjectText,
  loadDomainInspirationAnalyses,
  loadVisualReferenceForDomain,
} from "@/lib/inspiration-source";

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

  const [library, visualReference] = await Promise.all([
    loadDomainInspirationAnalyses(brief.domain, 3),
    Promise.race([
      loadVisualReferenceForDomain(brief.domain, briefSubjectText(brief)),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8_000)),
    ]),
  ]);
  const artDirection = buildArtDirection(brief, library);
  if (visualReference) {
    artDirection.reference_ids = [`insp-${visualReference.id}`, ...artDirection.reference_ids];
    artDirection.composition = `${visualReference.creativeDna.composition}. ${artDirection.composition}`;
    artDirection.background = visualReference.creativeDna.background || artDirection.background;
    if (visualReference.creativeDna.colorPalette.length >= 2) {
      artDirection.color_palette = visualReference.creativeDna.colorPalette.slice(0, 3);
    }
  }

  const hasVisualRef = Boolean(visualReference?.dataUrl);
  let prompt = buildPrompt(brief, artDirection, {
    hasVisualRef,
    creativeDna: visualReference?.creativeDna ?? null,
  });
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
    const first = await generateWithRodium({
      prompt,
      brief,
      styleReferenceDataUrl: visualReference?.dataUrl,
    });
    if (!first.imageUrl) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");

    let imageUrl = first.imageUrl;
    let model = first.model;
    let rodiCost = first.rodiCostEstimate;
    let qc = skippedQcReport();
    let repaired = false;
    let visualRefUsed = first.visualRefSent === true;
    const referenceCopy = visualRefUsed;
    const referenceDataUrl = referenceCopy ? visualReference?.dataUrl : undefined;

    const qcRaw = await reviewPosterQuality({
      imageUrl,
      prompt: qcPrompt(brief.title, brief.domain, factsForQc(brief), { referenceCopy }),
      referenceDataUrl,
    });
    if (qcRaw) {
      qc = parseQcReport(qcRaw);
      if (shouldRepair(qc)) {
        prompt = applyRepair(prompt, qc, { referenceCopy });
        const second = await generateWithRodium({
          prompt,
          brief,
          styleReferenceDataUrl: visualReference?.dataUrl,
        });
        if (second.imageUrl) {
          imageUrl = second.imageUrl;
          model = `${first.model}+repair:${second.model}`;
          rodiCost = Number((first.rodiCostEstimate + second.rodiCostEstimate).toFixed(3));
          repaired = true;
          visualRefUsed = visualRefUsed || second.visualRefSent === true;
          const secondQc = await reviewPosterQuality({
            imageUrl,
            prompt: qcPrompt(brief.title, brief.domain, factsForQc(brief), { referenceCopy }),
            referenceDataUrl,
          });
          if (secondQc) qc = parseQcReport(secondQc);
        }
      }
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
        model,
        rodiCost,
        outputUrl: imageUrl,
        qualityScore: qualityScores.overall_score,
        qualityDetails: {
          ...qualityScores,
          qc,
          repaired,
          visual_ref_used: visualRefUsed,
          reference_id: visualReference?.id ?? null,
          reference_storage_path: visualReference?.storagePath ?? null,
          creative_dna: visualReference?.creativeDna ?? null,
          durationMs: Date.now() - generation.createdAt.getTime(),
          checks: ["human_required", "art_direction", "qc_vision", "visual_reference"],
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
