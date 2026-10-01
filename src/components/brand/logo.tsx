"use client";

import Link from "next/link";
import { useCopy } from "@/components/chrome/locale-provider";

type LogoProps = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  withSlogan?: boolean;
  onDark?: boolean;
  wordmark?: "brand" | "ink";
  className?: string;
};

const sizes = {
  sm: { mark: 28, text: "text-lg" },
  md: { mark: 36, text: "text-xl" },
  lg: { mark: 52, text: "text-3xl" },
};

export function BrandLogo({
  href = "/",
  size = "md",
  withSlogan = false,
  onDark = false,
  wordmark = "brand",
  className = "",
}: LogoProps) {
  const t = useCopy();
  const dim = sizes[size];
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.svg"
        alt=""
        width={dim.mark}
        height={dim.mark}
        className="shrink-0"
      />
      <span className="leading-tight">
        <span className={`block whitespace-nowrap font-extrabold tracking-tight ${dim.text}`}>
          <span className={onDark ? "text-white" : wordmark === "ink" ? "text-inherit" : "text-[#1E293B]"}>Flyer</span>
          <span className={wordmark === "ink" ? "text-inherit" : onDark ? "text-white" : "text-[#6D28D9]"}>
            Mint
          </span>
        </span>
        {withSlogan ? (
          <span className={`block text-[11px] font-medium ${onDark ? "text-white/70" : "text-slate-500"}`}>
            {t.footer.slogan}
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex" aria-label={t.footer.home}>
      {content}
    </Link>
  );
}
