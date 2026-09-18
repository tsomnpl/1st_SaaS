import type { Metadata } from "next";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Conditions d’utilisation"),
  description: "Règles d’utilisation de FlyerMint : compte, Mints, générations et paiements.",
};

export default function TermsPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-3xl pb-16">
      <h1 className="text-4xl font-extrabold tracking-tight">Conditions d’utilisation</h1>
      <p className="mt-4 text-slate-600">
        FlyerMint génère des affiches à partir d’un brief. 1 Mint = 1 affiche. L’export d’une
        affiche déjà générée ne consomme pas de Mint.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Compte</h2>
      <p className="mt-3 text-slate-700">
        L’accès aux fonctions de création, d’historique et de paiement nécessite une connexion
        Clerk. Un compte suspendu ne peut plus générer.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Mints</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>1 Mint offert à l’inscription, sans expiration.</li>
        <li>Pack 2 000 FCFA : 2 Mints, expiration 30 jours.</li>
        <li>Autres packs payants : sans expiration, selon l’offre affichée.</li>
        <li>Les Mints qui expirent le plus tôt sont consommés en premier.</li>
        <li>Le solde n’est jamais modifié depuis le navigateur : uniquement via le ledger serveur.</li>
      </ul>
      <h2 className="mt-10 text-2xl font-bold">Paiements</h2>
      <p className="mt-3 text-slate-700">
        Le retour navigateur après Money Fusion n’est pas une preuve de paiement. Les Mints sont
        crédités uniquement après confirmation webhook, une seule fois par transaction.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Générations et exports</h2>
      <p className="mt-3 text-slate-700">
        Le résultat dépend des modèles image disponibles. En cas d’échec de génération, le Mint
        n’est pas conservé comme consommé : il est remboursé. L’export éditable (HTML + textes)
        n’est disponible que pour les offres qui l’incluent. FlyerMint ne promet pas Figma ou Canva.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Responsabilité</h2>
      <p className="mt-3 text-slate-700">
        Tu restes responsable des textes, logos et images que tu envoies. FlyerMint peut suspendre
        un compte en cas d’abus. Aucune garantie de résultat commercial n’est donnée.
      </p>
    </article>
  );
}
