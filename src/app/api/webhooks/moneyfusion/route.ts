import { NextResponse } from "next/server";
import { extractMoneyFusionToken } from "@/lib/money-fusion";
import { confirmPaymentByToken } from "@/server/payments";
import { safeJsonError } from "@/lib/safe-api";
import { recordIncident } from "@/server/incidents";
import { IncidentSeverity } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token = extractMoneyFusionToken(body);
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
    try {
      await recordIncident({
        type: "WEBHOOK_FAILED",
        severity: IncidentSeverity.HIGH,
        service: "payments",
        summary: "Webhook Money Fusion en erreur.",
        detail: error instanceof Error ? error.message.slice(0, 180) : undefined,
      });
    } catch {
      /* incident logging must not hide the webhook response */
    }
    return safeJsonError(error);
  }
}
