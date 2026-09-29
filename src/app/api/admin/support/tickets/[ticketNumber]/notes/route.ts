import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { adminNoteSchema } from "@/lib/support";
import { addInternalNote } from "@/server/support";

type Params = { params: Promise<{ ticketNumber: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const admin = await requireAdminUser();
    const { ticketNumber } = await params;
    const body = await request.json().catch(() => null);
    const parsed = adminNoteSchema.safeParse(body);
    if (!parsed.success) throw new Error("INVALID_SUPPORT");
    const ticket = await addInternalNote(admin.id, ticketNumber, parsed.data.message);
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}
