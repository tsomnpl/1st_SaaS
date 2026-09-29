"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABEL, PRIORITY_LABEL, SUPPORT_CATEGORIES, SUPPORT_PRIORITIES } from "@/lib/support";

type Option = { id: string; label: string };

export function NewTicketForm({
  generations,
  payments,
  initial,
}: {
  generations: Option[];
  payments: Option[];
  initial: { subject: string; message: string; category: string; generationId: string; paymentId: string };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const generationId = String(form.get("generationId") ?? "");
    const paymentId = String(form.get("paymentId") ?? "");
    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: String(form.get("subject") ?? ""),
        category: String(form.get("category") ?? ""),
        priority: String(form.get("priority") ?? "") || undefined,
        message: String(form.get("message") ?? ""),
        generationId: generationId || undefined,
        paymentId: paymentId || undefined,
        clientRequestId: crypto.randomUUID(),
      }),
    });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; ticket?: { ticketNumber: string } } | null;
    if (!response.ok || !payload?.ticket) {
      setPending(false);
      setError(payload?.error || "Le ticket n’a pas pu être créé.");
      return;
    }
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      const upload = new FormData();
      upload.set("file", file);
      const attached = await fetch(`/api/support/tickets/${payload.ticket.ticketNumber}/attachments`, {
        method: "POST",
        body: upload,
      });
      if (!attached.ok) {
        setPending(false);
        setError("Le ticket est créé, mais la pièce jointe a été refusée.");
        router.push(`/support/${payload.ticket.ticketNumber}`);
        return;
      }
    }
    router.push(`/support/${payload.ticket.ticketNumber}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <label className="block text-sm">
        <span className="font-semibold">Sujet</span>
        <input name="subject" required minLength={3} maxLength={140} defaultValue={initial.subject} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-semibold">Catégorie</span>
          <select name="category" defaultValue={initial.category} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
            {SUPPORT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABEL[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Priorité</span>
          <select name="priority" defaultValue="MEDIUM" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
            {SUPPORT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABEL[priority]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {generations.length ? (
        <label className="block text-sm">
          <span className="font-semibold">Génération concernée</span>
          <select name="generationId" defaultValue={initial.generationId} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
            <option value="">Aucune</option>
            {generations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {payments.length ? (
        <label className="block text-sm">
          <span className="font-semibold">Paiement concerné</span>
          <select name="paymentId" defaultValue={initial.paymentId} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
            <option value="">Aucun</option>
            {payments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block text-sm">
        <span className="font-semibold">Message</span>
        <textarea name="message" required minLength={2} maxLength={4000} rows={6} defaultValue={initial.message} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-semibold">Pièce jointe</span>
        <input name="file" type="file" accept="image/png,image/jpeg,image/webp" className="mt-1 block w-full text-sm" />
        <span className="mt-1 block text-xs text-slate-500">JPG, PNG ou WEBP, 2 Mo maximum, 3 fichiers par ticket.</span>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Envoi…" : "Créer le ticket"}
      </button>
    </form>
  );
}
