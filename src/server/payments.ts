import { CreditTransactionType, PaymentStatus, Prisma } from "@prisma/client";
import { env, getAppUrl } from "@/lib/env";
import { sanitizeRecord } from "@/lib/sanitize";
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
  });

  const appUrl = getAppUrl();
  const payload: MoneyFusionInitPayload = {
    totalPrice: plan.priceFcfa,
    article: plan.name,
    numeroSend: params.numeroSend,
    nomclient: params.nomclient,
    personal_Info: payment.orderId,
    return_url: `${appUrl}/payment/success`,
    webhook_url: env.MONEY_FUSION_WEBHOOK_URL ?? `${appUrl}/api/webhooks/moneyfusion`,
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

export function extractPaymentToken(payload: Record<string, unknown>) {
  const nestedData = isRecord(payload.data) ? payload.data : undefined;
  return String(payload.tokenPay ?? payload.token ?? nestedData?.token ?? "").trim();
}

export async function confirmVerifiedPayment(token: string, webhookBody?: Record<string, unknown>) {
  const remote = await verifyMoneyFusionToken(token);
  const remoteStatus = String(
    remote.status ?? remote.statut ?? webhookBody?.status ?? webhookBody?.statut ?? "pending",
  );
  return confirmPaymentByToken(token, {
    ...(webhookBody ?? {}),
    ...remote,
    status: remoteStatus,
    statut: remoteStatus,
  });
}

export async function verifyMoneyFusionToken(token: string) {
  assertMoneyFusionConfigured();
  const verifyUrl = `https://pay.moneyfusion.net/paiementNotif/${token}`;
  const response = await fetch(verifyUrl, { method: "GET" });
  if (!response.ok) throw new Error("PAYMENT_VERIFY_FAILED");
  return (await response.json()) as Record<string, unknown>;
}

export function classifyPaymentStatus(raw: string): PaymentStatus {
  const normalized = raw.toLowerCase();
  if (
    normalized.includes("paid") ||
    normalized.includes("completed") ||
    normalized.includes("success") ||
    normalized.includes("payé") ||
    normalized.includes("paye")
  ) {
    return PaymentStatus.COMPLETED;
  }
  if (normalized.includes("cancel") || normalized.includes("annul")) {
    return PaymentStatus.CANCELLED;
  }
  if (normalized.includes("fail") || normalized.includes("error") || normalized.includes("refus")) {
    return PaymentStatus.FAILED;
  }
  return PaymentStatus.PENDING;
}

export async function confirmPaymentByToken(token: string, payload?: Record<string, unknown>) {
  const payment = await prisma.payment.findUnique({
    where: { tokenPay: token },
    include: { plan: true },
  });
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  const remoteStatus = String(payload?.status ?? payload?.statut ?? payment.rawStatus ?? "pending");
  const classified = classifyPaymentStatus(remoteStatus);
  const eventKey = `moneyfusion:${token}:${classified}`;
  const safePayload = sanitizeRecord(payload ?? { token, status: remoteStatus }) as Prisma.InputJsonValue;

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "MONEY_FUSION",
        eventKey,
        payload: safePayload,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    }
    throw error;
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return payment;
  }

  const payloadOrderId = getStringField(payload, ["orderId", "order_id", "personal_Info"]);
  const payloadAmount = getNumericField(payload, ["amount", "totalPrice", "montant"]);

  if (payloadOrderId && !String(payloadOrderId).includes(payment.orderId)) {
    throw new Error("PAYMENT_ORDER_MISMATCH");
  }
  if (typeof payloadAmount === "number" && payloadAmount > 0 && payloadAmount !== payment.amountFcfa) {
    throw new Error("PAYMENT_AMOUNT_MISMATCH");
  }

  if (classified !== PaymentStatus.COMPLETED) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: classified === PaymentStatus.PENDING ? payment.status : classified,
        rawStatus: remoteStatus,
        rawResponse: payload ? safePayload : Prisma.JsonNull,
        webhookState: classified,
      },
    });
    return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: {
        id: payment.id,
        status: { not: PaymentStatus.COMPLETED },
        creditedAt: null,
      },
      data: {
        status: PaymentStatus.COMPLETED,
        rawStatus: remoteStatus,
        rawResponse: payload ? safePayload : Prisma.JsonNull,
        webhookState: "COMPLETED",
        creditedAt: new Date(),
      },
    });
    if (claimed.count === 0) return;

    const alreadyGranted = await tx.creditTransaction.findFirst({
      where: {
        userId: payment.userId,
        type: CreditTransactionType.PURCHASE,
        reference: payment.orderId,
      },
    });
    if (alreadyGranted) return;

    await grantCredits(
      payment.userId,
      payment.plan.mintAmount,
      CreditTransactionType.PURCHASE,
      {
        tx,
        reference: payment.orderId,
        metadata: {
          planCode: payment.plan.code,
          tokenPay: payment.tokenPay,
        },
      },
      payment.plan.durationDays
        ? new Date(Date.now() + payment.plan.durationDays * 86400000)
        : null,
    );
  });

  return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
}

function getStringField(payload: Record<string, unknown> | undefined, keys: string[]) {
  if (!payload) return undefined;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value) && value.length > 0) return JSON.stringify(value);
  }
  return undefined;
}

function getNumericField(payload: Record<string, unknown> | undefined, keys: string[]) {
  if (!payload) return undefined;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
