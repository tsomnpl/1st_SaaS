import type { Metadata } from "next";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Conditions d’utilisation"),
  description: "Règles d’utilisation de FlyerMint : compte, Mints, générations et paiements.",
  openGraph: { title: "Conditions d’utilisation — FlyerMint" },
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
        La création, l’historique et le paiement nécessitent une connexion Clerk. Un compte
        suspendu ne peut plus générer. Tu es responsable des identifiants de ton compte.
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
        Le retour navigateur après Money Fusion n’est pas une preuve de paiement. Les Mints
        sont crédités uniquement après confirmation serveur, une seule fois par transaction.
        Un paiement en attente, annulé ou échoué ne crédite rien.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Générations et exports</h2>
      <p className="mt-3 text-slate-700">
        Le résultat dépend des modèles image disponibles chez RodiumAI. En cas d’échec, le
        Mint n’est pas conservé comme consommé : il est remboursé. L’export éditable (HTML +
        textes) n’est disponible que pour les offres qui l’incluent. FlyerMint ne promet pas
        Figma, Canva, ni un résultat commercial.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Contenu utilisateur</h2>
      <p className="mt-3 text-slate-700">
        Tu restes responsable des textes, logos et images envoyés. Tu garantis disposer des
        droits nécessaires. FlyerMint peut refuser ou suspendre un usage abusif.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Propriété intellectuelle</h2>
      <p className="mt-3 text-slate-700">
        La marque, l’interface et le code FlyerMint restent la propriété de l’éditeur.
        Les visuels générés te sont livrés pour ton usage, dans les limites des modèles et
        contenus que tu as fournis. Aucune cession de droits plus large n’est inventée ici.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Suspension et limitations</h2>
      <p className="mt-3 text-slate-700">
        Le service peut être limité par les quotas, la disponibilité de RodiumAI, Money Fusion
        ou de l’hébergeur. FlyerMint peut suspendre un compte en cas d’abus, de fraude ou de
        tentative de manipulation des Mints, des paiements ou des API.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Responsabilité</h2>
      <p className="mt-3 text-slate-700">
        Aucune garantie de résultat commercial, de disponibilité continue ou de qualité
        artistique n’est donnée. Le service est fourni en l’état, selon les fonctionnalités
        réellement implémentées.
      </p>
    </article>
  );
}
