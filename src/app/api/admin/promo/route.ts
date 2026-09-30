import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { createPromoCode, deletePromoCode, listPromoCodes } from "@/server/promo";

const createSchema = z.object({
  code: z.string().min(1).max(40),
  mintAmount: z.number().int(),
  maxUses: z.number().int(),
});

const deleteSchema = z.object({
  id: z.string().min(3).max(80),
});

export async function GET() {
  try {
    await requireAdminUser();
    const codes = await listPromoCodes();
    return NextResponse.json({ ok: true, codes });
  } catch (error) {
    return safeJsonError(error, 403);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = createSchema.parse(await request.json());
    const code = await createPromoCode(admin.id, body);
    return NextResponse.json({ ok: true, code });
  } catch (error) {
    return safeJsonError(error, 403);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = deleteSchema.parse(await request.json());
    await deletePromoCode(admin.id, body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeJsonError(error, 403);
  }
}
