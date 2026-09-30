"use client";

import { useState } from "react";
import { OfferCountdown } from "@/components/pricing/offer-countdown";
import { isStarterOfferLive } from "@/lib/starter-offer";

type PlanRow = {
  id: string;
  code: string;
  name: string;
  priceFcfa: number;
  mintAmount: number;
  durationDays: number | null;
  editableExport: boolean;
  active: boolean;
  offerDays: number | null;
  offerEndsAt: string | null;
};

export function AdminPlansClient({ plans }: { plans: PlanRow[] }) {
  const [status, setStatus] = useState<string | null>(null);

  async function patch(plan: PlanRow, patchData: Partial<PlanRow> & { offerDays?: number }) {
    const summary = Object.entries(patchData)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(", ");
    if (!window.confirm(`Modifier le plan ${plan.name} (${summary}) ?`)) return;
    const response = await fetch("/api/admin/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id, confirm: true, ...patchData }),
    });
    const data = (await response.json()) as { ok: boolean; error?: string };
    setStatus(data.ok ? "Plan mis à jour." : data.error ?? "Modification refusée.");
    if (data.ok) window.location.reload();
  }

  return (
    <div className="space-y-3">
      {status ? <p className="text-sm text-slate-500">{status}</p> : null}
      {plans.map((plan) => (
        <article key={plan.id} className="admin-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{plan.name}</p>
              <p className="text-sm text-slate-500">
                {plan.code} · {plan.priceFcfa.toLocaleString("fr-FR")} FCFA · {plan.mintAmount} Mints ·{" "}
                {plan.durationDays ? `${plan.durationDays} jours` : "sans expiration"}
                {plan.editableExport ? " · export éditable" : ""}
              </p>
            </div>
            <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${plan.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {plan.active ? "Actif" : "Inactif"}
            </span>
          </div>
          {plan.code === "STARTER_2K" ? <StarterOfferControls plan={plan} onPatch={patch} /> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-secondary px-3 py-1" onClick={() => patch(plan, { active: !plan.active })}>
              {plan.active ? "Désactiver" : "Activer"}
            </button>
            <button
              type="button"
              className="btn-secondary px-3 py-1"
              onClick={() => {
                const next = window.prompt("Nouveau nom", plan.name);
                if (!next) return;
                void patch(plan, { name: next });
              }}
            >
              Renommer
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function StarterOfferControls({
  plan,
  onPatch,
}: {
  plan: PlanRow;
  onPatch: (plan: PlanRow, patchData: Partial<PlanRow> & { offerDays?: number }) => Promise<void>;
}) {
  const [days, setDays] = useState(String(plan.offerDays ?? 30));
  const [mints, setMints] = useState(String(plan.mintAmount));
  const live = isStarterOfferLive(plan);

  return (
    <div className="mt-4 space-y-3 rounded-xl bg-[#F5F3FF] p-4">
      <p className="text-sm font-semibold text-[#6D28D9]">Offre 2 000 FCFA</p>
      <p className="text-sm text-slate-600">
        {live
          ? "Elle est en ligne. À la fin du décompte elle se coupe seule. Tu pourras la relancer."
          : "Elle est arrêtée. Choisis le nombre de jours, puis active-la quand tu lances."}
      </p>
      {live && plan.offerEndsAt ? (
        <OfferCountdown endsAt={plan.offerEndsAt} prefix="Fin dans" doneLabel="Offre terminée" />
      ) : null}
      <div className="flex flex-wrap gap-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Nombre de jours</span>
          <input
            value={days}
            onChange={(event) => setDays(event.target.value)}
            inputMode="numeric"
            className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Mints donnés</span>
          <input
            value={mints}
            onChange={(event) => setMints(event.target.value)}
            inputMode="numeric"
            className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary px-3 py-1"
          onClick={() => {
            const offerDays = Number(days);
            const mintAmount = Number(mints);
            if (!Number.isInteger(offerDays) || offerDays < 1) return;
            if (!Number.isInteger(mintAmount) || mintAmount < 1) return;
            void onPatch(plan, { offerDays, mintAmount });
          }}
        >
          {live ? "Relancer" : "Activer"}
        </button>
        <button
          type="button"
          className="btn-secondary px-3 py-1"
          onClick={() => {
            const mintAmount = Number(mints);
            if (!Number.isInteger(mintAmount) || mintAmount < 1) return;
            void onPatch(plan, { mintAmount });
          }}
        >
          Enregistrer les Mints
        </button>
      </div>
    </div>
  );
}
