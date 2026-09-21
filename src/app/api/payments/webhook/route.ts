import { NextResponse } from "next/server";
import { confirmVerifiedPayment, extractPaymentToken } from "@/server/payments";
import { safeJsonError } from "@/lib/safe-api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token = extractPaymentToken(body);
    if (!token) {
      return NextResponse.json({ ok: false, error: "TOKEN_MISSING" }, { status: 400 });
    }

    const payment = await confirmVerifiedPayment(token, body);
    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      status: payment.status,
    });
  } catch (error) {
    return safeJsonError(error);
  }
}
