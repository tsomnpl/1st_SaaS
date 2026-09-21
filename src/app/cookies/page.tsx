import type { Metadata } from "next";
import { pageTitle } from "@/lib/seo";
import { LegalNav } from "@/components/legal/legal-nav";

export const metadata: Metadata = {
  title: pageTitle("Politique de cookies"),
  description: "Cookies utilisés par FlyerMint : nécessaires, optionnels, et comment modifier ton choix.",
  openGraph: { title: "Politique de cookies — FlyerMint" },
};

export default function CookiesPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-3xl pb-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-[#111827]">Politique de cookies</h1>
      <p className="mt-4 text-slate-600">
        Dernière mise à jour : 21 septembre 2026. Cette page décrit uniquement les cookies et
        stockages réellement utilisés par FlyerMint.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Comment FlyerMint utilise les cookies</h2>
      <p className="mt-3 text-slate-700">
        FlyerMint distingue les cookies strictement nécessaires au fonctionnement du service et
        les statistiques optionnelles. Aucun cookie publicitaire, aucun pixel de retargeting et
        aucun réseau social n’est chargé par FlyerMint.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Cookies nécessaires</h2>
      <p className="mt-3 text-slate-700">
        Ils sont indispensables pour te connecter, protéger la session et afficher le site. Ils
        ne nécessitent pas de consentement. Ils sont déposés par :
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Clerk, pour l’authentification (session, protection CSRF, éventuel CAPTCHA).</li>
        <li>L’hébergeur, pour le routage et la sécurité de la connexion.</li>
      </ul>
      <p className="mt-3 text-slate-700">
        Sans ces cookies, la connexion, la création d’affiche et le paiement ne peuvent pas
        fonctionner.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Statistiques optionnelles</h2>
      <p className="mt-3 text-slate-700">
        Si un domaine de mesure d’audience (Plausible) est configuré, FlyerMint peut compter les
        pages vues. Ce script n’est chargé que si tu cliques sur « Accepter les statistiques ».
        Tant que tu n’as pas accepté, rien n’est envoyé à Plausible. Les contenus de génération,
        les e-mails et les paiements ne sont pas transmis à cet outil.
      </p>
      <p className="mt-3 text-slate-700">
        Le choix (nécessaires seulement, ou statistiques acceptées) est enregistré dans le
        navigateur (`localStorage`), pas sur nos serveurs. Il reste jusqu’à ce que tu le
        modifies ou que tu vides les données du site.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Ton choix</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Tu peux accepter les statistiques, ou les refuser en gardant uniquement le nécessaire.</li>
        <li>Tu peux modifier ce choix à tout moment via « Gérer les cookies » dans le pied de page.</li>
        <li>Refuser les statistiques n’empêche pas d’utiliser FlyerMint.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-bold">Ce que FlyerMint ne fait pas</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Pas de publicité ciblée.</li>
        <li>Pas de cookies marketing déposés par FlyerMint.</li>
        <li>Pas de revente de données de navigation.</li>
      </ul>

      <p className="mt-6 text-slate-700">
        Le traitement des données personnelles (compte, générations, paiements) est décrit dans
        la politique de confidentialité.
      </p>
      <LegalNav current="/cookies" />
    </article>
  );
}
