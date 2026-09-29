import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { listAdminTickets, supportStats } from "@/server/support";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);
    const [tickets, stats] = await Promise.all([
      listAdminTickets({
        q: url.searchParams.get("q") ?? "",
        status: url.searchParams.get("status") ?? "",
        priority: url.searchParams.get("priority") ?? "",
        category: url.searchParams.get("category") ?? "",
      }),
      supportStats(),
    ]);
    return NextResponse.json({ ok: true, tickets, stats });
  } catch (error) {
    return safeJsonError(error, 403);
  }
}
