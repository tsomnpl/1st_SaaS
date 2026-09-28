import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { cancelPendingMintGrant } from "@/server/mint-grants";

type Params = Promise<{ id: string }>;

export async function POST(_request: Request, context: { params: Params }) {
  try {
    const admin = await requireAdminUser();
    const { id } = await context.params;
    await cancelPendingMintGrant({ adminUserId: admin.id, grantId: id });
    return NextResponse.json({ ok: true, id, status: "CANCELLED" });
  } catch (error) {
    return safeJsonError(error);
  }
}
