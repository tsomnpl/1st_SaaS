"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PRIORITY_LABEL, STATUS_LABEL, SUPPORT_PRIORITIES, SUPPORT_STATUSES } from "@/lib/support";

type EventRow = { id: string; eventType: string; status: string; attempts: number; lastError: string | null };

export function AdminTicketDesk({
  ticketNumber,
  status,
  priority,
  events,
}: {
  ticketNumber: string;
  status: string;
  priority: string;
  events: EventRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function send(url: string, body: unknown) {
    setPending(true);
    setError("");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(payload?.error || "Action refusée.");
      return;
    }
    router.refresh();
  }

  async function patch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    const response = await fetch(`/api/admin/support/tickets/${ticketNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: String(form.get("status")), priority: String(form.get("priority")) }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(payload?.error || "Mise à jour refusée.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={patch} className="admin-card grid gap-3 p-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-semibold">Statut</span>
          <select name="status" defaultValue={status} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
            {SUPPORT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-semibold">Priorité</span>
          <select name="priority" defaultValue={priority} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
            {SUPPORT_PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {PRIORITY_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-secondary sm:col-span-2" disabled={pending}>
          Enregistrer
        </button>
      </form>
      <form
        className="admin-card space-y-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const message = String(new FormData(form).get("message") ?? "");
          void send(`/api/admin/support/tickets/${ticketNumber}/messages`, { message }).then(() => form.reset());
        }}
      >
        <label className="block text-sm font-semibold" htmlFor="admin-reply">
          Réponse au client
        </label>
        <textarea id="admin-reply" name="message" required minLength={2} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <button type="submit" className="btn-primary" disabled={pending}>
          Envoyer la réponse
        </button>
      </form>
      <form
        className="admin-card space-y-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const message = String(new FormData(form).get("message") ?? "");
          void send(`/api/admin/support/tickets/${ticketNumber}/notes`, { message }).then(() => form.reset());
        }}
      >
        <label className="block text-sm font-semibold" htmlFor="admin-note">
          Note interne
        </label>
        <textarea id="admin-note" name="message" required minLength={2} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <p className="text-xs text-slate-500">Visible uniquement dans le studio. Aucun e-mail n’est envoyé.</p>
        <button type="submit" className="btn-secondary" disabled={pending}>
          Enregistrer la note
        </button>
      </form>
      {events.length ? (
        <ul className="space-y-2 text-sm">
          {events.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span>
                {event.eventType} · {event.status} · {event.attempts}
                {event.lastError ? ` · ${event.lastError}` : ""}
              </span>
              {event.status === "FAILED" ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-[#6D28D9]"
                  onClick={() => void send(`/api/admin/support/email/${event.id}`, {})}
                >
                  Réessayer
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
