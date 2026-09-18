import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getAdminStats } from "@/server/admin-stats";

export async function GET() {
  try {
    await requireAdminUser();
    const stats = await getAdminStats();
    return NextResponse.json({ ok: true, ...stats });
  } catch {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
}
