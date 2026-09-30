"use client";

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense, useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
import { AppearanceSwitch } from "@/components/chrome/appearance-switch";
import { useCopy, useLocale } from "@/components/chrome/locale-provider";
import { HeaderPulse, type NoticeCounts, type NoticeItem } from "@/components/header-pulse";

type Props = {
  signedIn?: boolean;
  mintBalance?: number | null;
  showAdmin?: boolean;
  adminHref?: string;
};

const EMPTY_COUNTS: NoticeCounts = { total: 0, history: 0, admin: 0 };

export function SiteHeader({ signedIn = false, mintBalance = null, showAdmin = false, adminHref = "" }: Props) {
  const t = useCopy();
  const locale = useLocale();
  const { isSignedIn } = useAuth();
  const live = signedIn || Boolean(isSignedIn);
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [balance, setBalance] = useState(mintBalance);
  const [counts, setCounts] = useState<NoticeCounts>(EMPTY_COUNTS);
  const [items, setItems] = useState<NoticeItem[]>([]);

  const publicLinks = [
    { href: "/decouvrir", label: t.nav.discover },
    { href: "/creations", label: t.nav.creations },
    { href: "/decouvrir#comment-ca-marche", label: t.nav.how },
    { href: "/pricing", label: t.nav.pricing },
  ];
  const accountLinks = [
    { href: "/dashboard", label: t.nav.dashboard, badge: 0 },
    { href: "/history", label: t.nav.history, badge: counts.history },
    { href: "/profile", label: t.nav.profile, badge: 0 },
    ...(showAdmin && adminHref ? [{ href: adminHref, label: t.nav.admin, badge: counts.admin }] : []),
  ];

  async function markRead() {
    await fetch("/api/me/notifications", { method: "POST" });
    setCounts(EMPTY_COUNTS);
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    setBellOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/75 backdrop-blur-xl">
      {live ? (
        <Suspense fallback={null}>
          <HeaderPulse
            enabled
            onPulse={(pulse) => {
              if (typeof pulse.balance === "number") setBalance(pulse.balance);
              setCounts(pulse.counts);
              setItems(pulse.items);
            }}
          />
        </Suspense>
      ) : null}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <BrandLogo size="sm" />

        <nav className="hidden flex-1 flex-wrap items-center justify-end gap-1.5 md:flex">
          {publicLinks.map((link, index) => (
            <NavPill key={link.href} href={link.href} label={link.label} index={index} />
          ))}
          <SignedIn>
            {accountLinks.map((link, index) => (
              <NavPill key={link.href} href={link.href} label={link.label} index={index + publicLinks.length} badge={link.badge} />
            ))}
            {typeof balance === "number" ? (
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                {balance} Mint{balance > 1 ? "s" : ""}
              </span>
            ) : null}
            <NotificationBell
              label={t.notices.bell}
              empty={t.notices.empty}
              mark={t.notices.mark}
              locale={locale}
              open={bellOpen}
              count={counts.total}
              items={items}
              onToggle={() => setBellOpen((value) => !value)}
              onMark={() => void markRead()}
            />
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className="rounded-xl bg-[#6D28D9] px-3 py-1.5 text-xs font-semibold text-white">
                {t.nav.signIn}
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="rounded-xl bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-[#1E293B]">
                {t.nav.signUp}
              </button>
            </SignUpButton>
          </SignedOut>
          <Link href="/create" className="btn-primary px-3 py-1.5 text-xs">
            {t.nav.create}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <AppearanceSwitch />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white md:hidden"
            aria-expanded={open}
            aria-label={open ? t.menu.close : t.menu.open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="flex flex-col gap-1.5">
              <span className={`h-0.5 w-4 bg-slate-800 transition ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-4 bg-slate-800 transition ${open ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-4 bg-slate-800 transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2 text-sm">
            {publicLinks.map((link, index) => (
              <NavPill key={link.href} href={link.href} label={link.label} index={index} onClick={() => setOpen(false)} />
            ))}
            <SignedIn>
              {accountLinks.map((link, index) => (
                <NavPill
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  index={index + publicLinks.length}
                  badge={link.badge}
                  onClick={() => setOpen(false)}
                />
              ))}
              {typeof balance === "number" ? (
                <span className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                  {balance} Mint{balance > 1 ? "s" : ""}
                </span>
              ) : null}
              <NotificationBell
                label={t.notices.bell}
                empty={t.notices.empty}
                mark={t.notices.mark}
                locale={locale}
                open={bellOpen}
                count={counts.total}
                items={items}
                onToggle={() => setBellOpen((value) => !value)}
                onMark={() => void markRead()}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button type="button" className="rounded-xl bg-[#6D28D9] px-3 py-2 text-left text-xs font-semibold text-white">
                  {t.nav.signIn}
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button type="button" className="rounded-xl bg-[#10B981] px-3 py-2 text-left text-xs font-semibold text-[#1E293B]">
                  {t.nav.signUp}
                </button>
              </SignUpButton>
            </SignedOut>
            <Link href="/create" className="btn-primary mt-2" onClick={() => setOpen(false)}>
              {t.nav.create}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavPill({
  href,
  label,
  index,
  badge = 0,
  onClick,
}: {
  href: string;
  label: string;
  index: number;
  badge?: number;
  onClick?: () => void;
}) {
  const tone = index % 2 === 0 ? "bg-[#6D28D9] text-white hover:bg-[#5B21B6]" : "bg-[#10B981] text-[#1E293B] hover:brightness-110";
  return (
    <Link href={href} onClick={onClick} className={`relative rounded-xl px-2.5 py-1.5 text-xs font-semibold ${tone}`}>
      {label}
      {badge > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#6D28D9] ring-1 ring-[#6D28D9]">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function NotificationBell({
  label,
  empty,
  mark,
  locale,
  open,
  count,
  items,
  onToggle,
  onMark,
}: {
  label: string;
  empty: string;
  mark: string;
  locale: string;
  open: boolean;
  count: number;
  items: NoticeItem[];
  onToggle: () => void;
  onMark: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#10B981] text-[#1E293B]"
        aria-label={label}
        aria-expanded={open}
        onClick={onToggle}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
        {count > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#6D28D9] px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">{label}</p>
            {count > 0 ? (
              <button type="button" className="text-xs font-semibold text-[#6D28D9]" onClick={onMark}>
                {mark}
              </button>
            ) : null}
          </div>
          {items.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : null}
          <ul className="max-h-80 space-y-2 overflow-auto">
            {items.map((item) => {
              const body = (
                <>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.body}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleString(locale === "en" ? "en-GB" : "fr-FR")}
                  </p>
                </>
              );
              return (
                <li key={item.id} className={`rounded-xl px-3 py-2 ${item.readAt ? "bg-slate-50" : "bg-[#F5F3FF]"}`}>
                  {item.href ? (
                    <Link href={item.href} onClick={onMark}>
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
