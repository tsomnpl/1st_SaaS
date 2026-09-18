import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeaderHost } from "@/components/site-header-host";
import { BrandLogo } from "@/components/brand/logo";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FlyerMint — Créez des visuels qui marquent.",
  description:
    "Transforme une idée ou un besoin commercial en affiche professionnelle. Sans designer, sans prompt.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const dynamic = "force-dynamic";

const clerkAppearance = {
  variables: {
    colorPrimary: "#6D28D9",
    colorText: "#1E293B",
    colorBackground: "#FFFFFF",
    borderRadius: "0.9rem",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
};

function Shell({ children, withAuth }: { children: ReactNode; withAuth: boolean }) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-slate-900">
        {withAuth ? (
          <SiteHeaderHost />
        ) : (
          <header className="border-b border-slate-200 bg-white px-4 py-3">
            <div className="mx-auto max-w-6xl">
              <BrandLogo size="sm" />
            </div>
          </header>
        )}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return <Shell withAuth={false}>{children}</Shell>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <Shell withAuth>{children}</Shell>
    </ClerkProvider>
  );
}
