"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { AppearanceSwitch } from "@/components/chrome/appearance-switch";
import { useCopy } from "@/components/chrome/locale-provider";
import { coverAccountLinks } from "@/components/cover/cover-links";

export function CoverBar({ signedIn }: { signedIn: boolean }) {
  const t = useCopy();
  const memberLinks = coverAccountLinks(true, t.nav);

  return (
    <div className="cover-bar-row">
      <BrandLogo size="sm" wordmark="ink" className="cover-logo" />
      <div className="cover-bar-inline">
        <AppearanceSwitch tone="cover" />
        {signedIn ? (
          memberLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`cover-btn cover-btn-${link.kind}`}>
              {link.label}
            </Link>
          ))
        ) : (
          <>
            <Link href="/sign-in" className="cover-text-link">
              {t.nav.signInCover}
            </Link>
            <Link href="/sign-up" className="cover-btn cover-btn-primary">
              {t.nav.createAccount}
            </Link>
          </>
        )}
      </div>
      <details className="menu-disclosure cover-disclosure">
        <summary
          className="cover-burger"
          aria-label={t.menu.open}
          data-open={t.menu.open}
          data-close={t.menu.close}
        >
          <BurgerGlyph />
        </summary>
        <div className="cover-menu">
          <AppearanceSwitch />
          {signedIn ? (
            memberLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`cover-btn cover-btn-${link.kind}`}>
                {link.label}
              </Link>
            ))
          ) : (
            <>
              <Link href="/sign-in" className="cover-btn cover-btn-secondary">
                {t.nav.signInCover}
              </Link>
              <Link href="/sign-up" className="cover-btn cover-btn-primary">
                {t.nav.createAccount}
              </Link>
            </>
          )}
        </div>
      </details>
    </div>
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
