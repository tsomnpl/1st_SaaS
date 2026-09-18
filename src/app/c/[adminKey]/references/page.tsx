import { prisma } from "@/lib/prisma";
import { INSPIRATION_LIBRARY } from "@/lib/inspiration";
import { AdminReferencesForm } from "@/components/admin/admin-references-form";

export default async function AdminReferencesPage() {
  const customRefs = await prisma.reference.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">References</h1>
      <AdminReferencesForm />
      <section className="card p-4">
        <h2 className="font-bold">Base intégrée</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {INSPIRATION_LIBRARY.map((ref) => (
            <article key={ref.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-semibold">{ref.domain}</p>
              <p className="text-slate-500">{ref.composition}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="card p-4">
        <h2 className="font-bold">Ajouts studio</h2>
        <div className="mt-3 space-y-2 text-sm">
          {customRefs.length === 0 ? <p className="text-slate-500">Aucune référence custom.</p> : null}
          {customRefs.map((ref) => (
            <article key={ref.id} className="rounded-xl bg-slate-50 p-3">
              <p className="font-semibold">{ref.domain} · {ref.style ?? "n/a"}</p>
              <p className="text-slate-500">{ref.composition}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
