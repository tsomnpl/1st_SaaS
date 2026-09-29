import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { getDictionary } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: pageTitle(t.profile.title),
    robots: { index: false, follow: false },
  };
}
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";
import { getBrandKit } from "@/server/brand-kit";

export default async function ProfilePage() {
  const { t } = await getDictionary();
  const user = await requireActiveCurrentUser();
  const account = await prisma.creditAccount.findUnique({ where: { userId: user.id } }).catch(() => null);
  const kit = await getBrandKit(user.id);

  return (
    <div className="card mx-auto max-w-xl space-y-5 p-6">
      <h1 className="text-3xl font-extrabold">{t.profile.title}</h1>
      <p className="text-slate-600">{user.email ?? user.name ?? t.profile.account}</p>
      <p className="text-sm text-slate-500">
        {t.profile.balance} : {account?.balance ?? 0} Mint{(account?.balance ?? 0) > 1 ? "s" : ""}
      </p>
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
        <p className="font-semibold">{t.profile.brand}</p>
        {kit?.colors?.length || kit?.logoUrl ? (
          <p className="mt-1 text-slate-600">
            {t.profile.colors} : {kit.colors.join(", ") || t.profile.none}
            {kit.logoUrl ? ` · ${t.profile.logoSaved}` : ""}
          </p>
        ) : (
          <p className="mt-1 text-slate-500">{t.profile.emptyKit}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <UserButton />
        <span className="text-sm text-slate-500">{t.profile.manage}</span>
      </div>
      <div className="flex gap-3">
        <Link href="/create" className="btn-primary">
          {t.nav.create}
        </Link>
        <Link href="/pricing" className="btn-secondary">
          {t.nav.pricing}
        </Link>
      </div>
    </div>
  );
}
