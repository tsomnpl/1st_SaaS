"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["Dashboard", ""],
  ["Users", "/users"],
  ["Generations", "/generations"],
  ["Mints", "/mints"],
  ["Payments", "/payments"],
  ["Plans", "/plans"],
  ["References", "/references"],
  ["AI / Rodium", "/rodium"],
  ["Analytics", "/analytics"],
  ["Logs", "/logs"],
  ["Settings", "/settings"],
];

export function AdminShell({
  basePath,
  children,
}: {
  basePath: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="card h-fit p-4">
        <p className="px-2 text-xs font-bold uppercase tracking-wide text-slate-400">Studio</p>
        <nav className="mt-3 flex flex-col gap-1 text-sm">
          {LINKS.map(([label, suffix]) => {
            const href = `${basePath}${suffix}`;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 ${active ? "bg-violet-50 font-semibold text-[#6D28D9]" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
