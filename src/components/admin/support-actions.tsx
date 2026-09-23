"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TICKET_PRIORITIES, TICKET_STATUSES, STATUS_LABEL, PRIORITY_LABEL } from "@/lib/support-policy";

export function AdminTicketActions({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function send(payload: Record<string, unknown>) {
    setError(null);
    setInfo(null);
    const response = await fetch(`/api/admin/support/${ticketId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Action impossible.");
      return;
    }
    setInfo("Enregistré.");
    router.refresh();
  }

  function onReply(event: FormEvent<HTMLFormElement>, visibility: "PUBLIC" | "INTERNAL") {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = String(form.get("body") ?? "");
    const status = String(form.get("status") ?? "");
    const priority = String(form.get("priority") ?? "");
    const queue = String(form.get("queue") ?? "");
    void send({
      body: body || undefined,
      visibility,
      status: status || undefined,
      priority: priority || undefined,
      queue: queue || undefined,
    });
    event.currentTarget.reset();
  }

  return (
    <div className="space-y-4">
      <form className="admin-card space-y-3 p-4" onSubmit={(event) => onReply(event, "PUBLIC")}>
        <h2 className="font-bold">Réponse client</h2>
        <textarea name="body" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Message visible par le client" />
        <div className="grid gap-3 sm:grid-cols-3">
          <select name="status" className="rounded-xl border border-slate-200 px-3 py-2" defaultValue="">
            <option value="">Statut inchangé</option>
            {TICKET_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </select>
          <select name="priority" className="rounded-xl border border-slate-200 px-3 py-2" defaultValue="">
            <option value="">Priorité inchangée</option>
            {TICKET_PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {PRIORITY_LABEL[item]}
              </option>
            ))}
          </select>
          <select name="queue" className="rounded-xl border border-slate-200 px-3 py-2" defaultValue="">
            <option value="">File inchangée</option>
            {["SUPPORT", "BILLING", "TECHNICAL", "ADMIN"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" type="submit">
            Répondre
          </button>
          <button className="btn-secondary" type="button" onClick={() => void send({ status: "RESOLVED" })}>
            Résoudre
          </button>
          <button className="btn-secondary" type="button" onClick={() => void send({ status: "CLOSED" })}>
            Fermer
          </button>
        </div>
      </form>
      <form className="admin-card space-y-3 p-4" onSubmit={(event) => onReply(event, "INTERNAL")}>
        <h2 className="font-bold">Note interne</h2>
        <p className="text-xs text-slate-500">Jamais envoyée au client.</p>
        <textarea name="body" required rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <button className="btn-secondary" type="submit">
          Enregistrer la note
        </button>
      </form>
      {info ? <p className="text-sm text-mint">{info}</p> : null}
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}
