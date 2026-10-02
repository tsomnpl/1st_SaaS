"use client";

import { FormEvent, useState } from "react";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/domains";

export function InspirationUploadForm() {
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Envoi…");
    const response = await fetch("/api/admin/inspiration-source", { method: "POST", body: form });
    const data = (await response.json()) as { ok: boolean; error?: string; data?: { already?: boolean } };
    if (!data.ok) {
      setStatus(data.error ?? "L’image n’a pas été ajoutée.");
      return;
    }
    setStatus(data.data?.already ? "Cette image est déjà dans les sources." : "Source ajoutée. Les prochaines affiches de ce domaine peuvent s’en servir.");
    if (!data.data?.already) window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-3 p-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <h2 className="font-bold">Ajouter une affiche source</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choisis le domaine, puis l’image. Elle rejoint la bibliothèque utilisée pour la copie exacte. Une affiche mariage va dans Mariage, une montée solidaire dans Événementiel.
        </p>
      </div>
      <label className="space-y-1 text-sm">
        <span className="font-medium">Domaine</span>
        <select name="domain" required className="w-full rounded-xl border border-slate-200 px-3 py-2">
          {DOMAINS.map((domain) => (
            <option key={domain} value={domain}>
              {DOMAIN_LABELS[domain]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">Image</span>
        <input name="file" type="file" required accept="image/jpeg,image/png,image/webp" className="w-full text-sm" />
      </label>
      <button type="submit" className="btn-primary md:col-span-2">
        Ajouter aux sources
      </button>
      {status ? <p className="text-sm text-slate-600 md:col-span-2">{status}</p> : null}
    </form>
  );
}
