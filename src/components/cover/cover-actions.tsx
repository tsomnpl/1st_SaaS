import Link from "next/link";
import { coverAccountLinks } from "@/components/cover/cover-links";

export function CoverGuestActions({ variant }: { variant: "bar" | "band" }) {
  const links = coverAccountLinks(false);
  if (variant === "bar") {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/sign-in" className="cover-text-link">
          Se connecter
        </Link>
        <Link href="/sign-up" className="cover-btn cover-btn-primary">
          Créer un compte
        </Link>
      </div>
    );
  }

  return (
    <div className="cover-actions">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={link.kind === "link" ? "cover-text-link cover-more" : `cover-btn cover-btn-${link.kind}`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function CoverMemberActions({ variant }: { variant: "bar" | "band" }) {
  const links = coverAccountLinks(true);
  if (variant === "bar") {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={`cover-btn cover-btn-${link.kind}`}>
            {link.label}
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className="cover-actions">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={`cover-btn cover-btn-${link.kind}`}>
          {link.label}
        </Link>
      ))}
      <Link href="/decouvrir" className="cover-text-link cover-more">
        En savoir plus
      </Link>
    </div>
  );
}
