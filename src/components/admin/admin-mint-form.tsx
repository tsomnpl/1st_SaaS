"use client";

import { FormEvent, useState } from "react";

export function AdminMintForm({ userId }: { userId: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>, direction: "add" | "remove") {
    event.preventDefault();
    const form = event.currentTarget;
    const amount = Number(new FormData(form).get("amount"));
    const reason = String(new FormData(form).get("reason") ?? "");
    if (!Number.isInteger(amount) || amount <= 0) {
      setStatus("Indique une quantité entière supérieure à 0.");
      return;
    }
    if (reason.trim().length < 2) {
      setStatus("Le motif est obligatoire.");
      return;
    }
    const signed = direction === "add" ? amount : -amount;
    const label = direction === "add" ? `Ajouter ${amount} Mint(s)` : `Retirer ${amount} Mint(s)`;
    if (amount >= 20 && !window.confirm(`Action sensible : ${label}. Continuer ?`)) return;
    if (!window.confirm(`${label} ? Motif : ${reason}`)) return;
    setLoading(true);
    setStatus(null);
    const response = await fetch("/api/admin/mints/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId, amount: signed, reason }),
    });
    const data = (await response.json()) as { ok: boolean; error?: string; balance?: number };
    setLoading(false);
    if (!data.ok) {
      setStatus(data.error ?? "Action refusée.");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form className="admin-card space-y-3 p-4" onSubmit={(event) => submit(event, "add")}>
        <h2 className="font-bold">Ajouter des Mints</h2>
        <input name="amount" type="number" min={1} max={500} required placeholder="Quantité" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <input name="reason" required minLength={2} placeholder="Motif (bonus, challenge…)" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <button type="submit" className="btn-mint" disabled={loading}>
          Ajouter les Mints
        </button>
      </form>
      <form className="admin-card space-y-3 p-4" onSubmit={(event) => submit(event, "remove")}>
        <h2 className="font-bold">Retirer des Mints</h2>
        <input name="amount" type="number" min={1} max={500} required placeholder="Quantité" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <input name="reason" required minLength={2} placeholder="Motif (correction, fraude…)" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <button type="submit" className="btn-secondary" disabled={loading}>
          Retirer les Mints
        </button>
      </form>
      {status ? <p className="text-sm text-amber-700 md:col-span-2">{status}</p> : null}
    </div>
  );
}
