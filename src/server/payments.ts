import { CreditTransactionType, PaymentStatus, Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { grantCredits } from "@/server/credits";
import { ensureOfficialPlans } from "@/server/plans";

type MoneyFusionInitPayload = {
  totalPrice: number;
  article: string;
  numeroSend: string;
  nomclient: string;
  personal_Info: string;
  return_url: string;
  webhook_url: string;
};

type MoneyFusionInitResponse = {
  statut?: string;
  token?: string;
  message?: string;
  url?: string;
};

function assertMoneyFusionConfigured() {
  if (!env.MONEY_FUSION_API_URL) throw new Error("MONEY_FUSION_API_URL_MISSING");
  if (!env.NEXT_PUBLIC_APP_URL) throw new Error("NEXT_PUBLIC_APP_URL_MISSING");
}

export async function initMoneyFusionPayment(params: {
  userId: string;
  planCode: string;
  numeroSend: string;
  nomclient: string;
}) {
  assertMoneyFusionConfigured();
  await ensureOfficialPlans();

  const plan = await prisma.plan.findUnique({ where: { code: params.planCode } });
  if (!plan || !plan.active || plan.priceFcfa <= 0) {
    throw new Error("PLAN_INVALID");
  }

  const orderId = `FM-${Date.now()}-${Math.floor(Math.random() * 99999)}`;
  const payment = await prisma.payment.create({
    data: {
      userId: params.userId,
      planId: plan.id,
      orderId,
      amountFcfa: plan.priceFcfa,
      status: PaymentStatus.PENDING,
      provider: "MONEY_FUSION",
    },
    include: { plan: true },
  });

  const payload: MoneyFusionInitPayload = {
    totalPrice: plan.priceFcfa,
    article: plan.name,
    numeroSend: params.numeroSend,
    nomclient: params.nomclient,
    personal_Info: payment.orderId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${payment.orderId}`,
    webhook_url:
      env.MONEY_FUSION_WEBHOOK_URL ??
      `${env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
  };

  const endpoint = `${env.MONEY_FUSION_API_URL}/paiement`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as MoneyFusionInitResponse;
  if (!response.ok || !body.token || !body.url) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        rawResponse: body as Prisma.JsonObject,
      },
    });
    throw new Error("PAYMENT_INIT_FAILED");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      tokenPay: body.token,
      rawStatus: body.statut,
      rawResponse: body as Prisma.JsonObject,
    },
  });

  return { checkoutUrl: body.url, tokenPay: body.token, orderId: payment.orderId };
}

export async function verifyMoneyFusionToken(token: string) {
  assertMoneyFusionConfigured();
  const verifyUrl = `https://pay.moneyfusion.net/paiementNotif/${token}`;
  const response = await fetch(verifyUrl, { method: "GET" });
  if (!response.ok) throw new Error("PAYMENT_VERIFY_FAILED");
  return (await response.json()) as Record<string, unknown>;
}

function isCompletedStatus(raw: string) {
  const normalized = raw.toLowerCase();
  return normalized.includes("paid") || normalized.includes("completed");
}

export async function confirmPaymentByToken(token: string, payload?: Record<string, unknown>) {
  const payment = await prisma.payment.findUnique({
    where: { tokenPay: token },
    include: { plan: true },
  });
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  if (payment.status === PaymentStatus.COMPLETED) {
    return payment;
  }

  const remoteStatus = String(payload?.status ?? payload?.statut ?? payment.rawStatus ?? "pending");
  const shouldComplete = isCompletedStatus(remoteStatus);
  if (!shouldComplete) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        rawStatus: remoteStatus,
        rawResponse: (payload ?? null) as Prisma.JsonObject | null,
      },
    });
    return payment;
  }

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.payment.findUnique({
      where: { id: payment.id },
      include: { plan: true },
    });
    if (!fresh || fresh.status === PaymentStatus.COMPLETED) return;

    await grantCredits(
      fresh.userId,
      fresh.plan.mintAmount,
      CreditTransactionType.PURCHASE,
      {
        tx,
        reference: fresh.orderId,
        metadata: {
          planCode: fresh.plan.code,
          tokenPay: fresh.tokenPay,
        },
      },
      fresh.plan.durationDays ? new Date(Date.now() + fresh.plan.durationDays * 86400000) : null,
    );

    await tx.payment.update({
      where: { id: fresh.id },
      data: {
        status: PaymentStatus.COMPLETED,
        rawStatus: remoteStatus,
        rawResponse: (payload ?? null) as Prisma.JsonObject | null,
        creditedAt: new Date(),
      },
    });
  });

  return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
}
