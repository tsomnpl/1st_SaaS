import { GLOBAL_DESIGN_PROMPT, STYLE_INSPIRATION_TEXT, STYLE_REFERENCE_PROMPT, DESIGN_RULE_LABELS } from "./design-rules.ts";
import { SHOWCASE_SHEETS, type ShowcaseSheet } from "./showcase-sheets.ts";

export type ShowcaseDesign = {
  id: string;
  style: string;
  composition: string;
  palette: string[];
  paletteWhy: string;
  ambiance: string;
  typography: string;
  rules: string[];
};

const RULES = [...DESIGN_RULE_LABELS];

export const SHOWCASE_DESIGN: ShowcaseDesign[] = [
  { id: "evenementiel-01", style: "dégradé dramatique + titre 3D", composition: "profil héros bas-gauche, titre centré haut, safe zone basse", palette: ["#7C2D12", "#F59E0B", "#1C1917"], paletteWhy: "ambre/orange = énergie et passion événementielle", ambiance: "festif cinématique", typography: "display serif or 3D + sans lisible", rules: RULES },
  { id: "evenementiel-02", style: "graphisme angulaire haute énergie", composition: "titre massif haut, cadres date/tarif groupés", palette: ["#B91C1C", "#FFFFFF", "#111827"], paletteWhy: "rouge = passion live, blanc pour lisibilité", ambiance: "urgent", typography: "condensed bold + sans", rules: RULES },
  { id: "evenementiel-03", style: "urbain lumineux + ticket", composition: "personnage héros, titre incliné, encart ticket bas", palette: ["#3B82F6", "#EF4444", "#F8FAFC"], paletteWhy: "bleu ciel + rouge d'accent, 3 couleurs max", ambiance: "jeune", typography: "display slanted + sans ticket", rules: RULES },
  { id: "evenementiel-04", style: "affiche stade texturée", composition: "titre blanc géant, infos pass/lieu en bande basse", palette: ["#991B1B", "#FFFFFF", "#0F172A"], paletteWhy: "rouge intense événementiel", ambiance: "crowd", typography: "ultra bold condensed", rules: RULES },
  { id: "restauration-01", style: "épuré beige + emblème", composition: "centre stable, encart message, marges larges", palette: ["#E7D5C5", "#7C4A2D", "#1E293B"], paletteWhy: "tons chauds appétissants, fond neutre", ambiance: "élégant", typography: "serif emblème + sans body", rules: RULES },
  { id: "restauration-02", style: "menu clair bandeau courbe", composition: "header coloré, liste groupée par proximité", palette: ["#FFFFFF", "#DC2626", "#F97316"], paletteWhy: "blanc lisible + rouge/orange appetite", ambiance: "quotidien", typography: "sans menu, prix plus gras", rules: RULES },
  { id: "restauration-03", style: "food héros gros plan", composition: "plat centré, badge promo, prix dominant", palette: ["#1C1917", "#F59E0B", "#F8FAFC"], paletteWhy: "sombre chaleureux pour faire briller le plat", ambiance: "gourmand", typography: "display titre + chiffres prix", rules: RULES },
  { id: "restauration-04", style: "texture sombre + services", composition: "titre haut, services groupés, visuel plat unique", palette: ["#7F1D1D", "#1C1917", "#FDE68A"], paletteWhy: "rouge-brun resto, or discret", ambiance: "convivial", typography: "sans robuste", rules: RULES },
  { id: "mode-01", style: "éditorial minimal", composition: "beaucoup d'air, monogramme, un still-life", palette: ["#E7E5E4", "#1C1917", "#D6D3D1"], paletteWhy: "neutres luxe, 1 accent sombre", ambiance: "premium", typography: "serif editorial + sans léger", rules: RULES },
  { id: "mode-02", style: "studio lumineux", composition: "look unique, titre haut, produits en ligne courte", palette: ["#F8FAFC", "#1E293B", "#D4B483"], paletteWhy: "clair + 1 accent luxe", ambiance: "airé", typography: "serif titre + sans", rules: RULES },
  { id: "mode-03", style: "doux poudré", composition: "titre + une grille légère, pas d'encombrement", palette: ["#F9E4E8", "#FFFFFF", "#9D174D"], paletteWhy: "rose poudré beauté/mode", ambiance: "délicat", typography: "script léger + sans", rules: RULES },
  { id: "beaute-01", style: "salon professionnel clair", composition: "titre + badge date groupés, intérieur en héros", palette: ["#F8FAFC", "#6D28D9", "#1E293B"], paletteWhy: "clair pro + violet prestige", ambiance: "soin", typography: "sans élégant", rules: RULES },
  { id: "beaute-02", style: "médaillons services", composition: "titre haut, 5 cercles alignés, formation en bas", palette: ["#B45309", "#1C1917", "#FDE68A"], paletteWhy: "doré/brun = prestige beauté", ambiance: "chaleureux", typography: "sans + labels courts", rules: RULES },
  { id: "beaute-03", style: "luxe bio podium", composition: "titre fort, flacons héros, beaucoup d'air", palette: ["#9F1239", "#FFFFFF", "#1C1917"], paletteWhy: "bordeaux prestige + blanc", ambiance: "éclat", typography: "display + sans", rules: RULES },
  { id: "immobilier-business-01", style: "confiance + vague accent", composition: "question-titre, types de biens en pastilles alignées", palette: ["#0F172A", "#F59E0B", "#E0F2FE"], paletteWhy: "bleu nuit = confiance immo, jaune = énergie CTA", ambiance: "serieux", typography: "sans géométrique, chiffres forts", rules: RULES },
  { id: "immobilier-business-02", style: "corporate architecture", composition: "titre + 3 piliers, silhouette bâtiment", palette: ["#1E293B", "#D4B483", "#F8FAFC"], paletteWhy: "navy + or confiance", ambiance: "pro", typography: "sans net", rules: RULES },
  { id: "immobilier-business-03", style: "dashboard dark tech", composition: "titre, 3 métriques max, verre UI", palette: ["#020617", "#22D3EE", "#F8FAFC"], paletteWhy: "dark + cyan = tech/confiance", ambiance: "innovant", typography: "sans moderne", rules: RULES },
  { id: "immobilier-business-04", style: "fintech interface", composition: "carte abstraite héros, solde lisible, actions groupées", palette: ["#1E3A8A", "#FFFFFF", "#3B82F6"], paletteWhy: "bleu banque = sécurité", ambiance: "fiable", typography: "sans serieux, chiffres précis", rules: RULES },
  { id: "immobilier-business-05", style: "produit 3D + phone", composition: "promesse titre, un mockup, CTA bas", palette: ["#064E3B", "#10B981", "#F8FAFC"], paletteWhy: "vert croissance e-commerce", ambiance: "opportunité", typography: "sans + titre impact", rules: RULES },
  { id: "techno-education-01", style: "retail tech sombre", composition: "titre, un objet héros, liste courte", palette: ["#1E293B", "#10B981", "#F8FAFC"], paletteWhy: "slate + mint tech", ambiance: "net", typography: "sans moderne", rules: RULES },
  { id: "techno-education-02", style: "corporate formation", composition: "titre cours, preuve certificat, prix/date groupés", palette: ["#FFFFFF", "#1D4ED8", "#0F172A"], paletteWhy: "bleu académique = confiance formation", ambiance: "ambition", typography: "sans lisible, bullets", rules: RULES },
  { id: "techno-education-03", style: "cahier scolaire", composition: "titre promesse, preuve réussite, CTA inscription", palette: ["#F8FAFC", "#1D4ED8", "#F59E0B"], paletteWhy: "papier + bleu étude + orange énergie", ambiance: "motivant", typography: "sans friendly", rules: RULES },
  { id: "sport-finance-01", style: "ciel action", composition: "titre édition, infos trajet groupées, coureur héros", palette: ["#F97316", "#1E3A8A", "#FFFFFF"], paletteWhy: "orange énergie sport + bleu ciel", ambiance: "dynamique", typography: "titre impact + infos compactes", rules: RULES },
  { id: "sport-finance-02", style: "fintech mint", composition: "promesse, carte abstraite, preuve communauté", palette: ["#0F172A", "#10B981", "#F8FAFC"], paletteWhy: "navy + mint = finance fiable", ambiance: "smart", typography: "sans serieux", rules: RULES },
  { id: "sante-tourisme-associations-01", style: "santé rassurante", composition: "titre cause, services groupés, date visible", palette: ["#ECFDF5", "#059669", "#1E293B"], paletteWhy: "vert = nature, soin, apaisement", ambiance: "espoir", typography: "sans clair", rules: RULES },
  { id: "sante-tourisme-associations-02", style: "évasion tropicale", composition: "paysage héros full-bleed, titre + CTA bande", palette: ["#F59E0B", "#0E7490", "#FEF3C7"], paletteWhy: "soleil/sable + lagon voyage", ambiance: "envie", typography: "titre évocation + sans", rules: RULES },
  { id: "sante-tourisme-associations-03", style: "solidarité turquoise", composition: "message centré, un visuel humain respectueux, CTA don", palette: ["#14B8A6", "#F8FAFC", "#0F172A"], paletteWhy: "turquoise rassurant associations", ambiance: "solidaire", typography: "sans lisible, message court", rules: RULES },
];

