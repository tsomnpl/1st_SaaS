import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="card p-8">
        <p className="mb-2 text-sm uppercase tracking-wide text-emerald-300">
          Ton directeur artistique IA
        </p>
        <h1 className="text-4xl font-bold leading-tight">
          Cree des affiches pro sans designer, sans prompts complexes.
        </h1>
        <p className="mt-4 max-w-3xl text-white/80">
          Tu decris ton besoin, FlyerMint pose les bonnes questions, construit une direction
          artistique, genere puis controle la qualite.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/create" className="rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-950">
            Creer mon affiche
          </Link>
          <Link href="/pricing" className="rounded border border-white/20 px-4 py-2">
            Voir les offres Mints
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Questionnaire intelligent",
            text: "Questions adaptatives par domaine pour extraire les infos commerciales sans rien inventer.",
          },
          {
            title: "Direction artistique automatique",
            text: "Composition, hierarchie, contraste, palette et CTA optimises pour la conversion.",
          },
          {
            title: "Controle qualite + correction",
            text: "Score interne, detection des faiblesses, regeneration guidee si la qualite est insuffisante.",
          },
          {
            title: "Mints transparents",
            text: "1 Mint = 1 affiche. Ledger complet, expiration geree, historique clair.",
          },
          {
            title: "Differenciateur business",
            text: "Pilotage des couts RODI (objectif 10-20 par affiche) et marge brute estimee en admin.",
          },
          {
            title: "Paiement fiable",
            text: "Money Fusion avec webhook idempotent: jamais de double credit.",
          },
        ].map((item) => (
          <article key={item.title} className="card p-5">
            <h2 className="font-semibold text-emerald-300">{item.title}</h2>
            <p className="mt-2 text-sm text-white/80">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="card p-8">
        <h2 className="text-2xl font-semibold">Comment ca marche</h2>
        <div className="mt-4 grid gap-3 text-white/80 md:grid-cols-5">
          {["Decris", "Reponds", "FlyerMint conçoit", "IA genere", "FlyerMint verifie"].map(
            (step) => (
              <div key={step} className="rounded bg-white/5 p-3 text-center text-sm">
                {step}
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
