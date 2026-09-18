"use client";

import { useMemo, useState } from "react";

type RefRow = {
  id: string;
  domain: string;
  style: string | null;
  composition: string | null;
  colorPalette: string | null;
  mood: string | null;
};

export function AdminReferencesList({ items }: { items: RefRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      items.filter((item) =>
        `${item.domain} ${item.style} ${item.composition} ${item.mood}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query],
  );

  async function remove(id: string) {
    if (!window.confirm("Archiver / supprimer cette référence ?")) return;
    await fetch(`/api/admin/references?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <section className="admin-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">Ajouts studio</h2>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filtrer"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-3 space-y-2 text-sm">
        {filtered.length === 0 ? <p className="text-slate-500">Aucune référence custom.</p> : null}
        {filtered.map((ref) => (
          <article key={ref.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
            <div>
              <p className="font-semibold">{ref.domain} · {ref.style ?? "n/a"}</p>
              <p className="text-slate-500">{ref.composition}</p>
              <p className="text-xs text-slate-400">{ref.colorPalette} · {ref.mood}</p>
            </div>
            <button type="button" className="btn-secondary px-3 py-1" onClick={() => remove(ref.id)}>
              Supprimer
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
