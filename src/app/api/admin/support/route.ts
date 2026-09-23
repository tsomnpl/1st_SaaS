import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { listAdminTickets } from "@/server/support";
import { supportDashboardStats } from "@/server/monitoring";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);
    const data = await listAdminTickets({
      status: url.searchParams.get("status") ?? undefined,
      priority: url.searchParams.get("priority") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      queue: url.searchParams.get("queue") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1"),
    });
    const stats = await supportDashboardStats();
    return NextResponse.json({ ok: true, ...data, stats });
  } catch (error) {
    return safeJsonError(error);
  }
}
