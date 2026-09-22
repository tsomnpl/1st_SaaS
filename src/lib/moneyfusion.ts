/** Dashboard API links are posted to directly. Older configs stored only a host. */
export function resolveMoneyFusionPaymentEndpoint(apiUrl: string) {
  const trimmed = apiUrl.trim().replace(/\/+$/, "");
  const path = new URL(trimmed).pathname.replace(/\/+$/, "");
  if (path.endsWith("/pay") || path.endsWith("/paiement")) return trimmed;
  return `${trimmed}/paiement`;
}

/** The success page is a browser return URL, not the server webhook. */
export function resolveMoneyFusionWebhookUrl(params: {
  appUrl: string;
  configured?: string;
}) {
  const fallback = `${params.appUrl.replace(/\/+$/, "")}/api/webhooks/moneyfusion`;
  if (!params.configured) return fallback;
  const path = new URL(params.configured).pathname.replace(/\/+$/, "");
  if (path === "/payment/success") return fallback;
  return params.configured;
}
