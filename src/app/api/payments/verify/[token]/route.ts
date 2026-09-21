import { NextResponse } from "next/server";
import { confirmVerifiedPayment } from "@/server/payments";
import { safeJsonError } from "@/lib/safe-api";

type Params = Promise<{ token: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  try {
    const token = (await params).token;
    const payment = await confirmVerifiedPayment(token);
    return NextResponse.json({ ok: true, status: payment.status });
  } catch (error) {
    return safeJsonError(error);
  }
}
