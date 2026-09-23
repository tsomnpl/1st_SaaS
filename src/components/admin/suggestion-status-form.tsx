"use client";

import { useState } from "react";

const STATUSES = ["NEW", "REVIEWING", "PLANNED", "IN_PROGRESS", "RELEASED", "DECLINED"] as const;

export function SuggestionStatusForm({ suggestionId, status }: { suggestionId: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);

  async function update(next: string) {
    setError(null);
    const response = await fetch(`/api/admin/suggestions/${suggestionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; status?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Mise à jour impossible.");
      return;
    }
    setCurrent(data.status ?? next);
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium" htmlFor={`status-${suggestionId}`}>
        Statut
      </label>
      <select
        id={`status-${suggestionId}`}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={current}
        onChange={(event) => void update(event.target.value)}
      >
        {STATUSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
