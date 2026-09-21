function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function extractMoneyFusionToken(payload: Record<string, unknown>) {
  const nestedData = isRecord(payload.data) ? payload.data : undefined;
  const tokenPay = isRecord(payload.tokenPay) ? undefined : payload.tokenPay;
  return String(
    tokenPay ?? payload.token ?? nestedData?.tokenPay ?? nestedData?.token ?? "",
  ).trim();
}

export const MONEY_FUSION_SAMPLE_PAID_PAYLOAD = {
  statut: true,
  token: "MF-TEST-9f3c2a1b",
  tokenPay: "MF-TEST-9f3c2a1b",
  message: "paiement effectué",
  data: {
    token: "MF-TEST-9f3c2a1b",
    status: "paid",
    montant: 2000,
    numeroSend: "2250700000000",
    nomclient: "Client Test",
  },
} as const;
