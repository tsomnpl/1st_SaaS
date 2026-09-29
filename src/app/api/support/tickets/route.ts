import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { createSupportTicket, listUserTickets } from "@/server/support";
import { requireActiveCurrentUser } from "@/server/users";

export async function GET() {
  try {
    const user = await requireActiveCurrentUser();
    const tickets = await listUserTickets(user.id);
    return NextResponse.json({ ok: true, tickets });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveCurrentUser();
    const body = await request.json().catch(() => null);
    const ticket = await createSupportTicket(body, user.id);
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}
