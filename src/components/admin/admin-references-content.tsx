import { prisma } from "@/lib/prisma";
import { INSPIRATION_LIBRARY } from "@/lib/inspiration";
import { loadInspirationCoverage } from "@/lib/inspiration-source";

export async function AdminReferencesContent() {
  const [customRefs, coverage] = await Promise.all([
    prisma.reference.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    loadInspirationCoverage(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Bibliotheque d&apos;inspiration</h1>
      <p className="text-white/80">
        References analysees pour guider composition, palette et hierarchie sans copie directe.
      </p>

      <section className="card p-5">
        <h2 className="text-xl font-semibold text-emerald-300">Bibliotheque locale interne</h2>
        <p className="mt-1 text-sm text-white/65">
          Descriptions de style uniquement. Les images source restent dans le bucket prive,
          jamais servies ici.
        </p>
        <p className="mt-2 text-sm text-[#20C997]">
          {coverage.described} descriptions disponibles
          {coverage.domains.length ? ` · ${coverage.domains.filter((row) => row.described > 0).length} domaines` : ""}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {coverage.domains.map((row) => (
            <p key={row.slug} className="rounded bg-white/5 px-3 py-2 text-sm">
              {row.domaine}: <span className="text-white/70">{row.described}</span>
            </p>
          ))}
        </div>
      </section>

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
