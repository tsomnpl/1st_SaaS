import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { CookieSettingsButton } from "@/components/legal/cookie-settings-button";

const LINKS = [
  { href: "/creations", label: "Créations" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/create", label: "Créer une affiche" },
  { href: "/sign-in", label: "Connexion" },
  { href: "/sign-up", label: "Inscription" },
  { href: "/privacy", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/terms", label: "Conditions d’utilisation" },
  { href: "/refund", label: "Remboursement" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div>
          <BrandLogo withSlogan size="sm" />
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            Transforme une idée en affiche professionnelle. Sans designer, sans prompt.
          </p>
        </div>
        <nav aria-label="Pied de page" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#20C997]">
              {link.label}
            </Link>
          ))}
          <CookieSettingsButton className="hover:text-[#20C997]" />
        </nav>
      </div>
    </footer>
  );
}
