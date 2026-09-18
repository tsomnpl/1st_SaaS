import { getAdminStats } from "@/server/admin-stats";

export default async function AdminHomePage() {
  const stats = await getAdminStats();
  const cards = [
    ["Revenus (FCFA)", stats.revenue.toLocaleString("fr-FR")],
    ["Utilisateurs", String(stats.usersTotal)],
    ["Actifs", String(stats.usersActive)],
    ["Générations", String(stats.generations)],
    ["Mints vendus", String(stats.mintsSold)],
    ["Mints consommés", String(stats.mintsConsumed)],
    ["Mints expirés", String(stats.mintsExpired)],
    ["Mints gratuits", String(stats.mintsFree)],
    ["Mints restants", String(stats.remainingMints)],
    ["RODI estimé", stats.rodiCost.toFixed(3)],
    ["Paiements OK", String(stats.successfulPayments)],
    ["Pending / failed", `${stats.pendingPayments} / ${stats.failedPayments}`],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([title, value]) => (
          <article key={title} className="card p-4">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
