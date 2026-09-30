"use client";

import { useState } from "react";
import { DOMAINS } from "@/lib/domains";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  startDate: string | null;
  endDate: string | null;
  markets: string[];
  domains: string[];
  referenceIds: string[];
  active: boolean;
  priority: number;
  movable: boolean;
};

function day(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function SeasonalEditor({ campaigns }: { campaigns: Campaign[] }) {
  const [rows, setRows] = useState(campaigns);
  const [message, setMessage] = useState("");

  async function save(row: Campaign) {
    setMessage("");
    const response = await fetch("/api/admin/seasonal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: row.id,
        active: row.active,
        priority: row.priority,
        startDate: row.startDate ? day(row.startDate) : null,
        endDate: row.endDate ? day(row.endDate) : null,
        markets: row.markets,
        domains: row.domains,
        referenceIds: row.referenceIds,
      }),
    });
    const data = (await response.json()) as { ok: boolean; error?: string };
    setMessage(data.ok ? `${row.name} enregistrée.` : data.error ?? "Enregistrement impossible.");
  }

  function patch(id: string, change: Partial<Campaign>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...change } : row)));
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      {rows.map((row) => (
        <article key={row.id} className="admin-card space-y-3 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{row.name}</h2>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={row.active} onChange={(event) => patch(row.id, { active: event.target.checked })} />
              Active
            </label>
          </div>
          <p className="text-slate-500">{row.slug}{row.movable ? " · date mobile, à confirmer" : ""}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1">
              <span>Début</span>
              <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="date" value={day(row.startDate)} onChange={(event) => patch(row.id, { startDate: event.target.value || null })} />
            </label>
            <label className="space-y-1">
              <span>Fin</span>
              <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="date" value={day(row.endDate)} onChange={(event) => patch(row.id, { endDate: event.target.value || null })} />
            </label>
            <label className="space-y-1">
              <span>Priorité</span>
              <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="number" value={row.priority} onChange={(event) => patch(row.id, { priority: Number(event.target.value) })} />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            {(["TG", "BJ", "GLOBAL"] as const).map((market) => (
              <label key={market} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.markets.includes(market)}
                  onChange={(event) => {
                    const markets = event.target.checked
                      ? [...row.markets, market]
                      : row.markets.filter((item) => item !== market);
                    patch(row.id, { markets });
                  }}
                />
                {market}
              </label>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map((domain) => (
              <label key={domain} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.domains.includes(domain)}
                  onChange={(event) => {
                    const domains = event.target.checked
                      ? [...row.domains, domain]
                      : row.domains.filter((item) => item !== domain);
                    patch(row.id, { domains });
                  }}
                />
                {domain}
              </label>
            ))}
          </div>
          <label className="block space-y-1">
            <span>Références (une par ligne)</span>
            <textarea
              className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={row.referenceIds.join("\n")}
              onChange={(event) =>
                patch(row.id, {
                  referenceIds: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                })
              }
            />
          </label>
          <button type="button" className="btn-primary" onClick={() => void save(row)}>
            Enregistrer
          </button>
        </article>
      ))}
    </div>
  );
}
