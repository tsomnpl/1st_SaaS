"use client";

import { useState } from "react";
import { formatFcfa } from "@/lib/plans";
import { publicErrorMessage } from "@/lib/errors";

type Props = {
  planCode: string;
  planName: string;
  priceFcfa: number;
  mintAmount: number;
};

export function CheckoutForm({ planCode, planName, priceFcfa, mintAmount }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const data = (await response.json()) as { ok: boolean; checkoutUrl?: string; error?: string };
      if (!data.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "PAYMENT_INIT_FAILED");
      }
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(publicErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mx-auto max-w-lg space-y-5 p-6">
      <div>
        <p className="text-sm text-slate-500">{planName}</p>
        <p className="mt-1 text-3xl font-extrabold">{formatFcfa(priceFcfa)}</p>
        <p className="mt-1 text-sm text-slate-600">
          {mintAmount} Mints = {mintAmount} affiches · 1 Mint = 1 affiche
        </p>
      </div>
      <p className="text-sm text-slate-600">
        La page Money Fusion demande ensuite le pays et le numéro, puis le moyen de paiement.
      </p>
      <button type="button" onClick={startPayment} disabled={loading} className="btn-primary w-full">
        {loading ? "Redirection…" : "Payer avec Money Fusion"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
