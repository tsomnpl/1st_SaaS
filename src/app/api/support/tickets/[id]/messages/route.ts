import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { messageSchema } from "@/lib/support-schema";
import { currentUserIsAdmin } from "@/lib/auth";
import { requireActiveCurrentUser } from "@/server/users";
import { addTicketMessage } from "@/server/support";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const body = messageSchema.parse(await request.json());
    const isAdmin = await currentUserIsAdmin();
    const message = await addTicketMessage({
      ticketId: id,
      actorId: user.id,
      isAdmin,
      body: body.body,
      visibility: isAdmin ? body.visibility : "PUBLIC",
    });
    return NextResponse.json({ ok: true, messageId: message.id, visibility: message.visibility });
  } catch (error) {
    return safeJsonError(error);
  }
}
