import { NextResponse } from "next/server";
import { currentUserIsAdmin } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { readSupportAttachment } from "@/server/support";
import { requireActiveCurrentUser } from "@/server/users";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const asAdmin = await currentUserIsAdmin();
    const file = await readSupportAttachment({ attachmentId: id, userId: user.id, asAdmin });
    const name = file.fileName.replace(/["\r\n]/g, "");
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}
