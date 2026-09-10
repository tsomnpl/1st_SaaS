import Link from "next/link";
import { VisualPoster } from "@/components/landing/visual-poster";

const SHOWCASE = [
  { title: "NIGHT WAVE", subtitle: "Concert live", meta: "Sam. 21h · Plateau", tone: "night" as const, cta: "Prends ta place" },
  { title: "MENU DU SOIR", subtitle: "Burger + boisson", meta: "5 000 FCFA", tone: "warm" as const, cta: "Commander" },
  { title: "NOUVELLE COLLECTION", subtitle: "Lookbook ete", meta: "Edition limitee", tone: "gold" as const, cta: "Decouvrir" },
  { title: "VILLA VUE MER", subtitle: "Cocody", meta: "Visite ce weekend", tone: "clean" as const, cta: "Prendre RDV" },
  { title: "GLOW STUDIO", subtitle: "Soins visage", meta: "-30% cette semaine", tone: "soft" as const, cta: "Reserver" },
  { title: "OPEN DAY", subtitle: "Formation pro", meta: "Places limitees", tone: "fresh" as const, cta: "S'inscrire" },
  { title: "FLASH SALE", subtitle: "Boutique en ligne", meta: "24h seulement", tone: "sport" as const, cta: "Acheter" },
  { title: "YES I DO", subtitle: "Save the date", meta: "12 Decembre", tone: "rose" as const, cta: "RSVP" },
];

const DOMAINS = [
  { title: "Evenementiel", tone: "night" as const },
  { title: "Restauration", tone: "warm" as const },
  { title: "Mode", tone: "gold" as const },
  { title: "Beaute", tone: "soft" as const },
  { title: "Immobilier", tone: "clean" as const },
  { title: "Business", tone: "dark" as const },
  { title: "Technologie", tone: "fresh" as const },
  { title: "Formation", tone: "clean" as const },
  { title: "Sport", tone: "sport" as const },
  { title: "Finance", tone: "dark" as const },
  { title: "Sante", tone: "fresh" as const },
  { title: "Tourisme", tone: "gold" as const },
  { title: "E-commerce", tone: "sport" as const },
  { title: "Mariage", tone: "rose" as const },
  { title: "Anniversaire", tone: "warm" as const },
  { title: "Emploi", tone: "clean" as const },
  { title: "Agriculture", tone: "earth" as const },
  { title: "Automobile", tone: "dark" as const },
  { title: "Musique", tone: "night" as const },
  { title: "Associations", tone: "fresh" as const },
  { title: "Culture", tone: "gold" as const },
  { title: "Services", tone: "clean" as const },
];

const PLANS = [
  { price: "2 000", mints: 2, note: "Valables 30 jours" },
  { price: "5 000", mints: 2, note: "Sans expiration" },
  { price: "10 000", mints: 5, note: "Sans expiration" },
  { price: "15 000", mints: 10, note: "Sans expiration" },
  { price: "20 000", mints: 15, note: "Sans expiration · export avance" },
  { price: "25 000", mints: 20, note: "Sans expiration · export avance" },
];

