import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/errors";
import { runGeneration } from "@/server/generation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await runGeneration(session.userId, body);
    return NextResponse.json({
      ok: true,
      generationId: result.generationId,
      outputUrl: result.outputUrl,
      repaired: result.repaired,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: publicErrorMessage(error) },
      { status: 400 },
    );
  }
}
