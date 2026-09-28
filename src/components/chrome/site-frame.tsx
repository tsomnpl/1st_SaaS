"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function SiteFrame({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/") {
    return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
  }

  return (
    <>
      {header}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 [&:has([data-admin-shell])]:max-w-[1500px]">
        {children}
      </main>
      {footer}
    </>
  );
}
