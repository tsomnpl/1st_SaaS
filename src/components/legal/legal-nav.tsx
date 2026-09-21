import Link from "next/link";

const LINKS = [
  { href: "/privacy", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/terms", label: "Conditions d’utilisation" },
  { href: "/refund", label: "Remboursement" },
] as const;

export function LegalNav({ current }: { current?: (typeof LINKS)[number]["href"] }) {
  return (
    <nav aria-label="Documents légaux" className="mt-12 flex flex-wrap gap-3 border-t border-slate-200 pt-6 text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={current === link.href ? "page" : undefined}
          className={
            current === link.href
              ? "font-semibold text-[#111827]"
              : "text-slate-600 underline-offset-2 hover:text-[#20C997] hover:underline"
          }
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
