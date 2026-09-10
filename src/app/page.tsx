import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="card relative overflow-hidden p-8 md:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
        <p className="mb-2 text-sm uppercase tracking-wide text-emerald-300">
          Ton directeur artistique IA
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          Ton idee. Notre direction artistique. Une affiche professionnelle.
        </h1>
        <p className="mt-4 max-w-2xl text-white/80">
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
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Questionnaire adaptatif",
            "Controle qualite intelligent",
            "1 Mint = 1 affiche",
          ].map((v) => (
            <div key={v} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              {v}
            </div>
          ))}
        </div>
      </section>

      <section id="creations" className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Showcase des affiches</h2>
          <p className="text-sm text-white/70">Evenementiel, restauration, mode, immobilier, formation...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            "Concert Night / Event",
            "Menu Burger Promo",
            "Formation Pro 2026",
            "Appartement a vendre",
            "Beauty Care Week",
            "Auto Sale Weekend",
            "E-commerce Flash",
            "Wedding Invitation",
          ].map((item, index) => (
            <article
              key={item}
              className={`card min-h-44 p-4 transition hover:-translate-y-1 hover:border-emerald-300/40 ${
                index % 3 === 0 ? "bg-gradient-to-br from-emerald-500/10 to-cyan-400/10" : ""
              }`}
            >
              <div className="mb-3 h-20 rounded bg-white/10" />
              <p className="text-sm font-medium text-white/90">{item}</p>
            </article>
          ))}
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
          {
            title: "Bibliotheque d'inspiration",
            text: "Selection de references par domaine pour guider composition et style sans copie.",
          },
          {
            title: "Export premium evolutif",
            text: "Base prete pour export editable via format intermediaire reconstructible.",
          },
        ].map((item) => (
          <article key={item.title} className="card p-5">
            <h2 className="font-semibold text-emerald-300">{item.title}</h2>
            <p className="mt-2 text-sm text-white/80">{item.text}</p>
          </article>
        ))}
      </section>

      <section id="comment-ca-marche" className="card p-8">
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

      <section className="card p-8 text-center">
        <h2 className="text-2xl font-semibold">Pret a lancer ta prochaine affiche ?</h2>
        <p className="mt-2 text-white/75">Simple, rapide, premium. Sans competence design requise.</p>
        <div className="mt-5">
          <Link href="/create" className="rounded bg-emerald-500 px-5 py-2 font-semibold text-slate-950">
            Creer une affiche
          </Link>
        </div>
      </section>
    </div>
  );
}
