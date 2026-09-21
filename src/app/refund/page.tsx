import type { Metadata } from "next";
import { pageTitle } from "@/lib/seo";
import { LegalNav } from "@/components/legal/legal-nav";

export const metadata: Metadata = {
  title: pageTitle("Politique de remboursement"),
  description: "Quand un paiement FlyerMint est crédité, annulé, échoué, et comment un Mint est remboursé.",
  openGraph: { title: "Politique de remboursement — FlyerMint" },
};

export default function RefundPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-3xl pb-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-[#111827]">Politique de remboursement</h1>
      <p className="mt-4 text-slate-600">
        Dernière mise à jour : 21 septembre 2026. Cette page décrit le fonctionnement réel des
        paiements et des Mints, sans inventer de délai légal ni d’adresse de contact fictive.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Principe</h2>
      <p className="mt-3 text-slate-700">
        Un pack de Mints est un crédit d’usage : 1 Mint = 1 affiche générée. L’export d’une
        affiche déjà générée est gratuit et ne consomme pas de Mint. Une nouvelle génération,
        y compris une régénération, consomme 1 Mint.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Quand les Mints sont crédités</h2>
      <p className="mt-3 text-slate-700">
        Les Mints d’un pack payant sont attribués uniquement après confirmation serveur auprès
        de Money Fusion (webhook et/ou vérification du statut). Arriver sur la page de retour
        navigateur n’est pas une preuve de paiement et ne crédite rien à elle seule.
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Paiement en attente : aucun Mint n’est ajouté.</li>
        <li>Paiement réussi et confirmé : les Mints du pack sont ajoutés une seule fois.</li>
        <li>Paiement échoué ou refusé : aucun Mint, aucune consommation.</li>
        <li>Paiement annulé : aucun Mint, aucune consommation.</li>
        <li>Notification webhook en double : le crédit n’est pas dupliqué.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-bold">Packs</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>2 000 FCFA : 2 Mints, valables 30 jours.</li>
        <li>5 000 FCFA : 2 Mints, sans expiration.</li>
        <li>10 000 FCFA : 5 Mints, sans expiration.</li>
        <li>15 000 FCFA : 10 Mints, sans expiration.</li>
        <li>20 000 FCFA : 15 Mints + export éditable, sans expiration.</li>
        <li>25 000 FCFA : 20 Mints + export éditable, sans expiration.</li>
      </ul>
      <p className="mt-3 text-slate-700">
        Les Mints qui expirent le plus tôt sont consommés en premier. Un Mint offert à
        l’inscription n’expire pas.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Remboursement d’un Mint</h2>
      <p className="mt-3 text-slate-700">
        Si une génération échoue côté serveur (indisponibilité du modèle, image invalide, ou
        affiche rejetée par le contrôle qualité), le Mint consommé est recrédité automatiquement
        sur le compte. Tu n’as pas à envoyer de justificatif pour ce cas.
      </p>
      <p className="mt-3 text-slate-700">
        Une affiche générée avec succès, même si le rendu ne te plaît pas, a consommé 1 Mint.
        Tu peux relancer une génération : cela consomme un nouveau Mint.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Remboursement d’un paiement en FCFA</h2>
      <p className="mt-3 text-slate-700">
        Un pack confirmé et crédité n’est pas remboursé automatiquement en argent. En cas de
        double prélèvement, de paiement confirmé sans crédit de Mints, ou d’erreur manifeste,
        contacte FlyerMint depuis l’adresse e-mail associée à ton compte. L’administrateur peut
        vérifier le paiement, le webhook et le ledger, puis ajuster les Mints si le crédit
        manque.
      </p>
      <p className="mt-3 text-slate-700">
        FlyerMint ne promet pas un délai de remboursement bancaire : le retour des fonds, s’il
        a lieu, dépend de Money Fusion et de l’opérateur mobile ou bancaire utilisé.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Annulation avant confirmation</h2>
      <p className="mt-3 text-slate-700">
        Si tu quittes Money Fusion sans payer, ou si le paiement est annulé, aucun Mint n’est
        crédité. Tu peux relancer un achat depuis la page Tarifs.
      </p>
      <LegalNav current="/refund" />
    </article>
  );
}