export default function Home() {
  return (
    <div className="space-y-20 pb-4">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 px-5 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.28)] md:px-10 md:py-14">
        <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-[#20C997]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-[#DFFAF0]/10 blur-3xl" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#DFFAF0]">
              Assistant de direction artistique
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] text-white md:text-6xl">
              Ton idee. Notre regard. Une affiche qui se remarque.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
              Tu decris ce que tu veux communiquer. FlyerMint pose les bonnes questions, compose
              le visuel et te rend une affiche professionnelle — sans designer, sans prompt.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/create"
                className="rounded-full bg-[#20C997] px-5 py-3 font-semibold text-[#111827] shadow-[0_0_30px_rgba(32,201,151,0.28)] transition hover:brightness-110"
              >
                Creer une affiche
              </Link>
              <Link
                href="/#creations"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-white/90 backdrop-blur transition hover:border-[#20C997]/50"
              >
                Voir les creations
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">1 Mint = 1 affiche</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Export inclus</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">1 Mint offert a l&apos;inscription</span>
            </div>
          </div>

          <div className="relative mx-auto h-[420px] w-full max-w-[420px]">
            <VisualPoster
              title="FESTIVAL LIVE"
              subtitle="Une nuit, une scene"
              meta="Samedi 21h · Zone 4"
              cta="Prends ta place"
              tone="night"
              className="absolute left-8 top-0 z-20 w-[58%] rotate-[-7deg] animate-float"
            />
            <VisualPoster
              title="BEAUTY WEEK"
              subtitle="-30% soins"
              meta="Cette semaine seulement"
              cta="Reserver"
              tone="soft"
              className="absolute right-0 top-10 z-10 w-[46%] rotate-[9deg] animate-float-delayed"
            />
            <VisualPoster
              title="OPEN CLASS"
              subtitle="Places limitees"
              meta="Formation intensive"
              cta="S'inscrire"
              tone="fresh"
              className="absolute bottom-2 left-0 z-30 w-[44%] rotate-[-4deg]"
            />
            <div className="absolute bottom-8 right-2 z-40 rounded-2xl border border-white/15 bg-[#111827]/80 px-3 py-2 text-xs text-white/80 backdrop-blur-xl">
              Mint restants
              <p className="text-lg font-semibold text-[#20C997]">1 affiche</p>
            </div>
          </div>
        </div>
      </section>

      <section id="creations" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#20C997]">Showcase</p>
            <h2 className="mt-2 text-3xl font-semibold">Des affiches, pas des cartes vides.</h2>
          </div>
          <p className="max-w-sm text-sm text-white/65">
            Event, resto, mode, immobilier, formation… le visuel s&apos;adapte a ton univers.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SHOWCASE.map((poster) => (
            <VisualPoster key={poster.title} {...poster} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#20C997]">Avant / Apres</p>
          <h3 className="mt-2 text-2xl font-semibold">D&apos;un message brut a un visuel qui vend</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
              <p className="text-[11px] uppercase tracking-wide text-white/45">Avant</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Promo ce weekend, burger + boisson, 5000 FCFA, appelle ce numero.
              </p>
            </div>
            <VisualPoster
              title="MENU DU SOIR"
              subtitle="Burger + boisson"
              meta="5 000 FCFA"
              cta="Appeler"
              tone="warm"
              className="min-h-[220px]"
            />
          </div>
        </article>
        <article className="rounded-[1.6rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#20C997]">Questionnaire</p>
          <h3 className="mt-2 text-2xl font-semibold">Tu reponds. On compose.</h3>
          <div className="mt-6 space-y-3">
            {[
              "Quel est ton domaine ?",
              "Que veux-tu que les gens fassent ?",
              "Quel est le message principal ?",
              "As-tu un style, des couleurs, une photo ?",
              "Quel format : story, post, affiche ?",
            ].map((question, index) => (
              <div
                key={question}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111827]/50 px-4 py-3 text-sm text-white/80"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#20C997]/15 text-xs text-[#20C997]">
                  {index + 1}
                </span>
                {question}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section id="comment-ca-marche" className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 md:p-10">
        <h2 className="text-3xl font-semibold">Comment ca marche</h2>
        <p className="mt-2 max-w-2xl text-white/70">
          Un parcours simple, du besoin au visuel pret a publier.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { step: "01", title: "Decris", text: "Ton offre, ton evenement, ton message." },
            { step: "02", title: "Reponds", text: "Quelques questions claires, sans jargon." },
            { step: "03", title: "On compose", text: "Hierarchie, couleurs, mise en page." },
            { step: "04", title: "On genere", text: "Une affiche professionnelle, lisible." },
            { step: "05", title: "Tu publies", text: "Telecharge et lance ta campagne." },
          ].map((item) => (
            <article key={item.step} className="rounded-2xl border border-white/10 bg-[#111827]/40 p-4">
              <p className="text-xs text-[#20C997]">{item.step}</p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-white/65">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#20C997]">Direction artistique</p>
          <h2 className="mt-2 text-3xl font-semibold">Un regard de studio, pas un generateur brut</h2>
          <p className="mt-2 max-w-2xl text-white/70">
            Titre fort, prix lisible, appel a l&apos;action visible, respiration autour des infos importantes.
            Le visuel sert ton message — il ne l&apos;etouffe pas.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Hiérarchie claire", text: "L'oeil va d'abord au titre, puis a l'offre, puis a l'action." },
            { title: "Lisibilite d'abord", text: "Contraste, marges et typo penses pour etre lus en 2 secondes." },
            { title: "Ton image, si tu en as une", text: "Produit, logo, photo : on construit autour, on ne la remplace pas." },
          ].map((item) => (
            <article key={item.title} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-white/70">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Tous les univers, un meme niveau d&apos;exigence</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {DOMAINS.map((domain) => (
            <VisualPoster
              key={domain.title}
              title={domain.title}
              subtitle="Affiche pro"
              cta="Creer"
              tone={domain.tone}
              className="min-h-[180px]"
            />
          ))}
        </div>
      </section>

      <section id="tarifs" className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#20C997]">Tarifs</p>
            <h2 className="mt-2 text-3xl font-semibold">1 Mint = 1 affiche</h2>
            <p className="mt-2 text-white/70">L&apos;export ne consomme aucun Mint.</p>
          </div>
          <Link href="/pricing" className="rounded-full bg-[#20C997] px-4 py-2 font-semibold text-[#111827]">
            Choisir une offre
          </Link>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article key={plan.price} className="rounded-2xl border border-white/10 bg-[#111827]/50 p-5">
              <p className="text-2xl font-semibold text-white">{plan.price} FCFA</p>
              <p className="mt-1 text-[#20C997]">{plan.mints} Mints</p>
              <p className="mt-2 text-sm text-white/65">{plan.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-white/5 to-[#20C997]/10 p-8 text-center md:p-12">
        <h2 className="text-3xl font-semibold md:text-4xl">Pret a lancer ta prochaine affiche ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/70">
          Simple, rapide, premium. Tu n&apos;as pas besoin de savoir designer.
        </p>
        <Link
          href="/create"
          className="mt-6 inline-flex rounded-full bg-[#20C997] px-6 py-3 font-semibold text-[#111827]"
        >
          Creer une affiche
        </Link>
      </section>

      <footer className="border-t border-white/10 pt-6 text-sm text-white/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>FlyerMint — affiches professionnelles, direction artistique incluse.</p>
          <div className="flex gap-4">
            <Link href="/#creations" className="hover:text-[#20C997]">Creations</Link>
            <Link href="/pricing" className="hover:text-[#20C997]">Tarifs</Link>
            <Link href="/create" className="hover:text-[#20C997]">Creer</Link>
            <Link href="/sign-in" className="hover:text-[#20C997]">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
