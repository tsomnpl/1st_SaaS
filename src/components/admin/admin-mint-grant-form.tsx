"use client";

import { FormEvent, useState } from "react";

export function AdminMintGrantForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const amount = Number(data.get("amount"));
    const reason = String(data.get("reason") ?? "");
    const expires = String(data.get("expiresAt") ?? "");
    if (!Number.isInteger(amount) || amount <= 0) {
      setStatus("Indique une quantité entière supérieure à 0.");
      return;
    }
    if (reason.trim().length < 2) {
      setStatus("Le motif est obligatoire.");
      return;
    }
    setLoading(true);
    setStatus(null);
    const response = await fetch("/api/admin/mints/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount,
        reason,
        expiresAt: expires ? new Date(expires).toISOString() : undefined,
      }),
    });
    const payload = (await response.json()) as { ok: boolean; error?: string; email?: string };
    setLoading(false);
    if (!payload.ok) {
      setStatus(payload.error ?? "Attribution refusée.");
      return;
    }
    form.reset();
    window.location.reload();
  }

  return (
    <form className="admin-card space-y-3 p-4" onSubmit={submit}>
      <h2 className="font-bold">Préparer des Mints pour un e-mail</h2>
      <p className="text-sm text-slate-500">
        L’attribution part au ledger à la première connexion, seulement si Clerk a vérifié cet e-mail.
      </p>
      <input name="email" type="email" required placeholder="adresse@exemple.com" className="w-full rounded-lg border border-slate-200 px-3 py-2" />
      <input name="amount" type="number" min={1} max={500} required placeholder="Quantité" className="w-full rounded-lg border border-slate-200 px-3 py-2" />
      <input name="reason" required minLength={2} placeholder="Motif obligatoire" className="w-full rounded-lg border border-slate-200 px-3 py-2" />
      <label className="block text-sm text-slate-600">
        Expiration optionnelle
        <input name="expiresAt" type="date" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
      </label>
      <button type="submit" className="btn-mint" disabled={loading}>
        Enregistrer l’attribution
      </button>
      {status ? <p className="text-sm text-amber-700">{status}</p> : null}
    </form>
  );
}

export function CancelMintGrantButton({ grantId }: { grantId: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function cancel() {
    const response = await fetch(`/api/admin/mints/grants/${grantId}`, { method: "POST" });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!payload.ok) {
      setStatus(payload.error ?? "Annulation refusée.");
      return;
    }
    window.location.reload();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className="btn-secondary" onClick={cancel}>
        Annuler
      </button>
      {status ? <span className="text-amber-700">{status}</span> : null}
    </span>
  );
}
