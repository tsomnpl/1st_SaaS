import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { userMessageSchema } from "@/lib/support";
import { addUserMessage } from "@/server/support";
import { requireActiveCurrentUser } from "@/server/users";

type Params = { params: Promise<{ ticketNumber: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireActiveCurrentUser();
    const { ticketNumber } = await params;
    const body = await request.json().catch(() => null);
    const parsed = userMessageSchema.safeParse(body);
    if (!parsed.success) throw new Error("INVALID_SUPPORT");
    const ticket = await addUserMessage(user.id, ticketNumber, parsed.data.message);
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}
