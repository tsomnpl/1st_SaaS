import type { Metadata } from "next";
import { legalIdentity } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Données collectées par FlyerMint, finalités, sous-traitants et droits.",
};

export default function PrivacyPage() {
  const identity = legalIdentity();

  return (
    <article className="mx-auto max-w-3xl space-y-8 pb-16">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight">Politique de confidentialité</h1>
        <p className="mt-4 text-slate-600">
          Cette page décrit les traitements mis en œuvre par FlyerMint pour créer un compte, générer une affiche et payer des Mints.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-bold">Responsable du traitement</h2>
        <p className="mt-3 text-slate-700">
          {identity.name
            ? `Le responsable du traitement est ${identity.name}.`
            : "Le responsable du traitement est l’éditeur du service FlyerMint."}
          {identity.email ? ` Contact : ${identity.email}.` : " Pour une demande liée à ton compte, écris depuis l’adresse e-mail enregistrée chez Clerk."}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Données collectées</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
          <li>Compte Clerk : identifiant, adresse e-mail, nom si tu le fournis, état de vérification de l’e-mail.</li>
          <li>Historique de générations : brief, direction artistique, modèle, statut, affiche produite.</li>
          <li>Fichiers que tu envoies pour une affiche : logo et photo ou produit.</li>
          <li>Kit de marque si tu demandes à le mémoriser : couleurs et logo.</li>
          <li>Mints : solde, lots, mouvements du ledger, attributions préparées par un administrateur.</li>
          <li>Paiements Money Fusion : offre, montant, identifiant de commande, statut. Le retour navigateur n’est pas enregistré comme une preuve de paiement.</li>
          <li>Journal d’administration : action, cible, motif. Les clés d’API n’y sont pas écrites.</li>
          <li>Préférence de cookies, stockée dans le navigateur.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Finalités</h2>
        <p className="mt-3 text-slate-700">
          Fournir le compte, composer et générer l’affiche, tenir le ledger de Mints, confirmer un paiement, envoyer les e-mails de paiement, de génération et de support, sécuriser l’accès, prévenir les abus, et permettre à un administrateur autorisé de gérer le service.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Sous-traitants</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
          <li>Clerk : authentification et vérification de l’e-mail.</li>
          <li>Vercel : hébergement de l’application.</li>
          <li>PostgreSQL : base qui stocke le compte, les Mints, les paiements et les générations.</li>
          <li>RodiumAI : génération de l’affiche à partir du brief et, le cas échéant, du logo ou de la photo.</li>
          <li>Money Fusion : initiation et confirmation des paiements.</li>
          <li>Google (Gmail SMTP) : envoi des e-mails transactionnels vers l’adresse du compte.</li>
          <li>Plausible : statistiques de pages, seulement si un domaine analytics est configuré et si tu acceptes ces cookies.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Durées</h2>
        <p className="mt-3 text-slate-700">
          Les données de compte, de génération et de paiement restent dans la base tant que le compte existe. Tu peux demander leur suppression. Les pièces de paiement peuvent être conservées le temps nécessaire à la preuve d’une transaction déjà réalisée.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Droits</h2>
        <p className="mt-3 text-slate-700">
          Tu peux demander l’accès, la rectification ou la suppression des données liées à ton compte.
          {identity.email
            ? ` Écris à ${identity.email} depuis l’adresse du compte, ou depuis une adresse qui permet de t’identifier.`
            : " Envoie la demande depuis l’adresse e-mail du compte Clerk."}
          {" "}Un compte peut aussi être suspendu en cas d’abus.
        </p>
      </section>

      <section id="cookies">
        <h2 className="text-2xl font-bold">Cookies</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
          <li>Cookies nécessaires : session Clerk et fonctionnement du site. Ils ne dépendent pas du bandeau.</li>
          <li>Cookie de préférence : mémorise ton choix dans le navigateur (fm-cookie-consent).</li>
          <li>Statistiques : le script Plausible n’est chargé qu’après acceptation, et seulement si un domaine analytics est configuré.</li>
          <li>FlyerMint ne charge pas d’autre cookie publicitaire.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Transferts</h2>
        <p className="mt-3 text-slate-700">
          Clerk, Vercel, RodiumAI, Money Fusion, Google pour l’envoi des e-mails et, si tu les acceptes, les statistiques peuvent traiter des données en dehors du pays où tu te trouves. Le lieu exact dépend de l’infrastructure de chaque prestataire.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Sécurité</h2>
        <p className="mt-3 text-slate-700">
          L’accès administrateur est vérifié côté serveur. Le solde de Mints n’est modifié que par le ledger. Les secrets d’API ne sont pas envoyés au navigateur. Un paiement n’est crédité qu’une fois, après confirmation serveur.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Mineurs</h2>
        <p className="mt-3 text-slate-700">
          FlyerMint ne s’adresse pas aux mineurs. Si un compte a été ouvert pour un mineur, l’éditeur peut le supprimer sur demande d’un représentant.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Modifications</h2>
        <p className="mt-3 text-slate-700">
          Cette politique peut être mise à jour quand le service change. La page publiée fait foi.
          {identity.law ? ` Droit applicable indiqué par l’éditeur : ${identity.law}.` : ""}
        </p>
      </section>
    </article>
  );
}
