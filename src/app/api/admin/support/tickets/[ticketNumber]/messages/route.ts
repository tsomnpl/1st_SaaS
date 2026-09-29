import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { adminReplySchema } from "@/lib/support";
import { addAdminReply } from "@/server/support";

type Params = { params: Promise<{ ticketNumber: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const admin = await requireAdminUser();
    const { ticketNumber } = await params;
    const body = await request.json().catch(() => null);
    const parsed = adminReplySchema.safeParse(body);
    if (!parsed.success) throw new Error("INVALID_SUPPORT");
    const ticket = await addAdminReply(admin.id, ticketNumber, parsed.data.message);
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}
