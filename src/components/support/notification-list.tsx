"use client";

import { useState } from "react";
import Link from "next/link";

type Item = { id: string; title: string; body: string; href: string | null; read: boolean; createdAt: string };

export function NotificationList({ items }: { items: Item[] }) {
  const [rows, setRows] = useState(items);

  async function mark(id: string) {
    const response = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    if (!response.ok) return;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, read: true } : row)));
  }

  return (
    <ul className="space-y-3">
      {rows.map((item) => (
        <li key={item.id} className={`card p-4 ${item.read ? "opacity-70" : ""}`}>
          <p className="font-semibold">{item.title}</p>
          <p className="mt-1 text-sm text-slate-600">{item.body}</p>
          <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("fr-FR")}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {item.href ? (
              <Link href={item.href} className="text-sm font-semibold text-violet">
                Ouvrir
              </Link>
            ) : null}
            {item.read ? null : (
              <button type="button" className="text-sm font-semibold text-slate-600" onClick={() => void mark(item.id)}>
                Marquer comme lu
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
