"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["FEATURE", "DESIGN", "GENERATION", "EXPORT", "SUPPORT", "OTHER"] as const;

export function SuggestionForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: String(form.get("category")),
        title: String(form.get("title")),
        body: String(form.get("body")),
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Envoi impossible.");
      return;
    }
    setDone(true);
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3 p-5">
      <h2 className="text-lg font-bold">Proposer une amélioration</h2>
      <label className="block text-sm font-medium">
        Catégorie
        <select name="category" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Titre
        <input name="title" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">
        Détail
        <textarea name="body" required rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
      </label>
      <button className="btn-primary w-full sm:w-auto" type="submit">
        Envoyer
      </button>
      {done ? <p className="text-sm text-mint">Suggestion enregistrée.</p> : null}
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
    </form>
  );
}
