"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DiscardPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function discard() {
    if (!window.confirm("Supprimer ce paiement ? Aucun Mint n’a été crédité.")) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/payments/${paymentId}/discard`, { method: "POST" });
    if (!response.ok) {
      setBusy(false);
      setError("Suppression impossible.");
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-60"
        disabled={busy}
        onClick={discard}
      >
        {busy ? "Suppression…" : "Supprimer"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}

export function DiscardPendingPaymentsButton({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (count < 1) return null;

  async function discard() {
    if (!window.confirm("Supprimer les paiements en attente et en échec qui n’ont crédité aucun Mint ?")) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/payments/discard-pending", { method: "POST" });
    if (!response.ok) {
      setBusy(false);
      setError("Suppression impossible.");
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn-secondary"
        disabled={busy}
        onClick={discard}
      >
        {busy ? "Suppression…" : `Supprimer les erreurs (${count})`}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
