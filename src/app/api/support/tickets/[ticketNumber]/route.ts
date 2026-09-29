import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { getUserTicket } from "@/server/support";
import { requireActiveCurrentUser } from "@/server/users";

type Params = { params: Promise<{ ticketNumber: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireActiveCurrentUser();
    const { ticketNumber } = await params;
    const ticket = await getUserTicket(user.id, ticketNumber);
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}
