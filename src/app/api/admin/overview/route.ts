import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getAdminStats, type AdminPeriod } from "@/server/admin-stats";
import { safeJsonError } from "@/lib/safe-api";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const period = (new URL(request.url).searchParams.get("period") ?? "30") as AdminPeriod;
    const stats = await getAdminStats(["1", "7", "30", "90", "365", "all"].includes(period) ? period : "30");
    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    return safeJsonError(error, 403);
  }
}
