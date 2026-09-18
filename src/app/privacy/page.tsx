import type { Metadata } from "next";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Confidentialité"),
  description: "Comment FlyerMint traite les données réellement collectées par le service.",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-3xl pb-16">
      <h1 className="text-4xl font-extrabold tracking-tight">Confidentialité</h1>
      <p className="mt-4 text-slate-600">
        Cette page décrit uniquement les traitements réellement mis en œuvre par FlyerMint.
        Les durées de conservation dépendent de ton compte et de la base de données configurée
        sur l’hébergeur ; aucune durée légale inventée n’est affichée ici.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Données collectées</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Identité de connexion Clerk (identifiant, e-mail, nom si fourni).</li>
        <li>Briefs de génération, visuels générés, et métadonnées techniques (modèle, statut).</li>
        <li>Soldes et mouvements de Mints (ledger).</li>
        <li>Paiements Money Fusion : montant, offre, orderId, token, statut, payload webhook.</li>
        <li>Logs d’actions administrateur (sans secrets).</li>
      </ul>
      <h2 className="mt-10 text-2xl font-bold">Finalités</h2>
      <p className="mt-3 text-slate-700">
        Fournir le service (compte, génération, Mints, paiement), sécuriser l’accès, prévenir les
        abus, et permettre à l’administrateur de gérer le SaaS.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Services tiers</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Clerk : authentification.</li>
        <li>RodiumAI : génération d’images à partir du brief.</li>
        <li>Money Fusion : initiation et confirmation des paiements.</li>
        <li>Hébergeur (Vercel) et base PostgreSQL : exécution et stockage.</li>
      </ul>
      <h2 className="mt-10 text-2xl font-bold">Cookies</h2>
      <p className="mt-3 text-slate-700">
        Les cookies strictement nécessaires servent à la session Clerk et au fonctionnement du
        site. Un outil d’analytics n’est chargé que si tu l’acceptes via la bannière et si un
        domaine d’analytics est configuré.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Tes droits</h2>
      <p className="mt-3 text-slate-700">
        Tu peux demander l’accès, la rectification ou la suppression de ton compte via le support
        du site. L’administrateur peut suspendre un compte en cas d’abus.
      </p>
    </article>
  );
}
