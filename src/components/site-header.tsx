"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";

const publicLinks = [
  { href: "/#creations", label: "Creations" },
  { href: "/#comment-ca-marche", label: "Comment ca marche" },
  { href: "/pricing", label: "Tarifs" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111827]/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight text-white">
          Flyer<span className="text-[#20C997]">Mint</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/75 md:flex">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[#20C997]">
              {link.label}
            </Link>
          ))}
          <SignedIn>
            <Link href="/dashboard" className="transition hover:text-[#20C997]">
              Dashboard
            </Link>
            <Link href="/history" className="transition hover:text-[#20C997]">
              Historique
            </Link>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className="transition hover:text-[#20C997]">
                Connexion
              </button>
            </SignInButton>
          </SignedOut>
          <Link
            href="/create"
            className="rounded-full bg-[#20C997] px-4 py-2 font-semibold text-[#111827] shadow-[0_0_24px_rgba(32,201,151,0.25)] transition hover:brightness-110"
          >
            Creer une affiche
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 md:hidden"
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span className={`h-0.5 w-4 bg-white transition ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-4 bg-white transition ${open ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-4 bg-white transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#111827]/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-2 py-2 text-white/80 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <SignedIn>
              <Link href="/dashboard" className="rounded-lg px-2 py-2 text-white/80 hover:bg-white/5" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              <Link href="/history" className="rounded-lg px-2 py-2 text-white/80 hover:bg-white/5" onClick={() => setOpen(false)}>
                Historique
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button type="button" className="rounded-lg px-2 py-2 text-left text-white/80 hover:bg-white/5">
                  Connexion
                </button>
              </SignInButton>
            </SignedOut>
            <Link
              href="/create"
              className="mt-1 rounded-full bg-[#20C997] px-4 py-2 text-center font-semibold text-[#111827]"
              onClick={() => setOpen(false)}
            >
              Creer une affiche
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
