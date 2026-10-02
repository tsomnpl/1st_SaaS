"use client";

import { SignedIn, UserButton, useAuth } from "@clerk/nextjs";
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

export function SiteHeader(props: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className={`mx-auto w-full min-w-0 px-4 py-3 ${props.showAdmin ? "max-w-[1500px]" : "max-w-6xl"}`}>
        <Suspense fallback={null}>
          <DesktopNav {...props} />
        </Suspense>
      </div>
    </header>
  );
}

function DesktopNav({ signedIn = false, mintBalance = null, showAdmin = false, adminHref = "" }: Props) {
  const t = useCopy();
  const locale = useLocale();
  const { isSignedIn } = useAuth();
  const live = signedIn || Boolean(isSignedIn);
  const [bellOpen, setBellOpen] = useState(false);
  const [balance, setBalance] = useState(mintBalance);
  const [counts, setCounts] = useState<NoticeCounts>(EMPTY_COUNTS);
  const [items, setItems] = useState<NoticeItem[]>([]);

  const publicLinks = [
    { href: "/decouvrir", label: t.nav.discover, badge: 0 },
    { href: "/creations", label: t.nav.creations, badge: 0 },
    { href: "/decouvrir#comment-ca-marche", label: t.nav.how, badge: 0 },
    { href: "/pricing", label: t.nav.pricing, badge: 0 },
  ];
  const accountLinks = [
    { href: "/dashboard", label: t.nav.dashboard, badge: 0 },
    { href: "/history", label: t.nav.history, badge: counts.history },
    { href: "/profile", label: t.nav.profile, badge: 0 },
    ...(showAdmin && adminHref ? [{ href: adminHref, label: t.nav.admin, badge: counts.admin }] : []),
  ];
  const createLink = { href: "/create", label: t.nav.create, badge: 0 };
  const primaryLinks = live
    ? [publicLinks[0], accountLinks[0], createLink]
    : [publicLinks[0], publicLinks[3], createLink];
  const overflowLinks = [...publicLinks, ...(live ? accountLinks : [])].filter(
    (link) => !primaryLinks.some((item) => item.href === link.href),
  );

  async function markRead() {
    await fetch("/api/me/notifications", { method: "POST" });
    setCounts(EMPTY_COUNTS);
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    setBellOpen(false);
  }

  return (
    <>
      {live ? (
        <HeaderPulse
          enabled
          onPulse={(pulse) => {
            if (typeof pulse.balance === "number") setBalance(pulse.balance);
            setCounts(pulse.counts);
            setItems(pulse.items);
          }}
        />
      ) : null}
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="shrink-0">
          <BrandLogo size="sm" />
        </div>
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <AppearanceSwitch />
          <nav className="hidden min-w-0 items-center justify-end gap-1.5 md:flex">
            {primaryLinks.map((link) => (
              <NavPill key={link.href} href={link.href} label={link.label} badge={link.badge} />
            ))}
          </nav>
          <details className="menu-disclosure relative">
            <summary
              className="menu-summary inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg bg-[#6D28D9] text-white [&::-webkit-details-marker]:hidden"
              aria-label={t.menu.open}
              data-open={t.menu.open}
              data-close={t.menu.close}
            >
              <BurgerGlyph />
            </summary>
            <div className="absolute right-0 z-50 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
              {overflowLinks.map((link) => (
                <NavPill key={link.href} href={link.href} label={link.label} badge={link.badge} />
              ))}
              {!live ? (
                <>
                  <Link href="/sign-in" className="guest-only flex min-h-11 items-center whitespace-nowrap rounded-lg bg-[#6D28D9] px-3 text-sm font-semibold text-white">
                    {t.nav.signIn}
                  </Link>
                  <Link href="/sign-up" className="guest-only flex min-h-11 items-center whitespace-nowrap rounded-lg bg-[#6D28D9] px-3 text-sm font-semibold text-white">
                    {t.nav.signUp}
                  </Link>
                </>
              ) : (
                <>
                  <style>{".guest-only{display:none !important}"}</style>
                  {typeof balance === "number" ? (
                    <span className="px-3 text-xs font-semibold text-slate-700">
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
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
      <nav className="mt-2 flex gap-1.5 md:hidden">
        {primaryLinks.map((link) => (
          <NavPill key={link.href} href={link.href} label={link.label} badge={link.badge} />
        ))}
      </nav>
    </>
  );
}

function BurgerGlyph() {
  return (
    <span className="flex flex-col gap-1.5" aria-hidden="true">
      <span className="burger-top h-0.5 w-4 bg-current" />
      <span className="burger-mid h-0.5 w-4 bg-current" />
      <span className="burger-bot h-0.5 w-4 bg-current" />
    </span>
  );
}

function NavPill({
  href,
  label,
  badge = 0,
  onClick,
}: {
  href: string;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="relative shrink-0 whitespace-nowrap rounded-lg bg-[#6D28D9] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#5B21B6]">
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
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#6D28D9] text-white"
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
