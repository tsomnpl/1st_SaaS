export type ShowcaseSheet = {
  id: string;
  domaine: string;
  titre_original_catalogue: string;
  titre_affiche_finale: string;
  sous_titre_affiche_finale: string;
  meta: string;
  cta: string;
  tone: "night" | "warm" | "gold" | "clean" | "sport" | "soft" | "dark" | "fresh" | "rose" | "earth";
  premium: boolean;
  prompt: string;
};

export const SHOWCASE_SHEETS: ShowcaseSheet[] = [
  {
    id: "evenementiel-01",
    domaine: "Événementiel",
    titre_original_catalogue: "Concert \"Aura\" (Fulixgold)",
    titre_affiche_finale: "AURA",
    sous_titre_affiche_finale: "Nuit live",
    meta: "Sam. 21h · Zone 4",
    cta: "Prends ta place",
    tone: "night",
    premium: true,
    prompt:
      "Vertical concert poster 3:4. Dramatic amber-brown-orange smoke gradient. Profile of a young man with braids looking upward, cinematic lighting. Small FLYERMINT badge top-left. Huge gold 3D title AURA, subtitle BY SOLEN. Tiny ATELIER NUIT at top. Minimal audio bar at bottom. High contrast, readable text, no real brand logos.",
  },
  {
    id: "evenementiel-02",
    domaine: "Événementiel",
    titre_original_catalogue: "Concert \"Jeef Tiga\" (Kolwezi)",
    titre_affiche_finale: "TIGA LIVE",
    sous_titre_affiche_finale: "Concert",
    meta: "Salle Marguerita · Kolwezi",
    cta: "Réserver",
    tone: "sport",
    premium: false,
    prompt:
      "Vertical event poster 3:4. Vivid textured red with angular graphic frames. Bold white title TIGA LIVE. Date and time in framed boxes. Passes: SIMPLE and VIP. Venue Salle de fêtes Marguerita. Small FLYERMINT badge. High contrast, no real celebrity likeness, no real brand.",
  },
  {
    id: "evenementiel-03",
    domaine: "Événementiel",
    titre_original_catalogue: "Concert \"Vibes\" (Coding & Chill)",
    titre_affiche_finale: "VIBES",
    sous_titre_affiche_finale: "Coding & chill",
    meta: "14 juin · Lac Labotte · 15 000 FCFA",
    cta: "Prends ta place",
    tone: "fresh",
    premium: true,
    prompt:
      "Vertical concert poster 3:4. Bright urban sky and stylized clouds. Artist with dreadlocks and headphones, stylish sneakers. Red tilted title VIBES, small tag </coding>. White ticket card: Lac Labotte, 14 Juin 2026, 15 000 FCFA. FLYERMINT badge. No real brands.",
  },
  {
    id: "evenementiel-04",
    domaine: "Événementiel",
    titre_original_catalogue: "Concert / Événement \"Levizy 501\"",
    titre_affiche_finale: "LIVE 501",
    sous_titre_affiche_finale: "Stade du 26 mars",
    meta: "Sam. 28 sept · 3 000 F",
    cta: "Prends ta place",
    tone: "sport",
    premium: false,
    prompt:
      "Vertical concert poster 3:4. Intense textured red with dark waves. Crowd energy, raised hands in the background. Massive white title LIVE 501. Date SAM 28 SEPT, venue STADE DU 26 MARS, pass 3 000 F. FLYERMINT badge. No real artist names or brands.",
  },
  {
    id: "restauration-01",
    domaine: "Restauration",
    titre_original_catalogue: "Restaurant \"Avrum\"",
    titre_affiche_finale: "AVRIL TABLE",
    sous_titre_affiche_finale: "Livraison pendant travaux",
    meta: "Commande en ligne",
    cta: "Commander",
    tone: "gold",
    premium: false,
    prompt:
      "Vertical restaurant poster 3:4. Clean beige background. Circular brown emblem. Title AVRIL TABLE. Central card WE DELIVER DURING RENOVATION. Soft food still-life, no photos of real chains. FLYERMINT badge. Elegant, readable, no real restaurant brands.",
  },
  {
    id: "restauration-02",
    domaine: "Restauration",
    titre_original_catalogue: "Ghana High Restaurant",
    titre_affiche_finale: "HIGH TABLE",
    sous_titre_affiche_finale: "Menu du jour",
    meta: "Riz · salade · WhatsApp",
    cta: "Commander",
    tone: "warm",
    premium: false,
    prompt:
      "Vertical menu poster 3:4. White clean layout with a curved red header. Title HIGH TABLE. Short menu list: Riz au gras, Cantonais, Salade. Orange bullets, WhatsApp contact. FLYERMINT badge. Not a real restaurant brand, high readability.",
  },
  {
    id: "restauration-03",
    domaine: "Restauration",
    titre_original_catalogue: "Borcelle Resto (Promo Spéciale)",
    titre_affiche_finale: "RAMEN KATSU",
    sous_titre_affiche_finale: "Promo spéciale",
    meta: "45K au lieu de 55K",
    cta: "Commander",
    tone: "warm",
    premium: true,
    prompt:
      "Vertical food poster 3:4. Dark warm tones. Hero photo of steaming chicken katsu ramen with marinated eggs. Title RAMEN KATSU, badge SPECIAL PROMO, price 45K, old price 55K crossed. FLYERMINT badge. Appetizing, high contrast, no real restaurant chain.",
  },
  {
    id: "restauration-04",
    domaine: "Restauration",
    titre_original_catalogue: "Lizim Bar Resto",
    titre_affiche_finale: "LIZIM",
    sous_titre_affiche_finale: "Bar & resto",
    meta: "Réunions · anniversaires",
    cta: "Réserver",
    tone: "earth",
    premium: false,
    prompt:
      "Vertical restaurant poster 3:4. Dark red-brown texture with leafy details. Title LIZIM. Services: réunion, anniversaire. Daytime menus. Small food tiles, delivery badge. FLYERMINT badge. No real brand.",
  },
  {
    id: "mode-01",
    domaine: "Mode & Accessoires",
    titre_original_catalogue: "Rehoboth Prive (Prêt-à-porter)",
    titre_affiche_finale: "PRIVÉ ATELIER",
    sous_titre_affiche_finale: "Prêt-à-porter femme",
    meta: "Collection premium",
    cta: "Découvrir",
    tone: "gold",
    premium: true,
    prompt:
      "Vertical fashion poster 3:4. Minimal neutral tones. Monogram PA. Title PRIVÉ ATELIER. Line: premium women wear. Elegant garment still-life, QR-style square as graphic only. FLYERMINT badge. No real fashion houses.",
  },
  {
    id: "mode-02",
    domaine: "Mode & Accessoires",
    titre_original_catalogue: "Zara / Xander & Lizzie Collection",
    titre_affiche_finale: "LIANE & LISE",
    sous_titre_affiche_finale: "Nouvelle collection",
    meta: "Robes · sacs · sandales",
    cta: "Découvrir",
    tone: "gold",
    premium: false,
    prompt:
      "Vertical fashion poster 3:4. Bright airy studio. Title LIANE & LISE. Product words: sandales, robes, sacs. Soft daylight, editorial crop. FLYERMINT badge. No real fashion brand names.",
  },
  {
    id: "mode-03",
    domaine: "Mode & Accessoires",
    titre_original_catalogue: "Edith Closet",
    titre_affiche_finale: "ATELIER CLOSET",
    sous_titre_affiche_finale: "Braced in beauty",
    meta: "Vêtements · sacs · bijoux",
    cta: "Découvrir",
    tone: "rose",
    premium: false,
    prompt:
      "Vertical fashion poster 3:4. Powder pink and soft white. Title ATELIER CLOSET, line Braced in beauty. Clothes, shoes, bags, jewelry as a tasteful grid. FLYERMINT badge. No real boutique name.",
  },
  {
    id: "beaute-01",
    domaine: "Beauté & Soins",
    titre_original_catalogue: "Aura Luxe Unisex Salon",
    titre_affiche_finale: "AURA LUXE",
    sous_titre_affiche_finale: "Grand opening",
    meta: "12 avril 2026 · salon unisexe",
    cta: "Réserver",
    tone: "soft",
    premium: false,
    prompt:
      "Vertical beauty poster 3:4. Clean professional light tones. Title AURA LUXE. Badge GRAND OPENING, date 12 avril 2026. Salon interior hint, scissors and glow. FLYERMINT badge. No real salon brand.",
  },
  {
    id: "beaute-02",
    domaine: "Beauté & Soins",
    titre_original_catalogue: "Eve's Spa and Training Center",
    titre_affiche_finale: "SPA ÉVEIL",
    sous_titre_affiche_finale: "Soins & formation",
    meta: "Tresses · cils · make-up",
    cta: "Réserver",
    tone: "gold",
    premium: false,
    prompt:
      "Vertical spa poster 3:4. Warm gold and brown. Title SPA ÉVEIL. Five circular medallions: tresses, pédicure, perruques, cils, make-up. Training mention. FLYERMINT badge. No real spa brand.",
  },
  {
    id: "beaute-03",
    domaine: "Beauté & Soins",
    titre_original_catalogue: "Beauty Paradise (Éclat Naturel)",
    titre_affiche_finale: "ÉCLAT NATUREL",
    sous_titre_affiche_finale: "Gamme bio",
    meta: "Visage & corps",
    cta: "Découvrir",
    tone: "rose",
    premium: true,
    prompt:
      "Vertical beauty poster 3:4. Bordeaux to white gradient. Title REVELEZ VOTRE ECLAT NATUREL. Organic bottles on a white podium. Soft luxury light. FLYERMINT badge. No real cosmetic brand.",
  },
  {
    id: "immobilier-business-01",
    domaine: "Immobilier & Business",
    titre_original_catalogue: "Sac's Housing and Sales (Immobilier)",
    titre_affiche_finale: "AGENCE RIVE",
    sous_titre_affiche_finale: "Louer ou acheter",
    meta: "Studio · 1+1 · 2+1",
    cta: "Prendre RDV",
    tone: "clean",
    premium: false,
    prompt:
      "Vertical real-estate poster 3:4. Deep night blue with a yellow wave. Title DO YOU NEED AN APARTMENT? Brand AGENCE RIVE. Types: Studio, 1+1, 2+1. Interior photos, moving help line. FLYERMINT badge. No real agency name.",
  },
  {
    id: "immobilier-business-02",
    domaine: "Immobilier & Business",
    titre_original_catalogue: "Modibo Dembélé SARL",
    titre_affiche_finale: "MAISON HORIZON",
    sous_titre_affiche_finale: "Louer · vendre · construire",
    meta: "Matériaux de qualité",
    cta: "Prendre RDV",
    tone: "gold",
    premium: false,
    prompt:
      "Vertical architecture poster 3:4. Clean corporate beige and night blue. Title MAISON HORIZON. Line: nous louons, gérons, vendons et construisons. Building silhouette, quality materials. FLYERMINT badge. No real company name.",
  },
  {
    id: "immobilier-business-03",
    domaine: "Immobilier & Business",
    titre_original_catalogue: "TechPoint (SaaS Application)",
    titre_affiche_finale: "APPELA",
    sous_titre_affiche_finale: "Solutions évolutives",
    meta: "12,5k users · 99,9% uptime",
    cta: "Découvrir",
    tone: "dark",
    premium: true,
    prompt:
      "Vertical SaaS poster 3:4. Dark luminous tech gradient. Title APPELA, line Scalable Solutions. Dashboard metrics: Users 12.5k, Revenue, Uptime 99.9%. Glass cards. FLYERMINT badge. No real SaaS brand names.",
  },
  {
    id: "immobilier-business-04",
    domaine: "Immobilier & Business",
    titre_original_catalogue: "Nexora Bank (Banking Reimagined)",
    titre_affiche_finale: "BANQUE RIVE",
    sous_titre_affiche_finale: "Banking reimagined",
    meta: "Solde +12,5%",
    cta: "Ouvrir",
    tone: "clean",
    premium: true,
    prompt:
      "Vertical fintech poster 3:4. Soft blue app interface, abstract card — not a Visa/Mastercard replica. Title BANQUE RIVE. Balance $24,560 +12.5%. Quick actions. FLYERMINT badge. No real bank names.",
  },
  {
    id: "immobilier-business-05",
    domaine: "Immobilier & Business",
    titre_original_catalogue: "Ololo Express (E-commerce B2B)",
    titre_affiche_finale: "EXPRESS LISTING",
    sous_titre_affiche_finale: "Une annonce, un business",
    meta: "Commandes B2B",
    cta: "Découvrir",
    tone: "fresh",
    premium: false,
    prompt:
      "Vertical e-commerce poster 3:4. Title EXPRESS LISTING. Line One listing can change your business. Phone mockup with order notifications, 3D product cubes. FLYERMINT badge. No real marketplace brand.",
  },
  {
    id: "techno-education-01",
    domaine: "Technologie & Éducation",
    titre_original_catalogue: "Godfactor Technologies",
    titre_affiche_finale: "FACTO TECH",
    sous_titre_affiche_finale: "Tout le tech, dans la main",
    meta: "Phones · PC · réseau",
    cta: "Voir",
    tone: "dark",
    premium: false,
    prompt:
      "Vertical tech retail poster 3:4. Dark slate and mint accent. Title FACTO TECH. Line Everything tech, right in your palm. Phones, laptops, antennas — generic devices. Fast delivery. FLYERMINT badge. No real electronics brand names.",
  },
  {
    id: "techno-education-02",
    domaine: "Technologie & Éducation",
    titre_original_catalogue: "LNA X Claude Institute (Formation SAP)",
    titre_affiche_finale: "INSTITUT SAP PRO",
    sous_titre_affiche_finale: "Formation S/4HANA QM",
    meta: "135 000 FCFA · avant le 20 mai",
    cta: "S’inscrire",
    tone: "clean",
    premium: false,
    prompt:
      "Vertical education poster 3:4. White and corporate blue gradient. Title INSTITUT SAP PRO. Course SAP S/4HANA QM, certificat utilisateur, 135 000 FCFA, deadline 20 mai. FLYERMINT badge. No real institute names.",
  },
  {
    id: "techno-education-03",
    domaine: "Technologie & Éducation",
    titre_original_catalogue: "Cours à Domicile (Maths & Physique)",
    titre_affiche_finale: "COURS À DOMICILE",
    sous_titre_affiche_finale: "Maths & physique",
    meta: "6e à Terminale",
    cta: "S’inscrire",
    tone: "fresh",
    premium: false,
    prompt:
      "Vertical tutoring poster 3:4. Notebook paper texture, student silhouette. Title COURS A DOMICILE de la 6ème à la terminale. 5 years experience, BEPC and Bac. FLYERMINT badge. Friendly, readable, no real school brand.",
  },
  {
    id: "sport-finance-01",
    domaine: "Sport & Finance",
    titre_original_catalogue: "Marche Sportive (DSPP Community)",
    titre_affiche_finale: "MARCHE SPORTIVE",
    sous_titre_affiche_finale: "Édition 2 · 7 km",
    meta: "Dress code · 5 $",
    cta: "S’inscrire",
    tone: "sport",
    premium: false,
    prompt:
      "Vertical sports poster 3:4. Blue-orange cloudy sky. Title MARCHE SPORTIVE EDITION 2, 7 Km. Route, community picnic, dress code, 5$. Runners in motion, high contrast. FLYERMINT badge. No real club brand.",
  },
  {
    id: "sport-finance-02",
    domaine: "Sport & Finance",
    titre_original_catalogue: "Sendora (Smart Financial App)",
    titre_affiche_finale: "CLAIRE PAY",
    sous_titre_affiche_finale: "Shop the smart side",
    meta: "75 000+ utilisateurs",
    cta: "Rejoindre",
    tone: "clean",
    premium: true,
    prompt:
      "Vertical fintech poster 3:4. Fresh mint and night blue. Title CLAIRE PAY. Line Join the smart side. Abstract virtual card, community 75,000+. FLYERMINT badge. No real bank or app names.",
  },
  {
    id: "sante-tourisme-associations-01",
    domaine: "Santé/Tourisme/Associations",
    titre_original_catalogue: "Fondation Reviens à la Vie (Journée de Santé)",
    titre_affiche_finale: "RETOUR À LA VIE",
    sous_titre_affiche_finale: "Journée de santé gratuite",
    meta: "14 février · dépistages",
    cta: "S’inscrire",
    tone: "fresh",
    premium: false,
    prompt:
      "Vertical health poster 3:4. Hopeful mint and white. Title FONDATION RETOUR A LA VIE. Free care on 14 February. Screenings: palu, diabète, hypertension. FLYERMINT badge. No real hospital brand.",
  },
  {
    id: "sante-tourisme-associations-02",
    domaine: "Santé/Tourisme/Associations",
    titre_original_catalogue: "Hotels.ng",
    titre_affiche_finale: "RELAIS WEEKEND",
    sous_titre_affiche_finale: "Just click, book, go",
    meta: "Lagos · Calabar · Abuja",
    cta: "Réserver",
    tone: "earth",
    premium: true,
    prompt:
      "Vertical travel poster 3:4. Sunny tropical landscape. Title RELAIS WEEKEND. Line Where you wan dey this weekend? Just click, book, go. Soft hotel terrace, not a real hotel chain. FLYERMINT badge.",
  },
  {
    id: "sante-tourisme-associations-03",
    domaine: "Santé/Tourisme/Associations",
    titre_original_catalogue: "Campagne de Solidarité PECS (Kinshasa)",
    titre_affiche_finale: "SOLIDARITÉ",
    sous_titre_affiche_finale: "Centre communautaire",
    meta: "Ngaliema · Kinshasa",
    cta: "Soutenir",
    tone: "clean",
    premium: false,
    prompt:
      "Vertical community-support poster 3:4. Reassuring turquoise. Title SOLIDARITE. Adult volunteers at a community center in Ngaliema, hopeful and respectful. No minors, no distress, no real NGO logos. FLYERMINT badge. Adult volunteers only.",
  },
];

export const SHOWCASE_ORDER = SHOWCASE_SHEETS.map((sheet) => sheet.id);

export function getShowcaseSheet(id: string) {
  return SHOWCASE_SHEETS.find((sheet) => sheet.id === id);
}
