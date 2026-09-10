import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlyerMint — Affiches professionnelles, direction artistique incluse",
  description:
    "Transforme une idee ou un besoin commercial en affiche professionnelle. Sans designer, sans prompt.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="fr"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col text-white">
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
