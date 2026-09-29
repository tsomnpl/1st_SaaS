"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { COOKIE_CHOICE_EVENT, COOKIE_CONSENT_KEY } from "@/components/legal/cookie-banner";

export function SupportCorner() {
  const pathname = usePathname() ?? "";
  const [lifted, setLifted] = useState(true);

  useEffect(() => {
    function sync() {
      setLifted(!window.localStorage.getItem(COOKIE_CONSENT_KEY));
    }
    sync();
    window.addEventListener(COOKIE_CHOICE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COOKIE_CHOICE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (pathname.startsWith("/support") || pathname.startsWith("/c/")) return null;

  return (
    <Link
      href="/support"
      aria-label="Ouvrir le support"
      className={`fixed right-4 z-[90] inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10B981] text-[#1E293B] shadow-[0_4px_12px_rgba(30,41,59,0.12)] transition-[background-color,bottom] duration-200 hover:bg-[#059669] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9] ${lifted ? "bottom-48 md:bottom-28" : "bottom-5"}`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" d="M4.5 13v-1a7.5 7.5 0 0 1 15 0v1" />
        <rect x="2.4" y="12" width="4.2" height="6.2" rx="1.1" />
        <rect x="17.4" y="12" width="4.2" height="6.2" rx="1.1" />
        <path strokeLinecap="round" d="M19.6 18.2v.8A2.2 2.2 0 0 1 17.4 21H14" />
      </svg>
    </Link>
  );
}
