import { NextResponse } from "next/server";
import { confirmPaymentByToken, verifyMoneyFusionToken } from "@/server/payments";

type Params = Promise<{ token: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  try {
    const token = (await params).token;
    const payload = await verifyMoneyFusionToken(token);
    const payment = await confirmPaymentByToken(token, payload);
    return NextResponse.json({ ok: true, status: payment.status });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 400 },
    );
  }
}
