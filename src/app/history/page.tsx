import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentUser } from "@/server/users";

export default async function HistoryPage() {
  const user = await getOrCreateCurrentUser();
  const [generations, transactions, payments] = await Promise.all([
    prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.creditTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { plan: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Historique</h1>

      <section className="card p-5">
        <h2 className="text-xl font-semibold">Generations</h2>
        <div className="mt-3 space-y-2 text-sm">
          {generations.map((g) => (
            <div key={g.id} className="rounded bg-white/5 p-3">
              <p className="font-medium">{String((g.brief as { title?: string })?.title ?? "Sans titre")}</p>
              <p className="text-white/70">Status: {g.status} | Model: {g.model} | Mint: {g.mintCost}</p>
            </div>
          ))}
          {generations.length === 0 && <p className="text-white/70">Aucune generation.</p>}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-semibold">Transactions Mints</h2>
        <div className="mt-3 space-y-2 text-sm">
          {transactions.map((t) => (
            <div key={t.id} className="rounded bg-white/5 p-3">
              <p>{t.type} | {t.amount > 0 ? `+${t.amount}` : t.amount} Mint</p>
              <p className="text-white/70">Solde: {t.balanceBefore} {"->"} {t.balanceAfter}</p>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-white/70">Aucune transaction.</p>}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-semibold">Paiements</h2>
        <div className="mt-3 space-y-2 text-sm">
          {payments.map((p) => (
            <div key={p.id} className="rounded bg-white/5 p-3">
              <p>{p.plan.name} - {p.amountFcfa.toLocaleString("fr-FR")} FCFA</p>
              <p className="text-white/70">Status: {p.status} | orderId: {p.orderId}</p>
            </div>
          ))}
          {payments.length === 0 && <p className="text-white/70">Aucun paiement.</p>}
        </div>
      </section>
    </div>
  );
}
