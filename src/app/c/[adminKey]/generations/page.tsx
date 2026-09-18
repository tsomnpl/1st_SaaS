import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ status?: string; model?: string; q?: string }>;

function briefField(brief: unknown, key: string) {
  if (!brief || typeof brief !== "object") return "";
  const value = (brief as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminGenerationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const generations = await prisma.generation.findMany({
    where: {
      status: params.status ? (params.status as never) : undefined,
      model: params.model || undefined,
      user: params.q
        ? { email: { contains: params.q, mode: "insensitive" } }
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 120,
    include: { user: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Générations</h1>
        <a href="/api/admin/export?type=generations" className="btn-secondary">Export CSV</a>
      </div>
      <form className="grid gap-3 md:grid-cols-3">
        <input name="q" defaultValue={params.q} placeholder="E-mail utilisateur" className="rounded-xl border border-slate-200 px-3 py-2" />
        <input name="model" defaultValue={params.model} placeholder="Modèle" className="rounded-xl border border-slate-200 px-3 py-2" />
        <select name="status" defaultValue={params.status ?? ""} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Tous les statuts</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="FAILED">FAILED</option>
          <option value="PENDING">PENDING</option>
        </select>
        <button className="btn-secondary md:col-span-3" type="submit">Filtrer</button>
      </form>
      <div className="space-y-2">
        {generations.map((generation) => (
          <article key={generation.id} className="admin-card p-4 text-sm">
            <p className="font-semibold">
              {generation.status} · {generation.model} · {generation.user.email ?? generation.userId}
            </p>
            <p className="text-slate-500">
              {briefField(generation.brief, "domain") || "domaine n/a"} · {briefField(generation.brief, "title")} · RODI{" "}
              {generation.rodiCost ?? 0} · Mint {generation.mintCost} ·{" "}
              {Math.round((generation.updatedAt.getTime() - generation.createdAt.getTime()) / 1000)}s
              {briefField(generation.brief, "regenerateFromId") ? " · régénération" : ""}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
