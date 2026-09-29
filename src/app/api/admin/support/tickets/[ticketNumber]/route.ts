import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { adminPatchSchema } from "@/lib/support";
import { getAdminTicket, patchAdminTicket } from "@/server/support";

type Params = { params: Promise<{ ticketNumber: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdminUser();
    const { ticketNumber } = await params;
    const ticket = await getAdminTicket(ticketNumber);
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    return safeJsonError(error, 403);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const admin = await requireAdminUser();
    const { ticketNumber } = await params;
    const body = await request.json().catch(() => null);
    const parsed = adminPatchSchema.safeParse(body);
    if (!parsed.success) throw new Error("INVALID_SUPPORT");
    const ticket = await patchAdminTicket(admin.id, ticketNumber, parsed.data);
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}
