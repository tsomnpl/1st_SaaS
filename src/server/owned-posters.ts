import { prisma } from "@/lib/prisma";

export type OwnedPoster = {
  id: string;
  outputUrl: string | null;
  status: string;
  brief: unknown;
  createdAt: Date;
  variant: string | null;
  group: { selectedGenerationId: string | null } | null;
};

export function posterTitle(brief: unknown, fallback: string) {
  if (!brief || typeof brief !== "object") return fallback;
  const title = (brief as { title?: unknown }).title;
  return typeof title === "string" && title.trim() ? title : fallback;
}

export function posterDomain(brief: unknown) {
  if (!brief || typeof brief !== "object") return "";
  const domain = (brief as { domain?: unknown }).domain;
  return typeof domain === "string" ? domain : "";
}

export async function listOwnedPosters(userId: string, take: number): Promise<OwnedPoster[]> {
  try {
    const rows = await prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      include: { group: { select: { selectedGenerationId: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      outputUrl: row.outputUrl,
      status: row.status,
      brief: row.brief,
      createdAt: row.createdAt,
      variant: row.variant,
      group: row.group ? { selectedGenerationId: row.group.selectedGenerationId } : null,
    }));
  } catch (error) {
    console.error("owned-posters", error instanceof Error ? error.message : error);
  }

  try {
    const rows = await prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, outputUrl: true, status: true, brief: true, createdAt: true },
    });
    return rows.map((row) => ({
      id: row.id,
      outputUrl: row.outputUrl,
      status: row.status,
      brief: row.brief,
      createdAt: row.createdAt,
      variant: null,
      group: null,
    }));
  } catch (error) {
    console.error("owned-posters-basic", error instanceof Error ? error.message : error);
    return [];
  }
}
