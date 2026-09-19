import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Profil"),
  robots: { index: false, follow: false },
};
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";

export default async function ProfilePage() {
  const user = await requireActiveCurrentUser();
  const account = await prisma.creditAccount.findUnique({ where: { userId: user.id } });
  const kit = await prisma.brandKit.findUnique({ where: { userId: user.id } });

  return (
    <div className="card mx-auto max-w-xl space-y-5 p-6">
      <h1 className="text-3xl font-extrabold">Profil</h1>
      <p className="text-slate-600">{user.email ?? user.name ?? "Compte FlyerMint"}</p>
      <p className="text-sm text-slate-500">
        Solde : {account?.balance ?? 0} Mint{(account?.balance ?? 0) > 1 ? "s" : ""}
      </p>
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
        <p className="font-semibold">Kit de marque</p>
        {kit?.colors?.length || kit?.logoUrl ? (
          <p className="mt-1 text-slate-600">
            Couleurs mémorisées : {kit.colors.join(", ") || "—"}
            {kit.logoUrl ? " · logo enregistré" : ""}
          </p>
        ) : (
          <p className="mt-1 text-slate-500">Pas encore de kit. Coche « mémoriser » à la prochaine création.</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <UserButton />
        <span className="text-sm text-slate-500">Gérer le compte / déconnexion</span>
      </div>
      <div className="flex gap-3">
        <Link href="/create" className="btn-primary">
          Créer une affiche
        </Link>
        <Link href="/pricing" className="btn-secondary">
          Tarifs
        </Link>
      </div>
    </div>
  );
}
