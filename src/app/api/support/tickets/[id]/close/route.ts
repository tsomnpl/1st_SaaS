import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { requireActiveCurrentUser } from "@/server/users";
import { closeOwnTicket } from "@/server/support";

type Params = Promise<{ id: string }>;

export async function POST(_: Request, { params }: { params: Params }) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const ticket = await closeOwnTicket(user.id, id);
    return NextResponse.json({ ok: true, status: ticket.status });
  } catch (error) {
    return safeJsonError(error);
  }
}
