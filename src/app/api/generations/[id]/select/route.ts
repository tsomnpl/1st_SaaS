import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { selectOwnedVariant } from "@/server/generation";

type Params = Promise<{ id: string }>;

export async function POST(_: Request, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session.userId) throw new Error("UNAUTHORIZED");
    const { id } = await params;
    const group = await selectOwnedVariant(session.userId, id);
    return NextResponse.json({ ok: true, selectedVariantId: group.selectedGenerationId });
  } catch (error) {
    return safeJsonError(error);
  }
}
