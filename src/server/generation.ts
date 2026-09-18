import { CreditTransactionType, GenerationStatus, Prisma } from "@prisma/client";
import {
  buildArtDirection,
  buildPrompt,
  createBriefSchema,
  scoreQuality,
} from "@/lib/flyermint";
import { prisma } from "@/lib/prisma";
import { consumeOneMint, grantCredits } from "@/server/credits";
import { generateWithRodium } from "@/server/rodium";

export async function runGeneration(clerkUserId: string, unsafeInput: unknown) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.status === "SUSPENDED") throw new Error("ACCOUNT_SUSPENDED");

  const brief = createBriefSchema.parse(unsafeInput);
  const artDirection = buildArtDirection(brief);
  const prompt = buildPrompt(brief, artDirection);
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
    const result = await generateWithRodium({ prompt, brief });
    if (!result.imageUrl) {
      throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");
    }

    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        model: result.model,
        rodiCost: result.rodiCostEstimate,
        outputUrl: result.imageUrl,
        qualityScore: qualityScores.overall_score,
        qualityDetails: {
          ...qualityScores,
          durationMs: Date.now() - generation.createdAt.getTime(),
          checks: ["image_present", "prompt_contains_title"],
        } as Prisma.JsonObject,
        status: GenerationStatus.COMPLETED,
      },
    });

    return {
      generationId: updated.id,
      outputUrl: updated.outputUrl,
      quality: qualityScores,
      artDirection,
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
