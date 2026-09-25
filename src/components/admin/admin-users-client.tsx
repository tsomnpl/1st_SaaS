"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  status: string;
  role: string;
  balance: number;
  createdAt?: string;
};

export function AdminUsersClient({
  users,
  basePath,
}: {
  users: UserRow[];
  basePath: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [reason, setReason] = useState("Action studio");
  const filtered = useMemo(
    () =>
      users.filter((user) => {
        const match = `${user.email} ${user.name} ${user.id}`.toLowerCase().includes(query.toLowerCase());
        const statusOk = status === "all" || user.status === status;
        return match && statusOk;
      }),
    [users, query, status],
  );

  async function adjust(targetUserId: string, amount: number) {
    const label = amount > 0 ? `Ajouter ${amount} Mint(s)` : `Retirer ${Math.abs(amount)} Mint(s)`;
    if (!window.confirm(`${label} ? Motif : ${reason}`)) return;
    await fetch("/api/admin/mints/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, amount, reason }),
    });
    window.location.reload();
  }

  async function setUserStatus(targetUserId: string, next: "ACTIVE" | "SUSPENDED") {
    if (!window.confirm(`${next === "SUSPENDED" ? "Suspendre" : "Réactiver"} cet utilisateur ?`)) return;
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, status: next, reason }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un e-mail ou un nom"
          className="rounded-xl border border-slate-200 px-3 py-2"
        />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="all">Tous les statuts</option>
          <option value="ACTIVE">Actifs</option>
          <option value="SUSPENDED">Suspendus</option>
        </select>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Raison de l’action"
          className="rounded-xl border border-slate-200 px-3 py-2"
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Utilisateur</th>
              <th className="px-3 py-2">Rôle</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Mints</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <Link href={`${basePath}/users/${user.id}`} className="font-medium text-violet">
                    {user.name ?? user.email ?? user.id}
                  </Link>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </td>
                <td className="px-3 py-2">{user.role}</td>
                <td className="px-3 py-2">{user.status}</td>
                <td className="px-3 py-2">{user.balance}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary px-3 py-1" onClick={() => adjust(user.id, 1)}>
                      +1
                    </button>
                    <button type="button" className="btn-secondary px-3 py-1" onClick={() => adjust(user.id, -1)}>
                      -1
                    </button>
                    {user.status === "SUSPENDED" ? (
                      <button type="button" className="btn-secondary px-3 py-1" onClick={() => setUserStatus(user.id, "ACTIVE")}>
                        Réactiver
                      </button>
                    ) : (
                      <button type="button" className="btn-secondary px-3 py-1" onClick={() => setUserStatus(user.id, "SUSPENDED")}>
                        Suspendre
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
