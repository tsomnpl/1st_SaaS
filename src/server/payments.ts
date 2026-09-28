import { CreditTransactionType, PaymentStatus, Prisma } from "@prisma/client";
import { env, getAppUrl } from "@/lib/env";
import { sanitizeRecord } from "@/lib/sanitize";
import { prisma } from "@/lib/prisma";
import { grantCredits } from "@/server/credits";
import { notifyAdmin, sendPaymentConfirmed, sendPaymentFailed } from "@/server/mail";
import { isLaunchOfferOpen, LAUNCH_OFFER_CODE } from "@/lib/plans";
import { ensureOfficialPlans } from "@/server/plans";

type MoneyFusionInitPayload = {
  totalPrice: number;
  article: Array<Record<string, number>>;
  numeroSend: string;
  nomclient: string;
  personal_Info: Array<{ orderId: string; userId: string }>;
  return_url: string;
  webhook_url: string;
};

type MoneyFusionInitResponse = {
  statut?: boolean | string;
  token?: string;
  message?: string;
  url?: string;
};

function assertMoneyFusionConfigured() {
  if (!env.MONEY_FUSION_API_URL) throw new Error("MONEY_FUSION_API_URL_MISSING");
  if (!env.NEXT_PUBLIC_APP_URL) throw new Error("NEXT_PUBLIC_APP_URL_MISSING");
}

export function moneyFusionInitUrl(apiUrl: string) {
  const url = new URL(apiUrl);
  const path = url.pathname.replace(/\/+$/, "");
  if (path.endsWith("/pay") || path.endsWith("/paiement")) {
    url.pathname = path;
  } else {
    url.pathname = `${path}/paiement`.replace(/\/{2,}/g, "/");
  }
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function buildMoneyFusionPayload(input: {
  totalPrice: number;
  articleName: string;
  orderId: string;
  userId: string;
  nomclient: string;
  returnUrl: string;
  webhookUrl: string;
}): MoneyFusionInitPayload {
  const articleName = input.articleName.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 40) || "Pack";
  const nomclient = input.nomclient.trim().slice(0, 80) || "Client FlyerMint";
  return {
    totalPrice: input.totalPrice,
    article: [{ [articleName]: input.totalPrice }],
    numeroSend: "00000000",
    nomclient,
    personal_Info: [{ orderId: input.orderId, userId: input.userId }],
    return_url: input.returnUrl,
    webhook_url: input.webhookUrl,
  };
}

export async function initMoneyFusionPayment(params: {
  userId: string;
  planCode: string;
}) {
  assertMoneyFusionConfigured();
  await ensureOfficialPlans();

  const plan = await prisma.plan.findUnique({ where: { code: params.planCode } });
  if (!plan || !plan.active || plan.priceFcfa <= 0) {
    throw new Error("PLAN_INVALID");
  }
  if (plan.code === LAUNCH_OFFER_CODE && !isLaunchOfferOpen()) {
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
  const account = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true, email: true },
  });
  const payload = buildMoneyFusionPayload({
    totalPrice: plan.priceFcfa,
    articleName: plan.name,
    orderId: payment.orderId,
    userId: params.userId,
    nomclient: account?.name || account?.email?.split("@")[0] || "Client FlyerMint",
    returnUrl: `${appUrl}/payment/success`,
    webhookUrl: env.MONEY_FUSION_WEBHOOK_URL ?? `${appUrl}/api/webhooks/moneyfusion`,
  });

  const apiUrl = env.MONEY_FUSION_API_URL;
  if (!apiUrl) throw new Error("MONEY_FUSION_API_URL_MISSING");
  const endpoint = moneyFusionInitUrl(apiUrl);
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
    await emailPaymentOutcome(params.userId, "failed", {
      orderId: payment.orderId,
      planName: plan.name,
      amountFcfa: plan.priceFcfa,
      mintAmount: plan.mintAmount,
    });
    throw new Error("PAYMENT_INIT_FAILED");
  }

  const recordedStatus = moneyFusionRecordedStatus(body.statut, body.message);
  try {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        tokenPay: body.token,
        rawStatus: recordedStatus,
        rawResponse: body as Prisma.JsonObject,
      },
    });
  } catch {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        tokenPay: body.token,
        rawStatus: "pending",
      },
    });
  }

  return { checkoutUrl: body.url, tokenPay: body.token, orderId: payment.orderId };
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
  if (normalized.includes("no paid") || normalized.includes("nopaid") || normalized.includes("unpaid")) {
    return PaymentStatus.PENDING;
  }
  if (normalized.includes("cancel") || normalized.includes("annul")) {
    return PaymentStatus.CANCELLED;
  }
  if (normalized.includes("fail") || normalized.includes("error") || normalized.includes("refus")) {
    return PaymentStatus.FAILED;
  }
  if (
    normalized.includes("paid") ||
    normalized.includes("completed") ||
    normalized.includes("success") ||
    normalized.includes("payé") ||
    normalized.includes("paye")
  ) {
    return PaymentStatus.COMPLETED;
  }
  return PaymentStatus.PENDING;
}

