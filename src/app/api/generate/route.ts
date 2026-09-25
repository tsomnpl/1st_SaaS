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
    // Return stable error codes; the client maps them via publicErrorMessage.
    const code = error instanceof Error ? error.message : "GENERATION_FAILED";
    const status =
      code === "UNAUTHORIZED"
        ? 401
        : code === "INSUFFICIENT_MINTS" || code === "RODIUM_INSUFFICIENT_BALANCE"
          ? 402
          : 400;
    return NextResponse.json(
      { ok: false, error: code, message: publicErrorMessage(error) },
      { status },
    );
  }
}
