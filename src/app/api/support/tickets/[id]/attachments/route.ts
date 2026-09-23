import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { currentUserIsAdmin } from "@/lib/auth";
import { requireActiveCurrentUser } from "@/server/users";
import { saveTicketAttachment } from "@/server/support";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("ATTACHMENT_REJECTED");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await saveTicketAttachment({
      ticketId: id,
      actorId: user.id,
      isAdmin: await currentUserIsAdmin(),
      bytes,
      fileName: file.name,
    });
    return NextResponse.json({ ok: true, attachmentId: saved.id, fileName: saved.fileName });
  } catch (error) {
    return safeJsonError(error);
  }
}
