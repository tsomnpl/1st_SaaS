"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type PromoRow = {
  id: string;
  code: string;
  mintAmount: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
};

export function PromoManager({ initial }: { initial: PromoRow[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [mintAmount, setMintAmount] = useState("5");
  const [maxUses, setMaxUses] = useState("30");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function createCode(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          mintAmount: Number(mintAmount),
          maxUses: Number(maxUses),
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Ce code n’a pas pu être créé.");
        return;
      }
      setCode("");
      router.refresh();
    } catch {
      setError("Ce code n’a pas pu être créé.");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string, label: string) {
    if (!window.confirm(`Supprimer le code ${label} ? Les Mints déjà donnés restent.`)) return;
    setError("");
    const response = await fetch("/api/admin/promo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!data.ok) {
      setError(data.error ?? "Suppression impossible.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createCode} className="admin-card grid gap-3 p-4 md:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Code</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="LANCE30"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 uppercase"
            required
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Mints donnés</span>
          <input
            value={mintAmount}
            onChange={(event) => setMintAmount(event.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            required
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Nombre de personnes</span>
          <input
            value={maxUses}
            onChange={(event) => setMaxUses(event.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            required
          />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={pending} className="btn-primary w-full">
            Créer
          </button>
        </div>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {initial.length === 0 ? <p className="text-sm text-slate-500">Aucun code promo.</p> : null}
        {initial.map((row) => (
          <article key={row.id} className="admin-card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-semibold">{row.code}</p>
              <p className="text-slate-500">
                {row.mintAmount} Mint{row.mintAmount > 1 ? "s" : ""} · {row.usedCount}/{row.maxUses} personnes
              </p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => void remove(row.id, row.code)}>
              Supprimer
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
