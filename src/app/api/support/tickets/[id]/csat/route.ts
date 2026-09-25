import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { csatSchema } from "@/lib/support-schema";
import { requireActiveCurrentUser } from "@/server/users";
import { submitTicketCsat } from "@/server/support";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const body = csatSchema.parse(await request.json());
    const result = await submitTicketCsat({ userId: user.id, ticketId: id, ...body });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return safeJsonError(error);
  }
}
