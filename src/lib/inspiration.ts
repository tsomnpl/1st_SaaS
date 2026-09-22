import { CreateBriefInput } from "@/lib/flyermint";
import { DOMAINS } from "@/lib/domains";
import { exemplarForDomain } from "@/lib/approved-exemplars";

export type InspirationReference = {
  id: string;
  domain: string;
  style: string;
  composition: string;
  colorPalette: string;
  typography: string;
  imageTreatment: string;
  layout: string;
  density: string;
  mood: string;
  tags: string[];
};

/** Principes extraits des references (LPT + catalogue), jamais a copier tel quel. */
export const DESIGN_LAWS = [
  "Hierarchie: un seul heros visuel, puis titre, puis offre, puis CTA.",
  "Contraste: texte lisible sur le fond, jamais gris pale sur image chargee.",
  "Alignement: une grille claire, bords et colonnes constants.",
  "Proximite: regrouper date/lieu/prix, separer du titre.",
  "Repetition: 1 accent de couleur, 1 rythme de marges.",
  "Equilibre: ne pas saturer les coins, laisser une safe zone.",
  "Espace blanc: respirer autour du titre et du CTA.",
  "Typo: 2 familles max, chiffres de prix plus forts que le body.",
  "CTA: bouton ou bande contraste, verbe d'action, visible en 2 secondes.",
  "Ne jamais reproduire une affiche de reference: composer un original.",
];

