import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
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
  title: "FlyerMint",
  description: "Ton directeur artistique IA pour creer des affiches professionnelles",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="fr"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-slate-950 text-white">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-xl font-bold text-emerald-400">
                FlyerMint
              </Link>
              <nav className="flex items-center gap-4 text-sm text-white/80">
                <Link href="/#creations" className="hover:text-emerald-300">
                  Creations
                </Link>
                <Link href="/#comment-ca-marche" className="hover:text-emerald-300">
                  Comment ca marche
                </Link>
                <Link href="/pricing" className="hover:text-emerald-300">
                  Tarifs
                </Link>
                <SignedIn>
                  <Link href="/dashboard" className="hover:text-emerald-300">
                    Dashboard
                  </Link>
                  <Link href="/create" className="hover:text-emerald-300">
                    Creer
                  </Link>
                  <Link href="/history" className="hover:text-emerald-300">
                    Historique
                  </Link>
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="rounded bg-emerald-500 px-3 py-1.5 font-medium text-slate-900">
                      Connexion
                    </button>
                  </SignInButton>
                </SignedOut>
                <Link
                  href="/create"
                  className="rounded border border-emerald-300/60 bg-emerald-400/10 px-3 py-1.5 font-medium text-emerald-200 hover:bg-emerald-400/20"
                >
                  Creer une affiche
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
