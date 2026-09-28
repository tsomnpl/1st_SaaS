import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { mintAdminMax, adjustUserMints } from "@/server/mint-grants";

const adjustSchema = z.object({
  targetUserId: z.string().min(3).max(80),
  amount: z.number().int().min(-5000).max(5000).refine((value) => value !== 0),
  reason: z.string().min(2).max(240),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = adjustSchema.parse(await request.json());
    const max = mintAdminMax();
    if (Math.abs(body.amount) > max) {
      throw new Error("INVALID_MINT_AMOUNT");
    }
    const result = await adjustUserMints({
      adminUserId: admin.id,
      targetUserId: body.targetUserId,
      amount: body.amount,
      reason: body.reason,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return safeJsonError(error);
  }
}
