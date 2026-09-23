import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { requireActiveCurrentUser } from "@/server/users";
import { voteSuggestion } from "@/server/feedback";

type Params = Promise<{ id: string }>;

export async function POST(_: Request, { params }: { params: Params }) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const vote = await voteSuggestion(user.id, id);
    return NextResponse.json({ ok: true, id: vote?.id ?? null });
  } catch (error) {
    return safeJsonError(error);
  }
}
