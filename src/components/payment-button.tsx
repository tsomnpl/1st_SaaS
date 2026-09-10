"use client";

import { useState } from "react";

type Props = {
  planCode: string;
  label: string;
};

export function PaymentButton({ planCode, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numeroSend, setNumeroSend] = useState("");
  const [nomclient, setNomclient] = useState("");
  const canStart = Boolean(numeroSend.trim() && nomclient.trim());

  async function startPayment() {
    setLoading(true);
    setError(null);
    try {
      if (!numeroSend.trim() || !nomclient.trim()) {
        throw new Error("Renseigne ton numero et ton nom avant de payer.");
      }
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
    <div className="space-y-2">
      <input
        value={nomclient}
        onChange={(e) => setNomclient(e.target.value)}
        placeholder="Nom du payeur"
        className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-sm"
      />
      <input
        value={numeroSend}
        onChange={(e) => setNumeroSend(e.target.value)}
        placeholder="Numero de paiement"
        className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={startPayment}
        disabled={loading || !canStart}
        className="rounded bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
      >
        {loading ? "Redirection..." : label}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
