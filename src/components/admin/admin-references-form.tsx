"use client";

import { FormEvent, useState } from "react";

export function AdminReferencesForm() {
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      domain: String(form.get("domain") ?? ""),
      style: String(form.get("style") ?? ""),
      composition: String(form.get("composition") ?? ""),
      colorPalette: String(form.get("colorPalette") ?? ""),
      mood: String(form.get("mood") ?? ""),
      tags: String(form.get("tags") ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    };
    const response = await fetch("/api/admin/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { ok: boolean; error?: string };
    setStatus(data.ok ? "Référence ajoutée" : data.error ?? "Erreur");
    if (data.ok) window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-3 p-4 md:grid-cols-2">
      <input name="domain" required placeholder="Domaine" className="rounded-xl border border-slate-200 px-3 py-2" />
      <input name="style" placeholder="Style" className="rounded-xl border border-slate-200 px-3 py-2" />
      <input name="composition" placeholder="Composition" className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" />
      <input name="colorPalette" placeholder="Palette" className="rounded-xl border border-slate-200 px-3 py-2" />
      <input name="mood" placeholder="Ambiance" className="rounded-xl border border-slate-200 px-3 py-2" />
      <input name="tags" placeholder="Tags CSV" className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" />
      <button type="submit" className="btn-primary md:col-span-2">
        Ajouter
      </button>
      {status ? <p className="text-sm text-slate-500 md:col-span-2">{status}</p> : null}
    </form>
  );
}
