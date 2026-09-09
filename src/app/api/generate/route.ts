import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runGeneration } from "@/server/generation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await runGeneration(session.userId, body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 400 },
    );
  }
}
