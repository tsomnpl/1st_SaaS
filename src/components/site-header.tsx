"use client";

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/logo";

type Props = {
  mintBalance?: number | null;
};

const publicLinks = [
  { href: "/creations", label: "Créations" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/pricing", label: "Tarifs" },
];

export function SiteHeader({ mintBalance = null }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <BrandLogo size="sm" />

        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[#6D28D9]">
              {link.label}
            </Link>
          ))}
          <SignedIn>
            <Link href="/dashboard" className="transition hover:text-[#6D28D9]">
              Tableau de bord
            </Link>
            <Link href="/history" className="transition hover:text-[#6D28D9]">
              Historique
            </Link>
            <Link href="/profile" className="transition hover:text-[#6D28D9]">
              Profil
            </Link>
            {typeof mintBalance === "number" ? (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                {mintBalance} Mint{mintBalance > 1 ? "s" : ""}
              </span>
            ) : null}
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className="transition hover:text-[#6D28D9]">
                Connexion
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="transition hover:text-[#6D28D9]">
                Inscription
              </button>
            </SignUpButton>
          </SignedOut>
          <Link href="/create" className="btn-primary">
            Créer une affiche
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white md:hidden"
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="flex flex-col gap-1.5">
            <span className={`h-0.5 w-4 bg-slate-800 transition ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-4 bg-slate-800 transition ${open ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-4 bg-slate-800 transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2 text-sm">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-2 py-2 text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <SignedIn>
              <Link href="/dashboard" className="rounded-lg px-2 py-2" onClick={() => setOpen(false)}>
                Tableau de bord
              </Link>
              <Link href="/history" className="rounded-lg px-2 py-2" onClick={() => setOpen(false)}>
                Historique
              </Link>
              <Link href="/profile" className="rounded-lg px-2 py-2" onClick={() => setOpen(false)}>
                Profil
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button type="button" className="rounded-lg px-2 py-2 text-left">
                  Connexion
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button type="button" className="rounded-lg px-2 py-2 text-left">
                  Inscription
                </button>
              </SignUpButton>
            </SignedOut>
            <Link href="/create" className="btn-primary mt-2" onClick={() => setOpen(false)}>
              Créer une affiche
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