const DOMAIN_PLAYBOOK: Record<(typeof DOMAINS)[number], Omit<InspirationReference, "id" | "domain">> = {
  Evenementiel: {
    style: "energetique",
    composition: "visuel scene/artiste en heros, infos date-heure-lieu en bloc compact",
    colorPalette: "fond sombre + 1 accent vif",
    typography: "titre condensed bold + infos sans lisible",
    imageTreatment: "contraste fort, lumiere spot, visages nets si presents",
    layout: "heros haut / infos bas ou bande laterale",
    density: "medium",
    mood: "anticipation",
    tags: ["date", "lieu", "cta", "night"],
  },
  Restauration: {
    style: "appetissant",
    composition: "plat ou produit en gros plan, prix tres lisible, horaires discrets",
    colorPalette: "tons chauds + fond neutre",
    typography: "titre friendly, prix en gros chiffres",
    imageTreatment: "close-up nourriture, vapeur/texture, pas de fond fume",
    layout: "image dominante, texte court, CTA commander/reserver",
    density: "low",
    mood: "chaleureux",
    tags: ["prix", "menu", "promo"],
  },
  "Mode & Accessoires": {
    style: "editorial",
    composition: "un seul sujet/look, beaucoup d'air, texte minimal",
    colorPalette: "neutres + 1 accent luxe",
    typography: "titre editorial, body leger",
    imageTreatment: "studio propre, silhouette nette",
    layout: "grand negatif, marque petite, collection en titre",
    density: "low",
    mood: "elegant",
    tags: ["collection", "brand"],
  },
  "Beaute & Soins": {
    style: "doux",
    composition: "visage ou produit heros, benefice court, offre en bandeau",
    colorPalette: "pastels maitrises + blanc",
    typography: "sans leger, offre en gras",
    imageTreatment: "peau naturelle, lumiere douce, pas de filtres extremes",
    layout: "portrait + bloc offre",
    density: "low",
    mood: "soin",
    tags: ["promo", "rdv"],
  },
  Immobilier: {
    style: "confiance",
    composition: "bien en facade claire, specs en pastilles, prix et contact visibles",
    colorPalette: "bleu/gris confiance + accent",
    typography: "geometrique, chiffres de surface/prix forts",
    imageTreatment: "architecture corrige, ciel propre",
    layout: "photo large + cartes infos",
    density: "medium",
    mood: "serieux",
    tags: ["prix", "localisation", "visite"],
  },
  "Business & Entreprise": {
    style: "corporate clair",
    composition: "promesse en titre, 3 piliers max, CTA contact",
    colorPalette: "sombre maitrise + mint/blanc",
    typography: "sans net, hierarchie stricte",
    imageTreatment: "photo equipe/produit nette ou motif geometrique",
    layout: "titre + 3 points + bande CTA",
    density: "medium",
    mood: "pro",
    tags: ["cta", "offre"],
  },
  Technologie: {
    style: "net",
    composition: "produit ou interface heros, benefice unique, CTA essai",
    colorPalette: "dark + accent froid",
    typography: "sans moderne, peu de texte",
    imageTreatment: "objet net, reflets discrets",
    layout: "produit centre, texte a gauche ou bas",
    density: "low",
    mood: "innovant",
    tags: ["produit", "cta"],
  },
  "Education & Formation": {
    style: "motivant",
    composition: "promesse de resultat, formateur ou preuve, date et inscription",
    colorPalette: "bleu academique + accent",
    typography: "lisible, bullets courts",
    imageTreatment: "portrait naturel si formateur fourni",
    layout: "titre + benefices + bande inscription",
    density: "medium",
    mood: "ambition",
    tags: ["inscription", "date", "certificat"],
  },
  Sport: {
    style: "dynamique",
    composition: "action nette, offre/abonnement, CTA rejoindre",
    colorPalette: "contraste fort, 1 couleur club",
    typography: "titre impact, infos compactes",
    imageTreatment: "mouvement, sujet net, fond sombre ou piste",
    layout: "diagonale d'energie, CTA bas",
    density: "medium",
    mood: "puissant",
    tags: ["cta", "date"],
  },
  "Finance & Fintech": {
    style: "fiable",
    composition: "promesse claire, preuve/chiffre, CTA sobre",
    colorPalette: "navy + blanc, accent limite",
    typography: "sans serieux, chiffres precis",
    imageTreatment: "peu d'effet, icones discretes",
    layout: "titre + preuve + CTA",
    density: "low",
    mood: "confiance",
    tags: ["chiffre", "cta"],
  },
  "Sante & Clinique": {
    style: "rassurant",
    composition: "service lisible, horaires/contact, photo calme",
    colorPalette: "blanc/vert doux, contraste texte fort",
    typography: "sans clair, infos pratiques grandes",
    imageTreatment: "lumiere naturelle, personnes reelles si fournies",
    layout: "titre + service + contact",
    density: "low",
    mood: "serenite",
    tags: ["rdv", "telephone"],
  },
  "Tourisme & Voyage": {
    style: "evasion",
    composition: "destination heros, dates/prix, CTA reserver",
    colorPalette: "ciel/sable ou nuit ville + accent",
    typography: "titre evocation, prix lisible",
    imageTreatment: "paysage large, horizon propre",
    layout: "image full bleed + bande bas",
    density: "low",
    mood: "envie",
    tags: ["prix", "date"],
  },
  "E-commerce": {
    style: "promo nette",
    composition: "produit heros, reduction, urgence courte, CTA acheter",
    colorPalette: "fond simple + badge offre",
    typography: "prix ancien/nouveau tres lisibles",
    imageTreatment: "packshot net, ombre douce",
    layout: "produit + badge + CTA",
    density: "medium",
    mood: "urgence",
    tags: ["prix", "promo", "cta"],
  },
  Mariage: {
    style: "poetique",
    composition: "noms + date + lieu, ornement leger, beaucoup d'air",
    colorPalette: "creme/blush + un metal doux",
    typography: "script ou serif pour noms, sans pour infos",
    imageTreatment: "photo couple si fournie, sinon motif floral discret",
    layout: "centre ceremonial",
    density: "low",
    mood: "intime",
    tags: ["date", "lieu", "rsvp"],
  },
  Anniversaire: {
    style: "festif",
    composition: "qui / quel age, date lieu, RSVP",
    colorPalette: "vive mais limitee a 2-3 teintes",
    typography: "titre joyeux, infos claires",
    imageTreatment: "photo honoree si fournie",
    layout: "photo + carton infos",
    density: "medium",
    mood: "celebration",
    tags: ["date", "lieu"],
  },
  "Emploi & Recrutement": {
    style: "direct",
    composition: "poste en titre, 3 criteres, CTA postuler",
    colorPalette: "fond sobre + accent",
    typography: "sans, hierarchie offre d'emploi",
    imageTreatment: "equipe/lieu de travail si fourni",
    layout: "titre poste + bullets + CTA",
    density: "medium",
    mood: "opportunite",
    tags: ["cta", "poste"],
  },
  Agriculture: {
    style: "terroir",
    composition: "produit/recolte heros, origine, prix/contact",
    colorPalette: "verts/terre, contraste texte fort",
    typography: "sans robuste",
    imageTreatment: "texture naturelle, lumiere jour",
    layout: "image + infos marche",
    density: "medium",
    mood: "authentique",
    tags: ["produit", "prix"],
  },
  Automobile: {
    style: "performance",
    composition: "vehicule 3/4, modele/annee, offre financement, CTA essai",
    colorPalette: "sombre metallise + 1 accent",
    typography: "titre condensed, specs lisibles",
    imageTreatment: "carrosserie nette, reflets maitrises — garder la photo client",
    layout: "voiture heros + bande deal",
    density: "medium",
    mood: "puissant",
    tags: ["modele", "prix", "essai"],
  },
  Musique: {
    style: "scene",
    composition: "artiste/titre heros, date, lieu, CTA billets",
    colorPalette: "nuit + neon unique",
    typography: "titre impact, infos concert compactes",
    imageTreatment: "portrait scene, grain leger max",
    layout: "affiche concert classique reinterpretee, pas copie",
    density: "medium",
    mood: "live",
    tags: ["date", "lieu", "cta"],
  },
  Associations: {
    style: "humain",
    composition: "cause en titre, 1 image vraie, appel a l'action concret",
    colorPalette: "simple, contraste fort",
    typography: "lisible, message court",
    imageTreatment: "photo terrain si fournie",
    layout: "message + preuve + CTA don/rejoindre",
    density: "low",
    mood: "solidaire",
    tags: ["cta"],
  },
  "Religion & Culture": {
    style: "solennel",
    composition: "titre evenement, date lieu, ton respectueux, ornement discret",
    colorPalette: "profonde + or/creme avec parcimonie",
    typography: "serieux, infos pratiques claires",
    imageTreatment: "symbole ou photo fournie, jamais caricature",
    layout: "centre stable, marges larges",
    density: "low",
    mood: "recueilli",
    tags: ["date", "lieu"],
  },
  "Services divers": {
    style: "utile",
    composition: "service + benefice, zone, telephone/WhatsApp, CTA",
    colorPalette: "fond clair ou sombre simple + accent",
    typography: "sans, contact tres lisible",
    imageTreatment: "outil/avant-apres si image fournie",
    layout: "offre + preuve + contact",
    density: "medium",
    mood: "pratique",
    tags: ["telephone", "cta"],
  },
};

