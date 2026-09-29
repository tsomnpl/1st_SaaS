import type { ReactNode } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BrandLogo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/site-footer";
import { SiteFrame } from "@/components/chrome/site-frame";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { SupportCorner } from "@/components/support/support-corner";
import { AnalyticsLoader } from "@/components/legal/analytics-loader";
import { AppearanceSwitch } from "@/components/chrome/appearance-switch";
import { LocaleProvider } from "@/components/chrome/locale-provider";
import { THEME_BOOT } from "@/lib/i18n";
import { getDictionary } from "@/lib/locale";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function PublicChrome({ children }: { children: ReactNode }) {
  const { locale, t } = await getDictionary();
  const links = [
    { href: "/decouvrir", label: t.nav.discover },
    { href: "/creations", label: t.nav.creations },
    { href: "/pricing", label: t.nav.pricing },
  ];

  return (
    <html lang={locale} className={`${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="flex min-h-full flex-col text-slate-900">
        <LocaleProvider locale={locale}>
          <SiteFrame
            header={
              <header className="sticky top-0 z-50 border-b border-white/50 bg-white/75 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                  <BrandLogo size="sm" />
                  <nav className="flex items-center gap-3 text-sm text-slate-600 sm:gap-6">
                    {links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="hidden transition hover:text-[#6D28D9] sm:inline"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link href="/sign-in" className="hidden transition hover:text-[#6D28D9] sm:inline">
                      {t.nav.signIn}
                    </Link>
                    <AppearanceSwitch />
                    <Link href="/create" className="btn-primary whitespace-nowrap">
                      {t.nav.create}
                    </Link>
                  </nav>
                </div>
              </header>
            }
            footer={<SiteFooter />}
          >
            {children}
          </SiteFrame>
          <SupportCorner />
          <CookieBanner />
          <AnalyticsLoader domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN} />
        </LocaleProvider>
      </body>
    </html>
  );
}