export function moneyFusionRecordedStatus(statut: unknown, message?: unknown) {
  if (typeof statut === "string" && statut.trim()) return statut.trim().slice(0, 120);
  if (typeof message === "string" && message.trim()) return message.trim().slice(0, 120);
  if (statut === false) return "failed";
  return "pending";
}

export function moneyFusionStatusText(payload?: Record<string, unknown>) {
  const event = typeof payload?.event === "string" ? payload.event : "";
  const status = payload?.status ?? payload?.statut ?? "";
  return [event, typeof status === "string" ? status : ""].filter(Boolean).join(" ");
}

export async function confirmPaymentByToken(token: string, payload?: Record<string, unknown>) {
  const payment = await prisma.payment.findUnique({
    where: { tokenPay: token },
    include: { plan: true, user: { select: { email: true } } },
  });
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  const remoteStatus = moneyFusionStatusText(payload) || String(payment.rawStatus ?? "pending");
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
  const payloadAmount = getNumericField(payload, ["amount", "totalPrice"]);

  if (payloadOrderId && !String(payloadOrderId).includes(payment.orderId)) {
    throw new Error("PAYMENT_ORDER_MISMATCH");
  }
  if (typeof payloadAmount === "number" && payloadAmount > 0 && payloadAmount !== payment.amountFcfa) {
    throw new Error("PAYMENT_AMOUNT_MISMATCH");
  }

  const details = {
    orderId: payment.orderId,
    planName: payment.plan.name,
    amountFcfa: payment.amountFcfa,
    mintAmount: payment.plan.mintAmount,
  };

  if (classified !== PaymentStatus.COMPLETED) {
    const nextStatus = classified === PaymentStatus.PENDING ? payment.status : classified;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        rawStatus: remoteStatus,
        rawResponse: payload ? safePayload : Prisma.JsonNull,
        webhookState: classified,
      },
    });
    if (
      (nextStatus === PaymentStatus.FAILED || nextStatus === PaymentStatus.CANCELLED) &&
      payment.status !== nextStatus
    ) {
      await emailPaymentOutcome(payment.userId, "failed", details, payment.user.email);
    }
    return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  }

  let credited = false;
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

    credited = true;
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

  if (credited) {
    await emailPaymentOutcome(payment.userId, "confirmed", details, payment.user.email);
  }

  return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
}

async function emailPaymentOutcome(
  userId: string,
  kind: "confirmed" | "failed",
  details: { orderId: string; planName: string; amountFcfa: number; mintAmount: number },
  knownEmail?: string | null,
) {
  const email =
    knownEmail ??
    (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email;
  if (!email) return;
  const payload = { to: email, ...details };
  if (kind === "confirmed") {
    await sendPaymentConfirmed(payload);
    await notifyAdmin(
      `Paiement confirmé, ${details.orderId}`,
      `Commande ${details.orderId}, ${details.amountFcfa} FCFA, ${details.mintAmount} Mints.`,
      email,
    );
    return;
  }
  await sendPaymentFailed(payload);
  await notifyAdmin(
    `Paiement non abouti, ${details.orderId}`,
    `Commande ${details.orderId}, ${details.amountFcfa} FCFA. Aucun Mint ajouté.`,
    email,
  );
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
