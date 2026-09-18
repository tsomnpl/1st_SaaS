"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SearchPayload = {
  users: Array<{ id: string; email: string | null; name: string | null }>;
  payments: Array<{ id: string; orderId: string; status: string }>;
  generations: Array<{ id: string; status: string }>;
  transactions: Array<{ id: string; type: string; reference: string | null }>;
  references: Array<{ id: string; domain: string; style: string | null }>;
};

export function AdminSearch({ basePath }: { basePath: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SearchPayload | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setData(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) return;
      setData((await response.json()) as SearchPayload);
      setOpen(true);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  const empty =
    !data ||
    (!data.users.length &&
      !data.payments.length &&
      !data.generations.length &&
      !data.transactions.length &&
      !data.references.length);

  return (
    <div className="relative w-full max-w-xl">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => data && setOpen(true)}
        placeholder="Rechercher un e-mail, orderId, génération…"
        className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-emerald-300"
      />
      {open && query.trim().length >= 2 ? (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-2xl">
          {empty ? <p className="text-slate-500">Aucun résultat.</p> : null}
          {data?.users.map((user) => (
            <Link key={user.id} href={`${basePath}/users/${user.id}`} className="block rounded-lg px-2 py-1.5 hover:bg-slate-50" onClick={() => setOpen(false)}>
              Utilisateur · {user.email ?? user.name ?? user.id}
            </Link>
          ))}
          {data?.payments.map((payment) => (
            <Link key={payment.id} href={`${basePath}/payments/${payment.id}`} className="block rounded-lg px-2 py-1.5 hover:bg-slate-50" onClick={() => setOpen(false)}>
              Paiement · {payment.orderId} · {payment.status}
            </Link>
          ))}
          {data?.generations.map((generation) => (
            <Link key={generation.id} href={`${basePath}/generations`} className="block rounded-lg px-2 py-1.5 hover:bg-slate-50" onClick={() => setOpen(false)}>
              Génération · {generation.id.slice(0, 10)} · {generation.status}
            </Link>
          ))}
          {data?.transactions.map((tx) => (
            <Link key={tx.id} href={`${basePath}/mints`} className="block rounded-lg px-2 py-1.5 hover:bg-slate-50" onClick={() => setOpen(false)}>
              Transaction · {tx.type} · {tx.reference ?? tx.id.slice(0, 8)}
            </Link>
          ))}
          {data?.references.map((ref) => (
            <Link key={ref.id} href={`${basePath}/references`} className="block rounded-lg px-2 py-1.5 hover:bg-slate-50" onClick={() => setOpen(false)}>
              Référence · {ref.domain} · {ref.style ?? "n/a"}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
