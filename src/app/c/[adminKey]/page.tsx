import Link from "next/link";
import { AdminPeriodNav } from "@/components/admin/admin-period-nav";
import { BarChart, Sparkline } from "@/components/admin/admin-charts";
import { getAdminStats, type AdminPeriod } from "@/server/admin-stats";
import { getAdminBasePath } from "@/lib/env";

type SearchParams = Promise<{ period?: string }>;

export default async function AdminHomePage({ searchParams }: { searchParams: SearchParams }) {
  const period = ((await searchParams).period ?? "30") as AdminPeriod;
  const safePeriod = ["1", "7", "30", "90", "365", "all"].includes(period) ? period : "30";
  const stats = await getAdminStats(safePeriod);
  const base = getAdminBasePath();
  const cards = [
    ["Revenus aujourd’hui", `${stats.revenueToday.toLocaleString("fr-FR")} FCFA`, stats.revenueSeries.map((p) => p.value), "#3B82F6"],
    ["Revenus 7 jours", `${stats.revenueWeek.toLocaleString("fr-FR")} FCFA`, stats.revenueSeries.map((p) => p.value), "#20C997"],
    ["Revenus 30 jours", `${stats.revenueMonth.toLocaleString("fr-FR")} FCFA`, stats.revenueSeries.map((p) => p.value), "#20C997"],
    ["Revenus total", `${stats.revenue.toLocaleString("fr-FR")} FCFA`, stats.revenueSeries.map((p) => p.value), "#F59E0B"],
    ["Utilisateurs", String(stats.usersTotal), stats.userSeries.map((p) => p.value), "#20C997"],
    ["Nouveaux / actifs", `${stats.usersNewWeek} / ${stats.usersActive}`, stats.userSeries.map((p) => p.value), "#3B82F6"],
    ["Suspendus", String(stats.usersSuspended), [stats.usersSuspended], "#F59E0B"],
    ["Mints restants", String(stats.remainingMints), stats.mintSeries.map((p) => p.value), "#20C997"],
    ["Mints achetés", String(stats.mintsSold), stats.mintSeries.map((p) => p.value), "#3B82F6"],
    ["Mints consommés", String(stats.mintsConsumed), stats.mintSeries.map((p) => p.value), "#20C997"],
    ["Mints expirés / gratuits", `${stats.mintsExpired} / ${stats.mintsFree}`, [stats.mintsExpired, stats.mintsFree], "#F59E0B"],
    ["Mints admin / remboursés", `${stats.mintsAdminAdd} / ${stats.mintsRefunded}`, [stats.mintsAdminAdd, stats.mintsRefunded], "#20C997"],
    ["Générations OK / KO", `${stats.generationsSuccess} / ${stats.generationsFailed}`, stats.generationSeries.map((p) => p.value), "#20C997"],
    ["Taux d’erreur", `${Math.round(stats.errorRate * 100)}%`, [stats.errorRate * 100], "#F59E0B"],
    ["Durée moyenne", `${Math.round(stats.avgDurationMs / 1000)} s`, [stats.avgDurationMs], "#3B82F6"],
    ["RODI total / période", `${stats.rodiCost.toFixed(3)} / ${stats.rodiPeriod.toFixed(3)}`, stats.rodiSeries.map((p) => p.value), "#20C997"],
    ["Paiements OK / pending", `${stats.successfulPayments} / ${stats.pendingPayments}`, [stats.successfulPayments, stats.pendingPayments], "#3B82F6"],
    ["Failed / cancelled", `${stats.failedPayments} / ${stats.cancelledPayments}`, [stats.failedPayments, stats.cancelledPayments], "#F59E0B"],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Contrôle du SaaS — données serveur uniquement.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/api/admin/export?type=users" className="btn-secondary">Export users</Link>
          <Link href="/api/admin/export?type=payments" className="btn-secondary">Export paiements</Link>
          <Link href="/api/admin/export?type=generations" className="btn-secondary">Export générations</Link>
        </div>
      </div>
      <AdminPeriodNav baseHref={base} current={safePeriod} />
      {stats.alerts.length ? (
        <div className="space-y-2">
          {stats.alerts.map((alert) => (
            <Link key={alert!.text} href={alert!.href ?? base} className="block rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {alert!.text}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([title, value, spark, color]) => (
          <article key={title} className="admin-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{title}</p>
                <p className="mt-2 text-2xl font-bold">{value}</p>
              </div>
              <Sparkline values={[...spark]} color={color} />
            </div>
          </article>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart label="Évolution des revenus" points={stats.revenueSeries} color="#20C997" />
        <BarChart label="Générations" points={stats.generationSeries} color="#3B82F6" />
      </div>
      <section className="admin-card p-4">
        <h2 className="font-bold">Activité récente</h2>
        <div className="mt-3 space-y-2 text-sm">
          {stats.activity.length === 0 ? <p className="text-slate-500">Aucune activité pour le moment.</p> : null}
          {stats.activity.map((item) => (
            <Link key={`${item.at}-${item.text}`} href={item.href} className="block rounded-xl px-2 py-1.5 hover:bg-slate-50">
              <span className="text-slate-400">{new Date(item.at).toLocaleString("fr-FR")} · </span>
              {item.text}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
