import { NextResponse } from "next/server";
import { runSupportMaintenance } from "@/server/support-jobs";

export async function POST(request: Request) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  const header = request.headers.get("authorization") ?? "";
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const result = await runSupportMaintenance();
  return NextResponse.json({ ok: true, ...result });
}
