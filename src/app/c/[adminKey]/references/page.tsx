import { prisma } from "@/lib/prisma";
import { INSPIRATION_LIBRARY } from "@/lib/inspiration";
import { AdminReferencesForm } from "@/components/admin/admin-references-form";
import { AdminReferencesList } from "@/components/admin/admin-references-list";

export default async function AdminReferencesPage() {
  const customRefs = await prisma.reference.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Références</h1>
      <p className="text-sm text-slate-500">
        Ces références orientent la direction artistique. Elles ne sont pas copiées telles quelles.
      </p>
      <AdminReferencesForm />
      <AdminReferencesList
        items={customRefs.map((ref) => ({
          id: ref.id,
          domain: ref.domain,
          style: ref.style,
          composition: ref.composition,
          colorPalette: ref.colorPalette,
          mood: ref.mood,
        }))}
      />
      <section className="admin-card p-4">
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
    </div>
  );
}
