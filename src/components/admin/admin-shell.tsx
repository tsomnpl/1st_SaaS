"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  ["Dashboard", ""],
  ["Utilisateurs", "/users"],
  ["Générations", "/generations"],
  ["Mints", "/mints"],
  ["Paiements", "/payments"],
  ["Plans", "/plans"],
  ["Références", "/references"],
  ["IA / Rodium", "/rodium"],
  ["Analytics", "/analytics"],
  ["Logs", "/logs"],
  ["Paramètres", "/settings"],
];

export function AdminShell({
  basePath,
  children,
}: {
  basePath: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div className="lg:hidden">
        <button type="button" className="btn-secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Fermer le menu" : "Menu admin"}
        </button>
      </div>
      <aside className={`card h-fit p-4 ${open ? "block" : "hidden lg:block"}`}>
        <p className="px-2 text-xs font-bold uppercase tracking-wide text-slate-400">Studio</p>
        <nav className="mt-3 flex flex-col gap-1 text-sm">
          {LINKS.map(([label, suffix]) => {
            const href = `${basePath}${suffix}`;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 ${active ? "bg-violet-50 font-semibold text-[#6D28D9]" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
