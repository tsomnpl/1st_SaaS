import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeaderHost } from "@/components/site-header-host";
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

const clerkAppearance = {
  variables: {
    colorPrimary: "#6D28D9",
    colorText: "#1E293B",
    colorBackground: "#FFFFFF",
    borderRadius: "0.9rem",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
        <body className="flex min-h-full flex-col text-slate-900">
          <SiteHeaderHost />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <SiteFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
