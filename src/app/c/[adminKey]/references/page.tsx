import { INSPIRATION_LIBRARY } from "@/lib/inspiration";
import { loadShowcaseReferenceCatalog } from "@/lib/showcase-references";
import { AdminReferencesForm } from "@/components/admin/admin-references-form";
import { AdminReferencesList } from "@/components/admin/admin-references-list";
import { prisma } from "@/lib/prisma";

export default async function AdminReferencesPage() {
  let customRefs: Array<{
    id: string;
    domain: string;
    style: string | null;
    composition: string | null;
    colorPalette: string | null;
    mood: string | null;
  }> = [];
  try {
    customRefs = await prisma.reference.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  } catch {
    customRefs = [];
  }
  const catalog = loadShowcaseReferenceCatalog();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Références</h1>
      <p className="text-sm text-slate-500">
        Gabarits de style uniquement. Le contenu d’une fiche (titre, prix, marque) n’est jamais réutilisé tel quel.
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
        <h2 className="font-bold">Catalogue showcase ({catalog.length})</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {catalog.map((ref) => (
            <article key={ref.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-semibold">{ref.domaine}</p>
              <p>{ref.style}</p>
              <p className="text-slate-500">{ref.composition}</p>
              <p className="text-xs text-slate-400">
                {ref.palette.join(" · ")} — {ref.ambiance}
              </p>
            </article>
          ))}
        </div>
      </section>
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
