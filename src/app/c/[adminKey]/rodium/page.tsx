import { prisma } from "@/lib/prisma";
import { OBSERVED_VARIANT_SAMPLE, summarizeVariantCosts } from "@/lib/variants";
import { listRodiumImageModels } from "@/server/rodium";
import { getAdminStats } from "@/server/admin-stats";

export default async function AdminRodiumPage() {
  const [stats, models, recent, variantRows] = await Promise.all([
    getAdminStats("30"),
    listRodiumImageModels().catch(() => []),
    prisma.generation.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.generation.findMany({
      where: { variant: { not: null } },
      select: { variant: true, status: true, rodiCost: true },
    }),
  ]);
  const variants = summarizeVariantCosts(variantRows);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">IA / Rodium</h1>
      <div className="grid gap-3 md:grid-cols-4">
        <article className="admin-card p-4"><p className="text-sm text-slate-500">RODI aujourd’hui</p><p className="text-2xl font-bold">{stats.rodiToday.toFixed(3)}</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">RODI 7 jours</p><p className="text-2xl font-bold">{stats.rodiWeek.toFixed(3)}</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">RODI 30 jours</p><p className="text-2xl font-bold">{stats.rodiMonth.toFixed(3)}</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">RODI total</p><p className="text-2xl font-bold">{stats.rodiCost.toFixed(3)}</p></article>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="admin-card p-4"><p className="text-sm text-slate-500">Coût moyen</p><p className="text-2xl font-bold">{stats.avgRodi.toFixed(3)}</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">Durée moyenne</p><p className="text-2xl font-bold">{Math.round(stats.avgDurationMs / 1000)} s</p></article>
        <article className="admin-card p-4"><p className="text-sm text-slate-500">Erreurs</p><p className="text-2xl font-bold">{stats.generationsFailed}</p></article>
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
      <section className="admin-card space-y-2 p-4 text-sm">
        <h2 className="font-bold">Deux variantes</h2>
        <p>Générations A : {variants.countA}. Générations B : {variants.countB}.</p>
        <p>Coût total RODI : {variants.totalRodi}. Moyenne A : {variants.avgA ?? "n/a"}. Moyenne B : {variants.avgB ?? "n/a"}. Maximum : {variants.max ?? "n/a"}.</p>
        <p>Échecs A : {variants.failedA}. Échecs B : {variants.failedB}.</p>
        <p>
          Mesure du {OBSERVED_VARIANT_SAMPLE.measuredOn} avant cette fonction : {OBSERVED_VARIANT_SAMPLE.generations} générations, {OBSERVED_VARIANT_SAMPLE.completedWithCost} réussie à {OBSERVED_VARIANT_SAMPLE.maximum} RODI, {OBSERVED_VARIANT_SAMPLE.failed} échecs. Aucun taux RODI vers FCFA n&apos;est enregistré. La marge de deux appels pour 1 Mint n&apos;est pas prouvée. Les prix des packs ne sont pas modifiés.
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
