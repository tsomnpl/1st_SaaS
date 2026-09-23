import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonError } from "@/lib/safe-api";
import { assistantSchema } from "@/lib/support-schema";
import { answerSupportQuestion } from "@/lib/support-policy";
import { requireActiveCurrentUser } from "@/server/users";
import { createTicket } from "@/server/support";

export async function POST(request: Request) {
  try {
    const user = await requireActiveCurrentUser();
    const body = assistantSchema.parse(await request.json());
    const account = await prisma.creditAccount.findUnique({ where: { userId: user.id } });
    const answer = answerSupportQuestion({ message: body.message, mintBalance: account?.balance ?? 0 });
    if (body.transfer) {
      const created = await createTicket({
        userId: user.id,
        email: user.email,
        subject: body.message.slice(0, 140),
        description: body.message,
      });
      return NextResponse.json({
        ok: true,
        reply: `Demande transmise au support : ${created.ticket.publicId}.`,
        escalate: true,
        ticketId: created.ticket.id,
        publicId: created.ticket.publicId,
      });
    }
    return NextResponse.json({ ok: true, reply: answer.reply, escalate: answer.escalate });
  } catch (error) {
    return safeJsonError(error);
  }
}
