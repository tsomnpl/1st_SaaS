import { prisma } from "@/lib/prisma";
import { INSPIRATION_LIBRARY } from "@/lib/inspiration";

export async function AdminReferencesContent() {
  const customRefs = await prisma.reference.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Bibliotheque d&apos;inspiration</h1>
      <p className="text-white/80">
        References analysees pour guider composition, palette et hierarchie sans copie directe.
      </p>

      <section className="card p-5">
        <h2 className="text-xl font-semibold text-emerald-300">Base integree (seed inspiration)</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {INSPIRATION_LIBRARY.map((ref) => (
            <article key={ref.id} className="rounded bg-white/5 p-3 text-sm">
              <p className="font-semibold">{ref.id}</p>
              <p className="text-white/70">{ref.domain} - {ref.style}</p>
              <p className="mt-1">{ref.composition}</p>
              <p className="text-white/70">Tags: {ref.tags.join(", ")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-semibold text-emerald-300">References admin (BDD)</h2>
        <div className="mt-3 space-y-2 text-sm">
          {customRefs.length === 0 && <p className="text-white/70">Aucune reference admin en base.</p>}
          {customRefs.map((ref) => (
            <article key={ref.id} className="rounded bg-white/5 p-3">
              <p className="font-semibold">{ref.domain} - {ref.style ?? "style n/a"}</p>
              <p className="text-white/70">Composition: {ref.composition ?? "n/a"} | Mood: {ref.mood ?? "n/a"}</p>
              <p className="text-white/70">Tags: {ref.tags.join(", ") || "n/a"}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
