import { prisma } from "@/lib/prisma";
import { listRodiumImageModels } from "@/server/rodium";

export default async function AdminRodiumPage() {
  const generations = await prisma.generation.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const models = await listRodiumImageModels().catch(() => []);
  const rodiTotal = generations.reduce((sum, g) => sum + (g.rodiCost ?? 0), 0);
  const completed = generations.filter((g) => g.status === "COMPLETED");
  const failed = generations.filter((g) => g.status === "FAILED");
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">AI / Rodium</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="card p-4"><p className="text-sm text-slate-500">RODI total</p><p className="text-2xl font-bold">{rodiTotal.toFixed(3)}</p></article>
        <article className="card p-4"><p className="text-sm text-slate-500">Succès</p><p className="text-2xl font-bold">{completed.length}</p></article>
        <article className="card p-4"><p className="text-sm text-slate-500">Erreurs</p><p className="text-2xl font-bold">{failed.length}</p></article>
      </div>
      <section className="card p-4">
        <h2 className="font-bold">Modèles image détectés</h2>
        <p className="mt-2 text-sm text-slate-600">
          {models.length ? models.join(", ") : "Liste indisponible (clé absente ou endpoint /models silencieux)."}
        </p>
      </section>
    </div>
  );
}
