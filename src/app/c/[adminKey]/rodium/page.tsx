import { prisma } from "@/lib/prisma";
import { listRodiumImageModels, getRodiumWallet } from "@/server/rodium";
import { getAdminStats } from "@/server/admin-stats";

export default async function AdminRodiumPage() {
  const [stats, models, recent, wallet] = await Promise.all([
    getAdminStats("30"),
    listRodiumImageModels().catch(() => []),
    prisma.generation.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    getRodiumWallet().catch(() => null),
  ]);
  const walletBalance =
    wallet && typeof wallet === "object"
      ? (wallet.balance ?? wallet.credits ?? wallet.amount ?? null)
      : null;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">IA / Rodium</h1>
      <div className="grid gap-3 md:grid-cols-4">
        <article className="admin-card p-4"><p className="text-sm text-slate-500">RODI aujourd’hui</p><p className="text-2xl font-bold">{stats.rodiToday.toFixed(3)}</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">RODI 7 jours</p><p className="text-2xl font-bold">{stats.rodiWeek.toFixed(3)}</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">RODI 30 jours</p><p className="text-2xl font-bold">{stats.rodiMonth.toFixed(3)}</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">RODI total</p><p className="text-2xl font-bold">{stats.rodiCost.toFixed(3)}</p></article>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <article className="admin-card p-4"><p className="text-sm text-slate-500">Coût moyen</p><p className="text-2xl font-bold">{stats.avgRodi.toFixed(3)}</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">Durée moyenne</p><p className="text-2xl font-bold">{Math.round(stats.avgDurationMs / 1000)} s</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">Erreurs</p><p className="text-2xl font-bold">{stats.generationsFailed}</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">Portefeuille Rodium</p><p className="text-2xl font-bold">{walletBalance == null ? "n/d" : String(walletBalance)}</p></article>
      </div>
      <section className="admin-card p-4">
        <h2 className="font-bold">Modèles</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Modèle</th>
                <th>Nb</th>
                <th>Coût moy.</th>
                <th>Coût total</th>
                <th>Erreur</th>
                <th>Durée moy.</th>
              </tr>
            </thead>
            <tbody>
              {stats.models.map((model) => (
                <tr key={model.model} className="border-t border-slate-100">
                  <td className="py-2">{model.model}</td>
                  <td>{model.count}</td>
                  <td>{model.avgCost.toFixed(3)}</td>
                  <td>{model.cost.toFixed(3)}</td>
                  <td>{Math.round(model.errorRate * 100)}%</td>
                  <td>{Math.round(model.avgDurationMs / 1000)} s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Modèles image détectés : {models.length ? models.join(", ") : "liste indisponible (clé absente ou /models silencieux)."}
        </p>
      </section>
      <section className="admin-card p-4">
        <h2 className="font-bold">Dernières générations</h2>
        <div className="mt-3 space-y-2 text-sm">
          {recent.map((generation) => (
            <p key={generation.id}>
              {generation.createdAt.toLocaleString("fr-FR")} · {generation.model} · {generation.status} · RODI {generation.rodiCost ?? 0}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
