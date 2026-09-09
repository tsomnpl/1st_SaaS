import { PaymentStatus } from "@prisma/client";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdminUser();

  const [usersTotal, usersActive, payments, generations, mintAggregate] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.payment.findMany({ include: { plan: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.generation.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.creditAccount.aggregate({ _sum: { balance: true } }),
  ]);

  const revenue = payments
    .filter((payment) => payment.status === PaymentStatus.COMPLETED)
    .reduce((sum, payment) => sum + payment.amountFcfa, 0);
  const rodiCost = generations.reduce((sum, g) => sum + (g.rodiCost ?? 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi title="Utilisateurs" value={String(usersTotal)} />
        <Kpi title="Utilisateurs actifs" value={String(usersActive)} />
        <Kpi title="Mints restants" value={String(mintAggregate._sum.balance ?? 0)} />
        <Kpi title="CA (FCFA)" value={revenue.toLocaleString("fr-FR")} />
        <Kpi title="Cout RODI estime" value={rodiCost.toFixed(3)} />
        <Kpi title="Marge brute estimee" value={(revenue - rodiCost).toFixed(3)} />
      </div>
      <div>
        <Link href="/admin/references" className="rounded bg-emerald-500 px-3 py-2 font-semibold text-slate-900">
          Gerer bibliotheque d'inspiration
        </Link>
      </div>

      <section className="card p-5">
        <h2 className="text-xl font-semibold">Paiements recents</h2>
        <div className="mt-3 space-y-2 text-sm">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded bg-white/5 p-3">
              <p>{payment.plan.name} - {payment.amountFcfa.toLocaleString("fr-FR")} FCFA - {payment.status}</p>
              <p className="text-white/70">orderId: {payment.orderId} | token: {payment.tokenPay ?? "N/A"}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-semibold">Generations recentes</h2>
        <div className="mt-3 space-y-2 text-sm">
          {generations.map((generation) => (
            <div key={generation.id} className="rounded bg-white/5 p-3">
              <p>{generation.model} - {generation.status}</p>
              <p className="text-white/70">RODI: {generation.rodiCost ?? 0} | score: {generation.qualityScore ?? 0}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <article className="card p-4">
      <p className="text-sm text-white/70">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-emerald-300">{value}</p>
    </article>
  );
}
