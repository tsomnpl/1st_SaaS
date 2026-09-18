"use client";

import { useState } from "react";
import { formatFcfa } from "@/lib/plans";

type Props = {
  planCode: string;
  planName: string;
  priceFcfa: number;
  mintAmount: number;
};

export function CheckoutForm({ planCode, planName, priceFcfa, mintAmount }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numeroSend, setNumeroSend] = useState("");
  const [nomclient, setNomclient] = useState("");
  const canStart = Boolean(numeroSend.trim() && nomclient.trim());

  async function startPayment() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode,
          numeroSend: numeroSend.trim(),
          nomclient: nomclient.trim(),
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
    <div className="card mx-auto max-w-lg space-y-5 p-6">
      <div>
        <p className="text-sm text-slate-500">{planName}</p>
        <p className="mt-1 text-3xl font-extrabold">{formatFcfa(priceFcfa)}</p>
        <p className="mt-1 text-sm text-slate-600">
          {mintAmount} Mints = {mintAmount} affiches · 1 Mint = 1 affiche
        </p>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Nom du payeur</span>
        <input
          value={nomclient}
          onChange={(e) => setNomclient(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-[#6D28D9] focus:ring-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Numéro de paiement</span>
        <input
          value={numeroSend}
          onChange={(e) => setNumeroSend(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-[#6D28D9] focus:ring-2"
        />
      </label>
      <button type="button" onClick={startPayment} disabled={loading || !canStart} className="btn-primary w-full">
        {loading ? "Redirection…" : "Payer avec Money Fusion"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
