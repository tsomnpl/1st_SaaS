import Link from "next/link";
import { getAdminStats } from "@/server/admin-stats";
import { getAdminBasePath } from "@/lib/env";

export default async function AdminHomePage() {
  const stats = await getAdminStats();
  const base = getAdminBasePath();
  const cards = [
    ["Revenus total", `${stats.revenue.toLocaleString("fr-FR")} FCFA`],
    ["Revenus aujourd’hui", `${stats.revenueToday.toLocaleString("fr-FR")} FCFA`],
    ["Revenus 7 jours", `${stats.revenueWeek.toLocaleString("fr-FR")} FCFA`],
    ["Revenus 30 jours", `${stats.revenueMonth.toLocaleString("fr-FR")} FCFA`],
    ["Utilisateurs", String(stats.usersTotal)],
    ["Nouveaux (7j)", String(stats.usersNewWeek)],
    ["Actifs / suspendus", `${stats.usersActive} / ${stats.usersSuspended}`],
    ["Générations", `${stats.generationsSuccess} ok / ${stats.generationsFailed} ko`],
    ["Mints vendus", String(stats.mintsSold)],
    ["Mints consommés", String(stats.mintsConsumed)],
    ["Mints restants", String(stats.remainingMints)],
    ["Mints expirés / gratuits", `${stats.mintsExpired} / ${stats.mintsFree}`],
    ["Mints admin / remboursés", `${stats.mintsAdminAdd} / ${stats.mintsRefunded}`],
    ["RODI estimé", stats.rodiCost.toFixed(3)],
    ["Paiements OK / pending", `${stats.successfulPayments} / ${stats.pendingPayments}`],
    ["Paiements failed / cancelled", `${stats.failedPayments} / ${stats.cancelledPayments}`],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Contrôle du SaaS — données serveur uniquement.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/api/admin/export?type=users`} className="btn-secondary">
            Export users
          </Link>
          <Link href={`/api/admin/export?type=payments`} className="btn-secondary">
            Export paiements
          </Link>
        </div>
      </div>
      {stats.alerts.length ? (
        <div className="space-y-2">
          {stats.alerts.map((alert) => (
            <p key={alert!.text} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {alert!.text}
            </p>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value]) => (
          <article key={title} className="card p-4">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </article>
        ))}
      </div>
      <section className="card p-4">
        <h2 className="font-bold">Activité récente</h2>
        <div className="mt-3 space-y-2 text-sm">
          {stats.activity.length === 0 ? <p className="text-slate-500">Aucune activité pour le moment.</p> : null}
          {stats.activity.map((item) => (
            <p key={`${item.at}-${item.text}`}>
              <span className="text-slate-400">{new Date(item.at).toLocaleString("fr-FR")} · </span>
              {item.text}
            </p>
          ))}
        </div>
        <Link href={`${base}/logs`} className="mt-4 inline-block text-sm font-semibold text-[#6D28D9]">
          Voir les logs
        </Link>
      </section>
    </div>
  );
}
