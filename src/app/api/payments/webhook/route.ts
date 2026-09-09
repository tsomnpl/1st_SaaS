import { NextResponse } from "next/server";
import { confirmPaymentByToken } from "@/server/payments";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token =
      String(body.tokenPay ?? body.token ?? body.data?.token ?? "").trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "TOKEN_MISSING" }, { status: 400 });
    }

    const payment = await confirmPaymentByToken(token, body);
    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      status: payment.status,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 400 },
    );
  }
}
