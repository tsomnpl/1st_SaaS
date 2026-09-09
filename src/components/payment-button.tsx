"use client";

import { useState } from "react";

type Props = {
  planCode: string;
  label: string;
};

export function PaymentButton({ planCode, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode,
          numeroSend: "0000000000",
          nomclient: "FlyerMint Client",
        }),
      });
      const data = (await response.json()) as { ok: boolean; checkoutUrl?: string; error?: string };
      if (!data.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "PAYMENT_INIT_FAILED");
      }
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur paiement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={startPayment}
        disabled={loading}
        className="rounded bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
      >
        {loading ? "Redirection..." : label}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
