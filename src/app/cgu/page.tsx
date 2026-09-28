import type { Metadata } from "next";
import Link from "next/link";
import { legalIdentity } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Règles du compte FlyerMint, des Mints, des paiements et des affiches générées.",
};

export default function TermsPage() {
  const identity = legalIdentity();

  return (
    <article className="mx-auto max-w-3xl space-y-8 pb-16">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight">Conditions d’utilisation</h1>
        <p className="mt-4 text-slate-600">
          FlyerMint transforme un brief en affiche. Tu réponds à quelques questions, le service compose l’affiche, tu la télécharges.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-bold">Compte</h2>
        <p className="mt-3 text-slate-700">
          La création, l’historique et le paiement demandent une connexion Clerk. Tu es responsable de l’accès à ton compte. Un compte suspendu ne peut plus générer.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Mints</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
          <li>1 Mint = 1 affiche.</li>
          <li>1 Mint offert à l’inscription, sans expiration.</li>
          <li>Le pack à 2 000 FCFA contient 2 Mints sans expiration. Cette offre disparaît 30 jours après le lancement réel.</li>
          <li>Les autres packs payants n’ont pas de date d’expiration, selon l’offre affichée au moment de l’achat.</li>
          <li>L’export d’une affiche déjà générée ne consomme aucun Mint.</li>
          <li>Les Mints qui expirent le plus tôt sont consommés en premier.</li>
          <li>Le solde ne peut pas devenir négatif. Il n’est modifié que par le ledger serveur.</li>
          <li>Si la génération échoue pour une raison technique, le Mint consommé est recrédité automatiquement.</li>
          <li>Les autres remboursements ne sont pas automatiques. Ils sont examinés un par un.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Paiement</h2>
        <p className="mt-3 text-slate-700">
          Les packs sont payés via Money Fusion. Le retour dans le navigateur n’est pas une preuve de paiement. Les Mints sont crédités une seule fois, après confirmation serveur. Un paiement en attente, annulé ou échoué ne crédite rien.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Affiches générées</h2>
        <p className="mt-3 text-slate-700">
          FlyerMint te remet le fichier de l’affiche pour que tu puisses le publier. Cette remise ne constitue pas, à elle seule, une cession de droits plus large. L’éditeur n’a pas encore fixé une licence distincte. La marque, l’interface et le code de FlyerMint restent à l’éditeur.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Contenus envoyés</h2>
        <p className="mt-3 text-slate-700">
          Tu garantis avoir les droits sur les textes, logos, photos et références que tu envoies. Tu ne dois pas imiter la marque d’un tiers ni présenter une affiche d’une façon qui trompe sur l’origine du produit ou de l’événement. Les contenus qui servent à frauder, à usurper une marque ou à nuire peuvent entraîner un refus ou une suspension.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Erreurs possibles</h2>
        <p className="mt-3 text-slate-700">
          Une affiche produite par un modèle peut contenir une erreur de texte, de visage ou de mise en page. Tu relis l’affiche avant de la publier. FlyerMint ne promet pas un résultat commercial.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Disponibilité</h2>
        <p className="mt-3 text-slate-700">
          Le service dépend de l’hébergeur, de Clerk, de RodiumAI et de Money Fusion. Une interruption chez l’un d’eux peut empêcher une connexion, une génération ou un paiement.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Suspension</h2>
        <p className="mt-3 text-slate-700">
          FlyerMint peut suspendre un compte en cas d’abus, de fraude, ou de tentative de modifier les Mints, les paiements ou les API en dehors du service.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Droit applicable et modifications</h2>
        <p className="mt-3 text-slate-700">
          {identity.law ? `Le droit applicable indiqué par l’éditeur est : ${identity.law}. ` : null}
          Les conditions peuvent changer. La version publiée ici s’applique à compter de sa mise en ligne.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Contact</h2>
        <p className="mt-3 text-slate-700">
          {identity.email
            ? `Contact : ${identity.email}.`
            : "Écris depuis l’adresse e-mail du compte Clerk."}
          {" "}La politique de confidentialité est disponible sur la page{" "}
          <Link href="/confidentialite" className="font-semibold text-[#6D28D9]">
            Confidentialité
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
