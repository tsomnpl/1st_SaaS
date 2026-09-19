import { NextResponse } from "next/server";
import { confirmPaymentByToken } from "@/server/payments";
import { safeJsonError } from "@/lib/safe-api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token = extractToken(body);
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
    return safeJsonError(error);
  }
}

function extractToken(payload: Record<string, unknown>) {
  const nestedData = isRecord(payload.data) ? payload.data : undefined;
  return String(payload.tokenPay ?? payload.token ?? nestedData?.token ?? "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
