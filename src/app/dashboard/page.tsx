import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Dashboard"),
  robots: { index: false, follow: false },
};
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";

export default async function DashboardPage() {
  const user = await requireActiveCurrentUser();
  const [account, lastGenerations] = await Promise.all([
    prisma.creditAccount.findUnique({ where: { userId: user.id } }),
    prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const balance = account?.balance ?? 0;
  return (
    <div className="space-y-6">
      <section className="card flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-slate-500">Tes Mints</p>
          <h1 className="mt-1 text-3xl font-extrabold text-night">
            {balance} Mint{balance > 1 ? "s" : ""} restant{balance > 1 ? "s" : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-500">1 Mint = 1 affiche · l’export ne consomme rien</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/create" className="btn-primary">
            Créer une affiche
          </Link>
          <Link href="/pricing" className="btn-secondary">
            Acheter des Mints
          </Link>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Dernières créations</h2>
          <Link href="/history" className="text-sm font-semibold text-violet">
            Historique
          </Link>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          {lastGenerations.length === 0 ? (
            <p className="text-slate-500">Aucune génération pour le moment.</p>
          ) : null}
          {lastGenerations.map((generation) => (
            <div key={generation.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>{String((generation.brief as { title?: string })?.title ?? "Sans titre")}</span>
              <span className="text-slate-500">{statusLabel(generation.status)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "COMPLETED") return "Prête";
  if (status === "FAILED") return "Échec";
  return "En cours";
}
