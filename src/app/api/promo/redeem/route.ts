import { NextResponse } from "next/server";
import { z } from "zod";
import { safeJsonError } from "@/lib/safe-api";
import { redeemPromoCode } from "@/server/promo";
import { getOrCreateCurrentUser } from "@/server/users";

const bodySchema = z.object({
  code: z.string().min(1).max(40),
});

export async function POST(request: Request) {
  try {
    const user = await getOrCreateCurrentUser();
    const body = bodySchema.parse(await request.json());
    const result = await redeemPromoCode(user.id, body.code);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return safeJsonError(error);
  }
}
