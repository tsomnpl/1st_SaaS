import type { ReactNode } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BrandLogo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/site-footer";
import { SiteFrame } from "@/components/chrome/site-frame";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { AnalyticsLoader } from "@/components/legal/analytics-loader";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const publicLinks = [
  { href: "/decouvrir", label: "Découvrir" },
  { href: "/creations", label: "Créations" },
  { href: "/pricing", label: "Tarifs" },
];

export function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-slate-900">
        <SiteFrame
          header={
            <header className="sticky top-0 z-50 border-b border-white/50 bg-white/75 backdrop-blur-xl">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <BrandLogo size="sm" />
                <nav className="flex items-center gap-3 text-sm text-slate-600 sm:gap-6">
                  {publicLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="hidden transition hover:text-[#6D28D9] sm:inline"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link href="/sign-in" className="hidden transition hover:text-[#6D28D9] sm:inline">
                    Connexion
                  </Link>
                  <Link href="/create" className="btn-primary whitespace-nowrap">
                    Créer une affiche
                  </Link>
                </nav>
              </div>
            </header>
          }
          footer={<SiteFooter />}
        >
          {children}
        </SiteFrame>
        <CookieBanner />
        <AnalyticsLoader domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN} />
      </body>
    </html>
  );
}
