"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABEL, PRIORITY_LABEL, TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/lib/support-policy";

export function NewTicketForm({
  generationId = "",
  paymentId = "",
  defaultSubject = "",
  defaultDescription = "",
}: {
  generationId?: string;
  paymentId?: string;
  defaultSubject?: string;
  defaultDescription?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [similar, setSimilar] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: String(form.get("subject") ?? ""),
        description: String(form.get("description") ?? ""),
        category: String(form.get("category") ?? "OTHER"),
        priority: String(form.get("priority") ?? "NORMAL"),
        generationId: generationId || undefined,
        paymentId: paymentId || undefined,
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; ticketId?: string; similarPublicId?: string | null };
    setLoading(false);
    if (!response.ok || !data.ok || !data.ticketId) {
      setError(data.error ?? "Une erreur est survenue. Notre équipe a été informée.");
      return;
    }
    if (data.similarPublicId) setSimilar(data.similarPublicId);
    router.push(`/support/${data.ticketId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <label className="block text-sm font-medium">
        Sujet
        <input name="subject" required defaultValue={defaultSubject} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Catégorie
          <select name="category" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
            {TICKET_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {CATEGORY_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Priorité
          <select name="priority" defaultValue="NORMAL" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
            {TICKET_PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {PRIORITY_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Description
        <textarea name="description" required rows={5} defaultValue={defaultDescription} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
      </label>
      {generationId ? <p className="text-xs text-slate-500">Contexte de génération joint automatiquement.</p> : null}
      {paymentId ? <p className="text-xs text-slate-500">Contexte de paiement joint automatiquement.</p> : null}
      {similar ? <p className="text-sm text-amber-700">Cette demande ressemble à {similar}. Les deux sont conservées.</p> : null}
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
        {loading ? "Envoi…" : "Envoyer la demande"}
      </button>
    </form>
  );
}
