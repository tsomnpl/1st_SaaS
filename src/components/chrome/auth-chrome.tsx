import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeaderHost } from "@/components/site-header-host";
import { SiteFrame } from "@/components/chrome/site-frame";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { SupportCorner } from "@/components/support/support-corner";
import { AnalyticsLoader } from "@/components/legal/analytics-loader";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export function AuthChrome({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-slate-900">
        <SiteFrame header={<SiteHeaderHost />} footer={<SiteFooter />}>
          {children}
        </SiteFrame>
        <SupportCorner />
        <CookieBanner />
        <AnalyticsLoader domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN} />
      </body>
    </html>
  );
}
