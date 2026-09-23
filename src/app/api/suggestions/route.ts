import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { suggestionSchema } from "@/lib/support-schema";
import { requireActiveCurrentUser } from "@/server/users";
import { createSuggestion } from "@/server/feedback";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireActiveCurrentUser();
    const items = await prisma.suggestion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { _count: { select: { votes: true } } },
    });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return safeJsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveCurrentUser();
    const body = suggestionSchema.parse(await request.json());
    const item = await createSuggestion({ userId: user.id, ...body });
    return NextResponse.json({ ok: true, id: item.id, status: item.status });
  } catch (error) {
    return safeJsonError(error);
  }
}
