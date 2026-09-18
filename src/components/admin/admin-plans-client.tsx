"use client";

import { useState } from "react";

type PlanRow = {
  id: string;
  code: string;
  name: string;
  priceFcfa: number;
  mintAmount: number;
  durationDays: number | null;
  editableExport: boolean;
  active: boolean;
};

export function AdminPlansClient({ plans }: { plans: PlanRow[] }) {
  const [status, setStatus] = useState<string | null>(null);

  async function patch(plan: PlanRow, patchData: Partial<PlanRow>) {
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
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {plan.active ? "Actif" : "Inactif"}
            </span>
          </div>
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
