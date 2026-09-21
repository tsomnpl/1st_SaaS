import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";

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
        <div className="flex flex-wrap gap-6 text-sm text-slate-600">
          <Link href="/creations" className="hover:text-[#6D28D9]">
            Créations
          </Link>
          <Link href="/pricing" className="hover:text-[#6D28D9]">
            Tarifs
          </Link>
          <Link href="/create" className="hover:text-[#6D28D9]">
            Créer une affiche
          </Link>
          <Link href="/sign-in" className="hover:text-[#6D28D9]">
            Connexion
          </Link>
          <Link href="/sign-up" className="hover:text-[#6D28D9]">
            Inscription
          </Link>
          <Link href="/privacy" className="hover:text-[#6D28D9]">
            Confidentialité
          </Link>
          <Link href="/terms" className="hover:text-[#6D28D9]">
            CGU
          </Link>
        </div>
      </div>
    </footer>
  );
}
