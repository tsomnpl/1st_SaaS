import Link from "next/link";
import { coverAccountLinks } from "@/components/cover/cover-links";
import { getDictionary } from "@/lib/locale";

export async function CoverGuestActions({ variant }: { variant: "bar" | "band" }) {
  const { t } = await getDictionary();
  const links = coverAccountLinks(false, t.nav);
  if (variant === "bar") {
    return (
      <div className="cover-bar-links">
        <Link href="/sign-in" className="cover-text-link">
          {t.nav.signInCover}
        </Link>
        <Link href="/sign-up" className="cover-btn cover-btn-primary">
          {t.nav.createAccount}
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

export async function CoverMemberActions({ variant }: { variant: "bar" | "band" }) {
  const { t } = await getDictionary();
  const links = coverAccountLinks(true, t.nav);
  if (variant === "bar") {
    return (
      <div className="cover-bar-links">
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
        {t.nav.more}
      </Link>
    </div>
  );
}
