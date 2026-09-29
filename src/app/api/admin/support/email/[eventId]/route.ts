import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { retrySupportEmail } from "@/server/support";

type Params = { params: Promise<{ eventId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    await requireAdminUser();
    const { eventId } = await params;
    const event = await retrySupportEmail(eventId);
    return NextResponse.json({
      ok: true,
      event: event
        ? { id: event.id, status: event.status, attempts: event.attempts, lastError: event.lastError }
        : null,
    });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}
