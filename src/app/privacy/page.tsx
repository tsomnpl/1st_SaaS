import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { LegalNav } from "@/components/legal/legal-nav";

export const metadata: Metadata = {
  title: pageTitle("Confidentialité"),
  description: "Comment FlyerMint traite les données réellement collectées par le service.",
  openGraph: { title: "Confidentialité — FlyerMint" },
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-3xl pb-16">
      <h1 className="text-4xl font-extrabold tracking-tight">Confidentialité</h1>
      <p className="mt-4 text-slate-600">
        Cette page décrit uniquement les traitements réellement mis en œuvre par FlyerMint.
        Aucune durée de conservation légale n’est inventée : les données restent tant que le
        compte et la base configurée sur l’hébergeur existent.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Données collectées</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Identité de connexion Clerk (identifiant, e-mail, nom si fourni).</li>
        <li>Briefs de génération, visuels générés, modèle utilisé et statut.</li>
        <li>Soldes et mouvements de Mints (ledger, lots, expiration).</li>
        <li>Paiements Money Fusion : montant, offre, orderId, token, statut, payload webhook (sans secrets).</li>
        <li>Logs d’actions administrateur (action, cible, motif, résultat — jamais de clés).</li>
        <li>Préférence de cookies stockée localement dans le navigateur.</li>
      </ul>
      <h2 className="mt-10 text-2xl font-bold">Finalités</h2>
      <p className="mt-3 text-slate-700">
        Fournir le compte, la génération, les Mints et le paiement ; sécuriser l’accès ;
        prévenir les abus ; permettre à l’administrateur autorisé de gérer le service.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Authentification et paiements</h2>
      <p className="mt-3 text-slate-700">
        L’authentification est déléguée à Clerk. Les paiements sont initiés vers Money Fusion.
        Le retour navigateur n’est pas une preuve de paiement : le crédit des Mints dépend
        d’une confirmation serveur (webhook) et d’une idempotence par transaction.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Générations</h2>
      <p className="mt-3 text-slate-700">
        Le brief et, le cas échéant, une image ou un logo fournis sont envoyés à RodiumAI
        pour produire l’affiche. Les contenus privés de génération ne sont pas envoyés à
        l’outil d’analytics.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Services tiers</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Clerk : authentification.</li>
        <li>RodiumAI : génération d’images.</li>
        <li>Money Fusion : initiation et confirmation des paiements.</li>
        <li>Hébergeur (Vercel) et PostgreSQL : exécution et stockage.</li>
        <li>Plausible : statistiques de pages, uniquement si un domaine est configuré et si tu acceptes les cookies analytics.</li>
      </ul>
      <h2 className="mt-10 text-2xl font-bold">Cookies</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Nécessaires : session Clerk et fonctionnement du site.</li>
        <li>Analytics : chargés seulement après consentement, et seulement si un domaine analytics est configuré.</li>
        <li>Aucun autre cookie marketing n’est chargé par FlyerMint.</li>
      </ul>
      <p className="mt-3 text-slate-700">
        Le détail et la modification du choix sont dans la{" "}
        <Link href="/cookies" className="font-semibold text-[#20C997] underline-offset-2 hover:underline">
          politique de cookies
        </Link>
        .
      </p>
      <h2 className="mt-10 text-2xl font-bold">Tes droits</h2>
      <p className="mt-3 text-slate-700">
        Tu peux demander l’accès, la rectification ou la suppression des données liées à ton
        compte depuis l’adresse e-mail associée à ce compte. L’administrateur peut suspendre
        un compte en cas d’abus. Aucun canal e-mail public supplémentaire n’est inventé ici.
      </p>
      <LegalNav current="/privacy" />
    </article>
  );
}
