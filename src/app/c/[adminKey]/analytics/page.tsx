import { AdminPeriodNav } from "@/components/admin/admin-period-nav";
import { BarChart } from "@/components/admin/admin-charts";
import { getAdminStats, type AdminPeriod } from "@/server/admin-stats";
import { getAdminBasePath } from "@/lib/env";

type SearchParams = Promise<{ period?: string }>;

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const period = ((await searchParams).period ?? "30") as AdminPeriod;
  const safePeriod = ["1", "7", "30", "90", "365", "all"].includes(period) ? period : "30";
  const stats = await getAdminStats(safePeriod);
  const base = `${getAdminBasePath()}/analytics`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Analytics</h1>
        <a href="/api/admin/export?type=analytics" className="btn-secondary">Export CSV</a>
      </div>
      <AdminPeriodNav baseHref={base} current={safePeriod} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="admin-card p-4">CA {stats.revenuePeriod.toLocaleString("fr-FR")} FCFA</article>
        <article className="admin-card p-4">{stats.generationsPeriod} générations</article>
        <article className="admin-card p-4">{stats.usersNewPeriod} nouveaux utilisateurs</article>
        <article className="admin-card p-4">{stats.rodiPeriod.toFixed(3)} RODI</article>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart label="Revenus" points={stats.revenueSeries} color="#20C997" />
        <BarChart label="Utilisateurs" points={stats.userSeries} color="#3B82F6" />
        <BarChart label="Générations" points={stats.generationSeries} color="#20C997" />
        <BarChart label="Mouvements Mints" points={stats.mintSeries} color="#F59E0B" />
        <BarChart label="RODI" points={stats.rodiSeries} color="#20C997" />
      </div>
      <section className="admin-card p-4">
        <h2 className="font-bold">Par offre</h2>
        <div className="mt-3 space-y-2 text-sm">
          {stats.revenueByPlan.map((row) => (
            <p key={row.plan}>
              {row.plan} · {row.count} paiements · {row.amount.toLocaleString("fr-FR")} FCFA
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
