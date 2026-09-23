import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { requireActiveCurrentUser } from "@/server/users";
import { currentUserIsAdmin } from "@/lib/auth";
import { getTicketForActor } from "@/server/support";

type Params = Promise<{ id: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const ticket = await getTicketForActor({
      ticketId: id,
      actorId: user.id,
      isAdmin: await currentUserIsAdmin(),
    });
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    return safeJsonError(error);
  }
}
