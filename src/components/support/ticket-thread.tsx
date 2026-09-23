"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function TicketThread({ ticketId, canClose }: { ticketId: string; canClose?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: String(form.get("body") ?? "") }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setLoading(false);
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Une erreur est survenue. Notre équipe a été informée.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  async function onFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const body = new FormData(event.currentTarget);
    const response = await fetch(`/api/support/tickets/${ticketId}/attachments`, { method: "POST", body });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Pièce jointe refusée.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  async function closeTicket() {
    setError(null);
    const response = await fetch(`/api/support/tickets/${ticketId}/close`, { method: "POST" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Fermeture impossible.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="card space-y-3 p-4">
        <label className="block text-sm font-medium" htmlFor="reply">
          Répondre
        </label>
        <textarea id="reply" name="body" required rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <button className="btn-primary w-full sm:w-auto" disabled={loading} type="submit">
          {loading ? "Envoi…" : "Envoyer"}
        </button>
      </form>
      <form onSubmit={onFile} className="card space-y-3 p-4">
        <label className="block text-sm font-medium" htmlFor="file">
          Pièce jointe (JPG, PNG, WEBP, PDF — 2 Mo)
        </label>
        <input id="file" name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required className="text-sm" />
        <button className="btn-secondary w-full sm:w-auto" type="submit">
          Ajouter
        </button>
      </form>
      {canClose ? (
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={closeTicket}>
          Fermer la demande
        </button>
      ) : null}
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}
