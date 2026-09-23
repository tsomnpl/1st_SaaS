import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { adminTicketSchema } from "@/lib/support-schema";
import { addTicketMessage, getTicketForActor, updateTicketByAdmin } from "@/server/support";

type Params = Promise<{ id: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  try {
    const admin = await requireAdminUser();
    const { id } = await params;
    const ticket = await getTicketForActor({ ticketId: id, actorId: admin.id, isAdmin: true });
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    return safeJsonError(error);
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const admin = await requireAdminUser();
    const { id } = await params;
    const body = adminTicketSchema.parse(await request.json());
    if (body.body) {
      await addTicketMessage({
        ticketId: id,
        actorId: admin.id,
        isAdmin: true,
        body: body.body,
        visibility: body.visibility ?? "PUBLIC",
      });
    }
    const ticket = await updateTicketByAdmin({
      ticketId: id,
      adminUserId: admin.id,
      status: body.status,
      priority: body.priority,
      queue: body.queue,
      assigneeUserId: body.assigneeUserId,
    });
    return NextResponse.json({ ok: true, status: ticket.status, priority: ticket.priority });
  } catch (error) {
    return safeJsonError(error);
  }
}
