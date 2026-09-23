import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { createTicketSchema } from "@/lib/support-schema";
import { requireActiveCurrentUser } from "@/server/users";
import { createTicket, listOwnTickets } from "@/server/support";

export async function GET(request: Request) {
  try {
    const user = await requireActiveCurrentUser();
    const page = Number(new URL(request.url).searchParams.get("page") ?? "1");
    const data = await listOwnTickets(user.id, Number.isFinite(page) ? page : 1);
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return safeJsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveCurrentUser();
    const body = createTicketSchema.parse(await request.json());
    const result = await createTicket({ ...body, userId: user.id, email: user.email });
    return NextResponse.json({
      ok: true,
      ticketId: result.ticket.id,
      publicId: result.ticket.publicId,
      category: result.ticket.category,
      status: result.ticket.status,
      similarPublicId: result.similarPublicId,
    });
  } catch (error) {
    return safeJsonError(error);
  }
}
