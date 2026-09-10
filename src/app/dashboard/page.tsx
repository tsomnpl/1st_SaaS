import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentUser } from "@/server/users";

export default async function DashboardPage() {
  const user = await getOrCreateCurrentUser();
  const account = await prisma.creditAccount.findUnique({ where: { userId: user.id } });
  const lastGenerations = await prisma.generation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const balance = account?.balance ?? 0;
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <p className="text-sm text-white/70">Solde actuel</p>
        <h1 className="mt-1 text-3xl font-bold text-[#20C997]">
          {balance} Mints = {balance} affiches restantes
        </h1>
        <div className="mt-4 flex gap-3">
          <Link href="/create" className="rounded-full bg-[#20C997] px-4 py-2 font-medium text-[#111827]">
            Creer une affiche
          </Link>
          <Link href="/pricing" className="rounded-full border border-white/20 px-4 py-2">
            Acheter des Mints
          </Link>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold">Dernieres generations</h2>
        <div className="mt-4 space-y-2 text-sm">
          {lastGenerations.length === 0 && (
            <p className="text-white/70">Aucune generation pour le moment.</p>
          )}
          {lastGenerations.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded bg-white/5 px-3 py-2">
              <span>{String((g.brief as { title?: string })?.title ?? "Sans titre")}</span>
              <span className="text-white/70">{g.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
