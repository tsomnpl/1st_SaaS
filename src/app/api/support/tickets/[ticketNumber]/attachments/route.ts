import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { addSupportAttachment } from "@/server/support";
import { requireActiveCurrentUser } from "@/server/users";

type Params = { params: Promise<{ ticketNumber: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireActiveCurrentUser();
    const { ticketNumber } = await params;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("INVALID_ATTACHMENT");
    const bytes = Buffer.from(await file.arrayBuffer());
    const attachment = await addSupportAttachment({
      userId: user.id,
      ticketNumber,
      fileName: file.name,
      declaredMime: file.type,
      bytes,
    });
    return NextResponse.json({ ok: true, attachment });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}