export function designFor(id: string) {
  return SHOWCASE_DESIGN.find((row) => row.id === id);
}

export function supabaseDomainForSheet(id: string) {
  if (id.startsWith("evenementiel")) return "evenementiel";
  if (id.startsWith("restauration")) return "restauration";
  if (id.startsWith("mode")) return "mode";
  if (id.startsWith("beaute")) return "beaute";
  if (id === "immobilier-business-01" || id === "immobilier-business-02") return "immobilier";
  if (id === "immobilier-business-03") return "business";
  if (id === "immobilier-business-04") return "finance";
  if (id === "immobilier-business-05") return "e-commerce";
  if (id === "techno-education-01") return "technologie";
  if (id.startsWith("techno-education")) return "education";
  if (id === "sport-finance-01") return "sport";
  if (id === "sport-finance-02") return "finance";
  if (id === "sante-tourisme-associations-01") return "sante";
  if (id === "sante-tourisme-associations-02") return "tourisme";
  if (id === "sante-tourisme-associations-03") return "associations";
  return "";
}

export function buildShowcasePrompt(sheet: ShowcaseSheet, hasVisualRef: boolean, dnaBlock = "") {
  const design = designFor(sheet.id);
  if (!design) throw new Error(`DESIGN_MISSING_${sheet.id}`);
  return [
    hasVisualRef ? STYLE_REFERENCE_PROMPT : STYLE_INSPIRATION_TEXT,
    GLOBAL_DESIGN_PROMPT,
    dnaBlock,
    `Vertical poster 3:4, print-sharp, high resolution. Recorded size is the model max (typically 1024x1536), not 4K.`,
    `Domain: ${sheet.domaine}.`,
    `Style: ${design.style}. Composition: ${design.composition}.`,
    `Palette limited to ${design.palette.join(", ")} (${design.paletteWhy}).`,
    `Typography: ${design.typography}. Ambience: ${design.ambiance}.`,
    `Title to render clearly: ${sheet.titre_affiche_finale}.`,
    `Subtitle: ${sheet.sous_titre_affiche_finale}.`,
    `Meta: ${sheet.meta}. CTA: ${sheet.cta}.`,
    sheet.prompt,
    "At least one photoreal human who belongs in the scene (not a floating collage). Natural skin, correct hands.",
    "Original artwork only. No real brand names, no copied logos, no celebrity likeness.",
    "Never copy a phone, WhatsApp, email, address, price or date from the attached reference.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function referenceCategorisation(sheet: ShowcaseSheet) {
  const design = designFor(sheet.id);
  if (!design) throw new Error(`DESIGN_MISSING_${sheet.id}`);
  return {
    domaine: sheet.domaine,
    style: design.style,
    composition: design.composition,
    palette: design.palette,
    ambiance: design.ambiance,
  };
}

export function allShowcasePromptSamples() {
  return SHOWCASE_SHEETS.slice(0, 3).map((sheet) => ({
    id: sheet.id,
    prompt: buildShowcasePrompt(sheet, true),
    rules: designFor(sheet.id)?.rules ?? [],
  }));
}
