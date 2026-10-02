import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { extensionForImage, uploadInspirationSource } from "@/server/inspiration-upload";

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const form = await request.formData();
    const domain = String(form.get("domain") ?? "");
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("INVALID_IMAGE");
    const contentType = extensionForImage(file.type) ? file.type : "";
    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await uploadInspirationSource({ domain, bytes, contentType });
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    return safeJsonError(error);
  }
}
