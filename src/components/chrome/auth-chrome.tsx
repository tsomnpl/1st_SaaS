import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeaderHost } from "@/components/site-header-host";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { AnalyticsLoader } from "@/components/legal/analytics-loader";
import { SkipLink } from "@/components/chrome/skip-link";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export function AuthChrome({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-slate-900">
        <SkipLink />
        <SiteHeaderHost />
        <main
          id="contenu"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 [&:has([data-admin-shell])]:max-w-[1500px]"
        >
          {children}
        </main>
        <SiteFooter />
        <CookieBanner />
        <AnalyticsLoader domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN} />
      </body>
    </html>
  );
}
