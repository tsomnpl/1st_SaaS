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
import { loadDomainInspirationAnalyses } from "@/lib/inspiration-source";

export async function runGeneration(clerkUserId: string, unsafeInput: unknown) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const brief = createBriefSchema.parse(unsafeInput);
  const library = await loadDomainInspirationAnalyses(brief.domain, 3);
  const artDirection = buildArtDirection(brief, library);
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
    const parsedOutput = safeJsonParse(result.rawText);
    const outputUrl = String(
      (parsedOutput && (parsedOutput.imageUrl as string)) || "",
    );

    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        model: result.model,
        rodiCost: result.rodiCostEstimate,
        outputUrl: outputUrl || null,
        qualityScore: qualityScores.overall_score,
        qualityDetails: qualityScores as Prisma.JsonObject,
        status: GenerationStatus.COMPLETED,
      },
    });

    return {
      generationId: updated.id,
      outputUrl: updated.outputUrl,
      quality: qualityScores,
      artDirection,
      differentiators: artDirection.differentiators,
      costRodi: result.rodiCostEstimate,
      model: result.model,
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

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
