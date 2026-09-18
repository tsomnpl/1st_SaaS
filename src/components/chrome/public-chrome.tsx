import type { ReactNode } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BrandLogo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/site-footer";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const publicLinks = [
  { href: "/creations", label: "Créations" },
  { href: "/pricing", label: "Tarifs" },
];

export function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-slate-900">
        <header className="sticky top-0 z-50 border-b border-white/50 bg-white/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <BrandLogo size="sm" />
            <nav className="flex items-center gap-4 text-sm text-slate-600 sm:gap-6">
              {publicLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition hover:text-[#6D28D9]">
                  {link.label}
                </Link>
              ))}
              <Link href="/sign-in" className="hidden transition hover:text-[#6D28D9] sm:inline">
                Connexion
              </Link>
              <Link href="/create" className="btn-primary">
                Créer une affiche
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
