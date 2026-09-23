import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { currentUserIsAdmin } from "@/lib/auth";
import { requireActiveCurrentUser } from "@/server/users";
import { readTicketAttachment } from "@/server/support";

type Params = Promise<{ id: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const { attachment, bytes } = await readTicketAttachment({
      attachmentId: id,
      actorId: user.id,
      isAdmin: await currentUserIsAdmin(),
    });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return safeJsonError(error);
  }
}
