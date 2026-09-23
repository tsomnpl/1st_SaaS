import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Aide"),
  description: "Règles FlyerMint : Mints, générations, paiements, références et export.",
};

const ARTICLES = [
  {
    id: "mints",
    title: "Mints",
    body: "1 Mint = 1 génération. Une régénération coûte 1 Mint supplémentaire. L’export ne coûte rien. L’inscription offre 1 Mint.",
  },
  {
    id: "generations",
    title: "Générations",
    body: "Tu réponds à un questionnaire. FlyerMint compose la direction artistique puis rend l’affiche. Si la génération échoue, le ledger rembourse le Mint.",
  },
  {
    id: "paiement",
    title: "Paiement",
    body: "Le retour navigateur ne crédite pas les Mints. Seuls le webhook Money Fusion et la transaction en base confirment le paiement.",
  },
  {
    id: "reference",
    title: "Référence personnelle",
    body: "Les références internes FlyerMint sont disponibles pour tous les plans. La référence personnelle est réservée aux packs 20 000 et 25 000 FCFA, uniquement pour la génération concernée, sans Mint supplémentaire. Sans elle, ces packs fonctionnent comme les autres.",
  },
  {
    id: "export",
    title: "Export",
    body: "Le téléchargement de l’affiche ne consomme pas de Mint. Le pack éditable dépend de l’offre.",
  },
  {
    id: "compte",
    title: "Compte",
    body: "La connexion passe par Clerk. Le solde de Mints se lit dans le tableau de bord et le ledger.",
  },
  {
    id: "support",
    title: "Support",
    body: "Le centre d’aide crée un ticket FM-année-numéro. Tu peux répondre, joindre un fichier et fermer la demande. L’assistant ne modifie ni solde ni paiement.",
  },
];

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const articles = ARTICLES.filter((item) => !query || `${item.title} ${item.body}`.toLowerCase().includes(query));
  return (
    <div className="page-canvas space-y-6">
      <h1 className="text-3xl font-extrabold">Aide</h1>
      <form className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="q">
          Rechercher
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Mints, paiement, export…" className="w-full rounded-full border border-slate-200 px-4 py-2" />
        <button className="btn-primary" type="submit">
          Rechercher
        </button>
      </form>
      {articles.length === 0 ? <p className="text-sm text-slate-500">Aucun article pour cette recherche.</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((item) => (
          <article key={item.id} id={item.id} className="card p-5">
            <h2 className="text-lg font-bold">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
          </article>
        ))}
      </div>
      <Link href="/support" className="text-sm font-semibold text-violet">
        Contacter le support
      </Link>
    </div>
  );
}
