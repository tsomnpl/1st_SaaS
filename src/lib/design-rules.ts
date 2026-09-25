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

/** Used when a reference bitmap is attached: the output is the same poster with the client's text, not a new design. */
export const REFERENCE_COPY_PROMPT = [
  "TASK: EDIT THE ATTACHED POSTER. This is a copy-and-replace job, not a new design.",
  "The result must look like the SAME poster at first glance. Keep 100% identical:",
  "- the layout: position, size and order of every block, title, photo, box and line;",
  "- the background: photo, texture, gradient, light rays and decorative shapes;",
  "- the colors of every element (background, title, boxes, bands, accents);",
  "- every font: same typeface feel, weight, case, italic/script, outline, 3D or gold effect, letter spacing and size;",
  "- every shape used to hold text: rectangles, slanted bands, pills, badges, frames, arrows, separators, with the same color and position;",
  "- the people: same number, same pose, same framing, same clothing style, same lighting and cut-out treatment.",
  "Change ONLY these things:",
  "1) TEXT: erase every original word and write the client text below in the SAME slot, with the SAME font style, size, color and effect as the word it replaces. Main title slot → client title. Secondary headline slot → subtitle or offer. Date box → date. Time box → time. Price or biggest number slot → price. Info/contact line → location, phone, WhatsApp. Bottom call-to-action slot → CTA. Name labels next to people → names given by the client (artists, speakers), otherwise remove the label.",
  "2) EMPTY SLOTS: if the client gave nothing for a slot, remove that text. Never write filler, lorem ipsum, or leftover original words.",
  "3) FACES: replace each real person's face with a different, original person of similar age and style, keeping the exact pose, outfit style and lighting. Never reproduce an identifiable real person.",
  "4) LOGO: remove the original brand logo and brand name. Put the client logo in that exact spot if one is supplied; otherwise write a small FLYERMINT wordmark there.",
  "Never keep any original phone number, date, price, address, social handle, person name or brand from the reference.",
  "Do NOT modernize, simplify, clean up, recolor, flatten or restyle the poster. Same density and richness as the reference.",
  "If the output canvas ratio differs from the reference, extend the background to fit; do not rearrange the blocks.",
  "Every written word must be spelled exactly as given, sharp and readable.",
].join("\n");

export const STYLE_INSPIRATION_TEXT = [
  "Inspire from the written professional-poster style notes (composition, palette, layout, type).",
  "No bitmap reference was attached to this request — follow the written Creative DNA strictly.",
  "Do NOT copy any real brand, logo, or celebrity.",
  "Every visible word must be correctly spelled, sharp, and in a real language. No gibberish, no dummy latin, no warped letters.",
].join(" ");
