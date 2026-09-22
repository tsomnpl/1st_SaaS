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
  "A style-reference bitmap is attached to this request.",
  "Treat it as the visual model for structure, not as a vague theme hint.",
  "Reproduce as closely as useful: composition, subject placement, scale, text zones, hierarchy, CTA position, negative space, contrast, and photographic treatment.",
  "Replace every commercial fact with the NEW titles, prices, dates and contacts given below.",
  "Do NOT copy logos, brand names, celebrity likenesses, or identifiable source text from the reference.",
  "Keep at least one photoreal human whose role matches the domain and the reference staging.",
].join(" ");

export const STYLE_INSPIRATION_TEXT = [
  "Inspire from the written professional-poster style notes (composition, palette, layout, type).",
  "No bitmap reference was attached to this request — follow the written Creative DNA strictly.",
  "Do NOT copy any real brand, logo, or celebrity.",
  "Every visible word must be correctly spelled, sharp, and in a real language. No gibberish, no dummy latin, no warped letters.",
].join(" ");
