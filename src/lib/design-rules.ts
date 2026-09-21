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
  "A real poster bitmap is attached as the COMPOSITION MODEL (Gemini image-to-image).",
  "Reproduce the STRUCTURE of that image as closely as a professional designer would: subject placement, title zone, price zone, CTA zone, margins, contrast rhythm, crop, and photo treatment.",
  "Change the INFORMATION, not the layout. Put the client's name, title, date, time, venue, price, phone and CTA into the same visual logic.",
  "If the client identity requires a different accent color, keep the same structure (dark ground / light type / one accent) and swap only the accent.",
  "Do NOT copy logos, brand names, celebrity likenesses, identifiable real people, or the exact source advertising copy.",
  "Do NOT invent a generic centered-person layout if the reference is split (person right, title left, price large, CTA bottom, logo small top).",
  "Do NOT treat the reference as a loose theme. It is the model to follow.",
].join(" ");

export const STYLE_INSPIRATION_TEXT = [
  "No bitmap could be attached. Follow the written Creative DNA / catalog principles as strictly as a visual brief.",
  "Keep domain-specific human staging, hierarchy, crop and contrast.",
  "Do NOT copy any real brand, logo, or celebrity.",
  "Every visible word must be correctly spelled, sharp, and in a real language. No gibberish, no dummy latin, no warped letters.",
].join(" ");
