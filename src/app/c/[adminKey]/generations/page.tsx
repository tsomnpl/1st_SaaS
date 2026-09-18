import { prisma } from "@/lib/prisma";

export default async function AdminGenerationsPage() {
  const generations = await prisma.generation.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { user: true },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Generations</h1>
      <div className="space-y-2">
        {generations.map((generation) => (
          <article key={generation.id} className="card p-4 text-sm">
            <p className="font-semibold">{generation.status} · {generation.model}</p>
            <p className="text-slate-500">
              {generation.user.email ?? generation.userId} · RODI {generation.rodiCost ?? 0} · score{" "}
              {generation.qualityScore ?? 0}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
