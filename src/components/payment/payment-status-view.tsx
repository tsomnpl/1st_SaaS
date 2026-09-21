"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PaymentUiStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED" | "UNKNOWN";

const COPY: Record<
  PaymentUiStatus,
  { title: string; text: string; tone: string }
> = {
  PENDING: {
    title: "Paiement en cours de confirmation",
    text: "Cette page n’est pas une preuve de paiement. Tes Mints seront crédités uniquement lorsque Money Fusion confirme le règlement côté serveur.",
    tone: "text-[#111827]",
  },
  COMPLETED: {
    title: "Paiement confirmé",
    text: "Les Mints du pack ont été ajoutés à ton compte. Tu peux créer une affiche tout de suite.",
    tone: "text-[#20C997]",
  },
  CANCELLED: {
    title: "Paiement annulé",
    text: "Aucun Mint n’a été crédité. Tu peux relancer un achat quand tu veux.",
    tone: "text-[#111827]",
  },
  FAILED: {
    title: "Paiement échoué",
    text: "Le règlement n’a pas abouti. Aucun Mint n’a été débité ni crédité.",
    tone: "text-red-700",
  },
  UNKNOWN: {
    title: "Statut du paiement",
    text: "Nous n’avons pas encore de confirmation. Si tu viens de payer, attends quelques secondes : le crédit ne dépend pas de cette page.",
    tone: "text-[#111827]",
  },
};

export function PaymentStatusView({
  token,
  orderId,
  initialStatus = "UNKNOWN",
}: {
  token?: string;
  orderId?: string;
  initialStatus?: PaymentUiStatus;
}) {
  const [status, setStatus] = useState<PaymentUiStatus>(initialStatus);
  const [checking, setChecking] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    const payToken = token;
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const response = await fetch(`/api/payments/verify/${encodeURIComponent(payToken)}`, {
          method: "GET",
          cache: "no-store",
        });
        const body = (await response.json()) as { ok?: boolean; status?: string; error?: string };
        if (cancelled) return;
        const next = classify(body.status);
        setStatus(next);
        if (next === "PENDING" && attempts < 8) {
          window.setTimeout(poll, 2500);
          return;
        }
      } catch {
        if (!cancelled && attempts < 8) {
          window.setTimeout(poll, 2500);
          return;
        }
      }
      if (!cancelled) setChecking(false);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const copy = COPY[status];
  const reference = useMemo(() => orderId || token, [orderId, token]);

  return (
    <div className="card mx-auto max-w-2xl space-y-4 p-6">
      <h1 className={`text-2xl font-extrabold ${copy.tone}`}>{copy.title}</h1>
      <p className="text-slate-600">{copy.text}</p>
      {checking ? (
        <p className="text-sm text-slate-500" role="status">
          Vérification du statut auprès du serveur…
        </p>
      ) : null}
      {reference ? <p className="text-sm text-slate-400">Référence : {reference}</p> : null}
      <div className="flex flex-wrap gap-3">
        {status === "COMPLETED" ? (
          <>
            <Link href="/dashboard" className="btn-primary">
              Tableau de bord
            </Link>
            <Link href="/create" className="btn-secondary">
              Créer une affiche
            </Link>
          </>
        ) : status === "CANCELLED" || status === "FAILED" ? (
          <>
            <Link href="/pricing" className="btn-primary">
              Revenir aux tarifs
            </Link>
            <Link href="/refund" className="btn-secondary">
              Politique de remboursement
            </Link>
          </>
        ) : (
          <>
            <Link href="/dashboard" className="btn-primary">
              Tableau de bord
            </Link>
            <Link href="/pricing" className="btn-secondary">
              Tarifs
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function classify(raw?: string): PaymentUiStatus {
  const value = String(raw ?? "").toUpperCase();
  if (value === "COMPLETED" || value === "PAID" || value === "SUCCESS") return "COMPLETED";
  if (value === "CANCELLED" || value === "CANCELED") return "CANCELLED";
  if (value === "FAILED") return "FAILED";
  if (value === "PENDING") return "PENDING";
  return "UNKNOWN";
}