export const INSPIRATION_LIBRARY: InspirationReference[] = DOMAINS.map((domain) => ({
  id: `playbook-${domain.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  domain,
  ...DOMAIN_PLAYBOOK[domain],
}));

export function selectInspirationReferences(input: CreateBriefInput) {
  const playbook = INSPIRATION_LIBRARY.find((ref) => ref.domain === input.domain);
  const extra = INSPIRATION_LIBRARY.filter((ref) => ref.domain !== input.domain).slice(0, 0);

  const selected = playbook ? [playbook, ...extra] : INSPIRATION_LIBRARY.slice(0, 1);

  return {
    selected,
    principles: [
      ...DESIGN_LAWS,
      ...(playbook
        ? [
            `Domaine ${playbook.domain}: ${playbook.composition}`,
            `Layout: ${playbook.layout}`,
            `Typo: ${playbook.typography}`,
            `Image: ${playbook.imageTreatment}`,
            `Densite: ${playbook.density} | mood: ${playbook.mood}`,
          ]
        : []),
      ...(playbook && exemplarForDomain(playbook.domain)
        ? [
            `Exemplaire validé ${exemplarForDomain(playbook.domain)!.id}: ${exemplarForDomain(playbook.domain)!.visualNotes} Fichier: ${exemplarForDomain(playbook.domain)!.publicSrc}. S'en inspirer pour la composition, ne pas recopier le texte ni les contacts.`,
          ]
        : []),
    ],
  };
}
