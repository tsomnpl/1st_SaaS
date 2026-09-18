"use client";

import { useMemo, useState } from "react";

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  status: string;
  role: string;
  balance: number;
};

export function AdminUsersClient({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("Action studio");
  const filtered = useMemo(
    () =>
      users.filter((user) =>
        `${user.email} ${user.name} ${user.id}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  );

  async function adjust(targetUserId: string, amount: number) {
    await fetch("/api/admin/mints/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, amount, reason }),
    });
    window.location.reload();
  }

  async function setStatus(targetUserId: string, status: "ACTIVE" | "SUSPENDED") {
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, status, reason }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher"
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Raison de l’action"
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
      />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
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
                  <p className="font-medium">{user.name ?? user.email ?? user.id}</p>
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
                      <button type="button" className="btn-secondary px-3 py-1" onClick={() => setStatus(user.id, "ACTIVE")}>
                        Réactiver
                      </button>
                    ) : (
                      <button type="button" className="btn-secondary px-3 py-1" onClick={() => setStatus(user.id, "SUSPENDED")}>
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
