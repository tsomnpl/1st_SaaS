"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, THEME_STORAGE, type Locale } from "@/lib/i18n";
import { useCopy, useLocale } from "@/components/chrome/locale-provider";

type Theme = "light" | "dark";

export function AppearanceSwitch({ tone = "paper" }: { tone?: "paper" | "cover" }) {
  const locale = useLocale();
  const t = useCopy();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function chooseLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  function chooseTheme(next: Theme) {
    localStorage.setItem(THEME_STORAGE, next);
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
  }

  const shell =
    tone === "cover"
      ? "border-white/40 bg-white/15 text-white"
      : "border-slate-200 bg-white text-slate-700";
  const idle = tone === "cover" ? "text-white/80 hover:text-white" : "text-slate-500 hover:text-[#1E293B]";
  const on = "bg-[#10B981] text-[#1E293B]";

  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg border p-0.5 ${shell}`}>
      <LocaleButton active={locale === "fr"} className={locale === "fr" ? on : idle} onClick={() => chooseLocale("fr")}>
        FR
      </LocaleButton>
      <LocaleButton active={locale === "en"} className={locale === "en" ? on : idle} onClick={() => chooseLocale("en")}>
        EN
      </LocaleButton>
      <button
        type="button"
        aria-label={theme === "dark" ? t.theme.light : t.theme.dark}
        onClick={() => chooseTheme(theme === "dark" ? "light" : "dark")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${idle}`}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}

function LocaleButton({
  active,
  className,
  onClick,
  children,
}: {
  active: boolean;
  className: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path strokeLinecap="round" d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 13.2A6.2 6.2 0 0 1 10.8 5 6.4 6.4 0 1 0 19 14.6a6.2 6.2 0 0 1-2.5-1.4Z" />
    </svg>
  );
}
