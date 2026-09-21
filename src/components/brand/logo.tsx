import Link from "next/link";

type LogoProps = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  withSlogan?: boolean;
  onDark?: boolean;
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
  className = "",
}: LogoProps) {
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
        <span className={`block font-extrabold tracking-tight ${dim.text}`}>
          <span className={onDark ? "text-white" : "text-[#111827]"}>Flyer</span>
          <span className="bg-gradient-to-r from-[#20C997] to-[#0f766e] bg-clip-text text-transparent">
            Mint
          </span>
        </span>
        {withSlogan ? (
          <span className={`block text-[11px] font-medium ${onDark ? "text-white/70" : "text-slate-500"}`}>
            Créez des visuels qui marquent.
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex" aria-label="FlyerMint — accueil">
      {content}
    </Link>
  );
}
