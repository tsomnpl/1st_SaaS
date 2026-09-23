import { Prisma, SuggestionCategory, SuggestionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function saveGenerationFeedback(input: {
  userId: string;
  generationId: string;
  rating?: number | null;
  comment?: string | null;
  dismissed?: boolean;
}) {
  const generation = await prisma.generation.findFirst({
    where: { id: input.generationId, userId: input.userId, status: "COMPLETED" },
  });
  if (!generation) throw new Error("NOT_FOUND");
  const existing = await prisma.generationFeedback.findUnique({ where: { generationId: generation.id } });
  if (existing && !input.dismissed && existing.rating) throw new Error("FEEDBACK_EXISTS");
  if (existing && input.dismissed) {
    return prisma.generationFeedback.update({ where: { id: existing.id }, data: { dismissed: true } });
  }
  if (input.rating !== undefined && input.rating !== null && (input.rating < 1 || input.rating > 5)) {
    throw new Error("INVALID_TICKET");
  }
  if (existing) {
    return prisma.generationFeedback.update({
      where: { id: existing.id },
      data: {
        rating: input.rating ?? existing.rating,
        comment: input.comment?.slice(0, 1000) ?? existing.comment,
        dismissed: false,
      },
    });
  }
  return prisma.generationFeedback.create({
    data: {
      generationId: generation.id,
      userId: input.userId,
      rating: input.rating ?? null,
      comment: input.comment?.slice(0, 1000) ?? null,
      dismissed: Boolean(input.dismissed),
    },
  });
}

export async function createSuggestion(input: {
  userId: string;
  category: SuggestionCategory;
  title: string;
  body: string;
}) {
  return prisma.suggestion.create({
    data: {
      userId: input.userId,
      category: input.category,
      title: input.title.trim().slice(0, 140),
      body: input.body.trim().slice(0, 2000),
      status: SuggestionStatus.NEW,
    },
  });
}

export async function voteSuggestion(userId: string, suggestionId: string) {
  try {
    return await prisma.suggestionVote.create({ data: { userId, suggestionId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.suggestionVote.findFirst({ where: { userId, suggestionId } });
    }
    throw error;
  }
}

export async function updateSuggestionStatus(input: {
  suggestionId: string;
  status: SuggestionStatus;
  adminUserId: string;
}) {
  const { writeAdminLog } = await import("@/server/admin-audit");
  const row = await prisma.suggestion.update({
    where: { id: input.suggestionId },
    data: { status: input.status },
  });
  await writeAdminLog({
    adminUserId: input.adminUserId,
    action: "SUGGESTION_STATUS",
    targetType: "SUGGESTION",
    targetId: row.id,
    metadata: { status: input.status },
  });
  return row;
}
