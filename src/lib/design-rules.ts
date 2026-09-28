/** Design laws applied to every FlyerMint generation. Source: prompt section 3. PDF bases-du-design-lpt.pdf is missing from git. */

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
] as const;

export function designLawsBlock() {
  return ["DESIGN LAWS, mandatory on every poster:", ...DESIGN_LAWS.map((law, index) => `${index + 1}. ${law}`)].join(
    "\n",
  );
}

export const DESIGN_RULE_LABELS = [
  "palette limitée 2-3 couleurs",
  "2 familles typographiques max",
  "hiérarchie titre dominante",
  "contraste fort texte/fond",
  "alignement sur grille",
  "proximité des infos liées",
  "espace blanc / safe zone",
  "un seul héros visuel",
] as const;

export const GLOBAL_DESIGN_PROMPT = [
  "Design laws (must follow):",
  "- Maximum 2-3 main colors, no scattered palette.",
  "- Maximum 2 type families: one impact display for the title, one readable sans for body.",
  "- Clear hierarchy: the most important fact (title, date or price) dominates by size, weight and contrast.",
  "- Strong contrast: light text on dark ground or the reverse; never pale text on a busy photo.",
  "- Alignment on a consistent grid, not random placement.",
  "- Proximity: group related facts (date + time + venue) as one block.",
  "- Generous white space and safe margins; do not crowd edges.",
  "- One strong hero visual, not many weak elements.",
  "- Small FLYERMINT badge only. No other real company logos.",
].join(" ");

export const STYLE_REFERENCE_PROMPT = [
  "A style-reference image is attached (Gemini image-to-image only).",
  "Inspire composition, palette, layout and typographic treatment from it.",
  "Do NOT copy or near-copy the reference.",
  "Do NOT reproduce any logo, brand name, celebrity likeness, or identifiable real-company text visible on the reference.",
  "Generate an ORIGINAL poster in that style, with the new generic titles given below.",
].join(" ");

export const STYLE_INSPIRATION_TEXT = [
  "Inspire from the written professional-poster style notes (composition, palette, layout, type).",
  "OpenAI GPT Image models cannot take a bitmap reference, follow these notes as strictly as a visual brief.",
  "Do NOT copy any real brand, logo, or celebrity.",
  "Every visible word must be correctly spelled, sharp, and in a real language. No gibberish, no dummy latin, no warped letters.",
].join(" ");
