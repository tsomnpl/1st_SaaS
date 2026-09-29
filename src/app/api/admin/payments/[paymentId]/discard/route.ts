import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { discardPayment } from "@/server/payment-discard";

type Params = Promise<{ paymentId: string }>;

export async function POST(_request: Request, context: { params: Params }) {
  try {
    const admin = await requireAdminUser();
    const { paymentId } = await context.params;
    const payment = await discardPayment({ adminUserId: admin.id, paymentId });
    return NextResponse.json({ ok: true, ...payment });
  } catch (error) {
    return safeJsonError(error);
  }
}
