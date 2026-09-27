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
  "Keep STRUCTURE only: subject placement, title zone, price zone, CTA zone, margins, contrast rhythm, crop, and photo treatment.",
  "WIPE every original letter, logo, phone, price, date and brand from the attached image. Paint over source typography. Then write ONLY the client facts listed in this prompt.",
  "If the attached poster has no person, ADD one photoreal person who belongs in this domain. The FlyerMint human rule overrides an empty landscape.",
  "If the client identity requires a different accent color, keep the same structure (dark ground / light type / one accent) and swap only the accent.",
  "Do NOT copy logos, brand names, celebrity likenesses, identifiable real people, or the exact source advertising copy.",
  "Never reuse a phone number, WhatsApp, email, address, social handle, price, or date visible on the reference — those belong to another business.",
  "Do NOT invent a phone, email, WhatsApp, address, price or date that is not in the client facts.",
  "Do NOT invent a generic centered-person layout if the reference is split (person right, title left, price large, CTA bottom, logo small top).",
  "Do NOT treat the reference as a loose theme. It is the model to follow.",
].join(" ");

/** Client generation with a reference bitmap: the output is the same poster with the client's text, not a new design. */
export const REFERENCE_COPY_PROMPT = [
  "TASK: EDIT THE ATTACHED REFERENCE POSTER. Modify the reference poster provided. Keep its composition and visual structure. Replace only the allowed elements with the elements of the new brief. This is a copy-and-replace job, not a new design.",
  "The FlyerMint general design rules do NOT apply here (no 2-3 color limit, no single-person rule, no FlyerMint palette, no new grid, no new hierarchy). The reference wins.",
  "At first glance the result must look like the SAME poster. Keep 100% identical:",
  "- the layout: position, size and order of every block, title, photo, card, box and line;",
  "- the background: photo, blur, texture, grid, gradient, light and decorative shapes;",
  "- the colors of every element (background, title, boxes, bands, accents, glow);",
  "- every font: same typeface feel, weight, case, italic/script, outline, glow, 3D or gold effect, letter spacing and relative size;",
  "- every shape that holds text: rectangles, cards, glass panels, slanted bands, pills, badges, icons, frames, arrows, separators — same color, same position;",
  "- the people and hands: same number, same pose, same gesture, same framing, same crop, same lighting and depth of field.",
  "Change ONLY these things:",
  "1) TEXT: erase every original word and write the client text in the SAME slot, with the SAME font style, size, color and effect as the word it replaces. Main title slot → client title. Secondary headline → subtitle or offer. Old/new price slots → prices. Date box → date. Time box → time. Info or contact line → location, phone, WhatsApp. Bottom call-to-action → CTA. Bullet/feature slots → client details, one per slot.",
  "2) EMPTY SLOTS: if the client gave nothing for a slot, remove that text (and its box if the box would be empty). Never write filler, lorem ipsum, field names, or leftover original words.",
  "3) PEOPLE: replace each real person's face with a different, original person of similar age and style, keeping the exact pose, outfit style and lighting. If a CLIENT PHOTO is attached, it replaces the main subject instead. Never reproduce an identifiable real person.",
  "4) LOGO: remove the original brand logo and brand name. If a CLIENT LOGO is attached, put it in that exact spot; otherwise write a small FLYERMINT wordmark there.",
  "Never keep any original phone number, date, price, address, social handle, person name or brand from the reference.",
  "Do NOT modernize, simplify, clean up, recolor, flatten or restyle. Same density and richness as the reference.",
  "If the output canvas ratio differs from the reference, extend the background to fit; do not rearrange the blocks.",
  "Spell every word exactly as given, letter by letter. Sharp, readable text only.",
].join("\n");

/** Composition reference: same visual grammar (zones, proportions, hierarchy), new content and new identity. */
export const REFERENCE_COMPOSITION_PROMPT = [
  "TASK: TRANSPOSE THE STRUCTURE of the attached reference poster onto the client content. The reference gives the STRUCTURE, the client gives the CONTENT.",
  "Keep faithfully: subject position and scale, title block position and size, info blocks, CTA position and shape, brand/logo area, footer, margins, negative space, direction of gaze, subject/text relationship, density and hierarchy.",
  "You may redraw: the person (new original person, same pose and role), the background details, the photography, the decorative elements — but each shape must keep the function it has in the reference (badge, button, card, band, separator, icon).",
  "Never copy from the reference: text, phone, address, logo, company name, brand, QR code, social handles, identifiable people, commercial information.",
  "Do NOT move blocks: if the reference has the subject left and the title right, the result has the subject left and the title right.",
].join("\n");

/** General inspiration: mood, palette and general composition, freer layout. */
export const REFERENCE_INSPIRATION_PROMPT = [
  "TASK: CREATE A NEW POSTER INSPIRED by the attached reference: same mood, palette family, general composition and hierarchy logic. Layout details may differ.",
  "Never copy from the reference: text, phone, address, logo, company name, brand, QR code, social handles, identifiable people.",
].join("\n");

export const STYLE_INSPIRATION_TEXT = [
  "No bitmap could be attached. Follow the written Creative DNA / catalog principles as strictly as a visual brief.",
  "Keep domain-specific human staging, hierarchy, crop and contrast.",
  "Do NOT copy any real brand, logo, or celebrity.",
  "Every visible word must be correctly spelled, sharp, and in a real language. No gibberish, no dummy latin, no warped letters.",
].join(" ");
