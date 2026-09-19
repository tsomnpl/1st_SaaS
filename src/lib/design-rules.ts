/** Design laws applied to every FlyerMint generation. Source: prompt section 3 + DESIGN_LAWS. PDF bases-du-design-lpt.pdf is missing from git. */

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
  "A style-reference image is attached.",
  "Inspire composition, palette, layout and typographic treatment from it.",
  "Do NOT copy or near-copy the reference.",
  "Do NOT reproduce any logo, brand name, celebrity likeness, or identifiable real-company text visible on the reference.",
  "Generate an ORIGINAL poster in that style, with the new generic titles given below.",
].join(" ");
