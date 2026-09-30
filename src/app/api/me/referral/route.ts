import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonError } from "@/lib/safe-api";
import { requireActiveCurrentUser } from "@/server/users";

export async function GET() {
  try {
    const user = await requireActiveCurrentUser();
    const referrals = await prisma.referral.findMany({
      where: { referrerUserId: user.id },
      select: { status: true },
    });
    const rewarded = referrals.filter((row) => row.status === "REWARDED").length;
    return NextResponse.json({
      ok: true,
      code: user.referralCode,
      invited: referrals.length,
      rewarded,
    });
  } catch (error) {
    return safeJsonError(error, 401);
  }
}
