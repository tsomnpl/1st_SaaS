"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminSearch } from "@/components/admin/admin-search";
import { BrandLogo } from "@/components/brand/logo";

const LINKS = [
  ["Dashboard", ""],
  ["Utilisateurs", "/users"],
  ["Générations", "/generations"],
  ["Mints", "/mints"],
  ["Paiements", "/payments"],
  ["Plans", "/plans"],
  ["Références", "/references"],
  ["IA / Rodium", "/rodium"],
  ["Support", "/support"],
  ["Monitoring", "/monitoring"],
  ["Suggestions", "/suggestions"],
  ["Analytics", "/analytics"],
  ["Logs", "/logs"],
  ["Paramètres", "/settings"],
];

export function AdminShell({
  basePath,
  adminLabel = "Administrateur",
  children,
}: {
  basePath: string;
  adminLabel?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div data-admin-shell className="space-y-4">
      <div className="card overflow-hidden border border-slate-800 bg-night text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">Studio</p>
              <BrandLogo href="/" size="sm" onDark />
            </div>
            <button type="button" className="rounded-xl border border-white/15 px-3 py-2 text-sm lg:hidden" onClick={() => setOpen((value) => !value)}>
              {open ? "Fermer" : "Menu"}
            </button>
          </div>
          <AdminSearch basePath={basePath} />
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="inline-flex h-2 w-2 rounded-full bg-mint" />
            <span className="truncate">{adminLabel}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className={`admin-sidebar ${open ? "block" : "hidden lg:block"}`}>
          <nav className="flex flex-col gap-1 text-sm">
            {LINKS.map(([label, suffix]) => {
              const href = `${basePath}${suffix}`;
              const active = pathname === href || (suffix !== "" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2 transition ${
                    active
                      ? "bg-white/10 font-semibold text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}
