import type { CreateBriefInput } from "@/lib/flyermint";
import { pickIndex } from "@/lib/inspiration-domains";

export const TEXT_SLOTS = [
  "title",
  "subtitle",
  "description",
  "date",
  "time",
  "price",
  "old_price",
  "location",
  "phone",
  "whatsapp",
  "email",
  "website",
  "cta",
  "logo",
  "bullets",
  "social",
] as const;
export type TextSlot = (typeof TEXT_SLOTS)[number];

export const ZONE_ROLES = [
  "header",
  "main_visual",
  "title",
  "subtitle",
  "supporting_text",
  "info_block",
  "price",
  "cta",
  "brand",
  "footer",
] as const;

export type ReferenceZone = { role: string; position: string; description: string };

export type ReferenceAnalysis = {
  subject: string;
  keywords: string[];
  communicationType: string;
  hasPerson: boolean;
  personCount: number;
  hasProduct: boolean;
  ctaType: string;
  textSlots: TextSlot[];
  zones: ReferenceZone[];
  originalText: string[];
  structureSummary: string;
  aspectRatio: string;
};

export const REFERENCE_ANALYSIS_KEYS =
  'subject (French, what the poster advertises, e.g. "cours à domicile"), keywords (8-15 lowercase French words about the offer, audience and sector, include synonyms), communicationType (promotion|evenement|inscription|recrutement|annonce|vente|autre), hasPerson (boolean), personCount (number), hasProduct (boolean), ctaType (telephone|whatsapp|inscription|reservation|achat|site|aucun), textSlots (subset of: ' +
  TEXT_SLOTS.join(", ") +
  "), zones (array of {role, position, description}; role in: " +
  ZONE_ROLES.join(", ") +
  '; position like "left 35%, bottom", "right upper third", "top right corner"), originalText (every visible line of text exactly as written, including phones, prices, names, brands, handles), structureSummary (one precise sentence describing the visual grammar: subject position, title block, info blocks, CTA, brand, footer), aspectRatio (e.g. 4:5)';

function text(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function list(value: unknown, max: number, itemMax = 120) {
  return Array.isArray(value) ? value.map((item) => text(item, itemMax)).filter(Boolean).slice(0, max) : [];
}

export function parseReferenceAnalysis(raw: unknown): ReferenceAnalysis | null {
  let data: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      data = JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (raw && typeof raw === "object") {
    data = raw as Record<string, unknown>;
  }
  if (!data) return null;
  const subject = text(data.subject);
  const keywords = list(data.keywords, 20, 40).map((word) => word.toLowerCase());
  if (!subject && keywords.length === 0) return null;
  const zones = Array.isArray(data.zones)
    ? data.zones
        .map((zone) => {
          const row = (zone ?? {}) as Record<string, unknown>;
          return { role: text(row.role, 40), position: text(row.position, 80), description: text(row.description, 160) };
        })
        .filter((zone) => zone.role && zone.position)
        .slice(0, 14)
    : [];
  return {
    subject,
    keywords,
    communicationType: text(data.communicationType, 40),
    hasPerson: data.hasPerson === true,
    personCount: Number.isFinite(Number(data.personCount)) ? Number(data.personCount) : data.hasPerson === true ? 1 : 0,
    hasProduct: data.hasProduct === true,
    ctaType: text(data.ctaType, 40),
    textSlots: list(data.textSlots, TEXT_SLOTS.length, 20).filter((slot): slot is TextSlot =>
      (TEXT_SLOTS as readonly string[]).includes(slot),
    ),
    zones,
    originalText: list(data.originalText, 60, 160),
    structureSummary: text(data.structureSummary, 400),
    aspectRatio: text(data.aspectRatio, 12),
  };
}

const STOPWORDS = new Set([
  "les", "des", "une", "pour", "avec", "dans", "sur", "par", "vos", "votre", "nos", "notre", "aux", "est", "sont", "qui", "que",
  "plus", "tout", "tous", "the", "and", "for", "you", "your", "chez", "ses", "son", "mes", "mon", "ton", "tes", "leur",
]);

export function normalizeToken(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/(?<=\w{4})(s|x)$/, "");
}

export function tokens(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    .map(normalizeToken);
}

function similar(a: string, b: string) {
  if (a === b) return true;
  const stem = Math.min(a.length, b.length, 6);
  return stem >= 5 && a.slice(0, stem) === b.slice(0, stem);
}

export function briefSlots(brief: CreateBriefInput): TextSlot[] {
  const slots: TextSlot[] = ["title"];
  if (brief.subtitle) slots.push("subtitle");
  if (brief.description) slots.push("description");
  if (brief.date) slots.push("date");
  if (brief.time) slots.push("time");
  if (brief.price || brief.newPrice) slots.push("price");
  if (brief.oldPrice) slots.push("old_price");
  if (brief.location) slots.push("location");
  if (brief.contactPhone) slots.push("phone");
  if (brief.whatsapp) slots.push("whatsapp");
  if (brief.email) slots.push("email");
  if (brief.cta) slots.push("cta");
  if (brief.logoUrl) slots.push("logo");
  return slots;
}

export type ReferenceCandidate = { id: string; storagePath: string; analysis: ReferenceAnalysis | null };

export type RankedReference = ReferenceCandidate & { score: number; reason: string };

/** Ranks the references of ONE domain folder against the full brief. The domain itself is never changed here. */
export function rankDomainReferences(brief: CreateBriefInput, candidates: ReferenceCandidate[]): RankedReference[] {
  const briefText = [
    brief.title,
    brief.subtitle,
    brief.description,
    brief.objective,
    brief.visualType,
    brief.targetAudience,
    brief.style,
    brief.mood,
    brief.cta,
    ...Object.values(brief.adaptiveData ?? {}),
  ]
    .filter(Boolean)
    .join(" ");
  const wanted = [...new Set(tokens(briefText))];
  const wantedSlots = briefSlots(brief).filter((slot) => slot !== "title");
  const vertical = /story|status|9:16|a3|a4|affiche/.test(brief.format);
  const seed = `${brief.domain}|${brief.title}|${brief.objective}`;

  return candidates
    .map((candidate, index) => {
      const analysis = candidate.analysis;
      if (!analysis) return { ...candidate, score: -1, reason: "pas encore analysée", tie: index };
      const refTokens = [...new Set(tokens([analysis.subject, analysis.keywords.join(" "), analysis.communicationType].join(" ")))];
      const matched = wanted.filter((word) => refTokens.some((ref) => similar(word, ref)));
      const slotHits = wantedSlots.filter((slot) => analysis.textSlots.includes(slot));
      let score = matched.length * 3 + slotHits.length;
      const notes = [
        matched.length ? `sujet « ${analysis.subject} » ↔ brief (${matched.join(", ")})` : `sujet « ${analysis.subject} » sans mot commun`,
        wantedSlots.length ? `emplacements ${slotHits.length}/${wantedSlots.length}` : "",
      ];
      if (brief.mainImageUrl && analysis.hasPerson) {
        score += 2;
        notes.push("personne à remplacer par ta photo");
      }
      if (analysis.hasPerson) score += 1;
      const [w, h] = analysis.aspectRatio.split(":").map(Number);
      if (w && h && (h > w) === vertical) {
        score += 1;
        notes.push(`ratio ${analysis.aspectRatio}`);
      }
      return { ...candidate, score, reason: notes.filter(Boolean).join(" · "), tie: index };
    })
    .sort((a, b) => b.score - a.score || pickIndex(`${seed}|${a.id}`, 997) - pickIndex(`${seed}|${b.id}`, 997) || a.tie - b.tie)
    .map((row) => ({ id: row.id, storagePath: row.storagePath, analysis: row.analysis, score: row.score, reason: row.reason }));
}

const SLOT_VALUE: Record<TextSlot, (brief: CreateBriefInput) => string | undefined> = {
  title: (b) => b.title,
  subtitle: (b) => b.subtitle,
  description: (b) => b.description,
  date: (b) => b.date,
  time: (b) => b.time,
  price: (b) => b.newPrice || b.price,
  old_price: (b) => b.oldPrice,
  location: (b) => b.location,
  phone: (b) => b.contactPhone,
  whatsapp: (b) => b.whatsapp,
  email: (b) => b.email,
  website: () => undefined,
  cta: (b) => b.cta,
  logo: () => undefined,
  bullets: (b) => Object.values(b.adaptiveData ?? {}).filter((value) => value?.trim()).join(" · ") || undefined,
  social: () => undefined,
};

const SLOT_LABEL: Record<TextSlot, string> = {
  title: "Title slot",
  subtitle: "Subtitle / secondary headline slot",
  description: "Offer / body text slot",
  date: "Date slot",
  time: "Time slot",
  price: "Price slot",
  old_price: "Old / crossed price slot",
  location: "Address / location slot",
  phone: "Phone slot",
  whatsapp: "WhatsApp slot",
  email: "Email slot",
  website: "Website slot",
  cta: "CTA / button slot",
  logo: "Logo slot",
  bullets: "Bullet / feature list slots",
  social: "Social handles slot",
};

/** One line per text slot of the reference: the client value to write there, or an order to delete it. */
export function slotMapping(brief: CreateBriefInput, analysis: ReferenceAnalysis | null) {
  const slots = analysis?.textSlots.length ? analysis.textSlots : (["title", "subtitle", "date", "time", "price", "location", "phone", "cta", "logo"] as TextSlot[]);
  return slots.map((slot) => {
    if (slot === "logo") {
      return brief.logoUrl
        ? `${SLOT_LABEL.logo} → the attached CLIENT LOGO, unchanged.`
        : `${SLOT_LABEL.logo} → remove the original logo; write a small "FLYERMINT" wordmark only if the layout needs a brand mark there.`;
    }
    const value = SLOT_VALUE[slot](brief)?.trim();
    return value ? `${SLOT_LABEL[slot]} → "${value}"` : `${SLOT_LABEL[slot]} → DELETE the original content (client gave nothing). Leave clean background.`;
  });
}

/** Client values the reference has no slot for: they must still appear, in the closest equivalent spot. */
export function unplacedClientText(brief: CreateBriefInput, analysis: ReferenceAnalysis | null) {
  const slots = new Set<TextSlot>(analysis?.textSlots.length ? analysis.textSlots : ["title", "subtitle", "date", "time", "price", "location", "phone", "cta", "logo"]);
  return TEXT_SLOTS.filter((slot) => slot !== "logo" && slot !== "bullets" && !slots.has(slot))
    .map((slot) => [slot, SLOT_VALUE[slot](brief)?.trim()] as const)
    .filter(([, value]) => Boolean(value))
    .map(([slot, value]) => `${SLOT_LABEL[slot].replace(/ slots?$/, "")}: "${value}"`);
}

/** Layout plan written before calling the image model. */
export function buildLayoutPlan(brief: CreateBriefInput, analysis: ReferenceAnalysis | null) {
  return {
    format: brief.format,
    aspectRatio: analysis?.aspectRatio || "",
    structure: analysis?.structureSummary || "",
    zones: analysis?.zones ?? [],
    assets: {
      logo: Boolean(brief.logoUrl),
      clientPhoto: Boolean(brief.mainImageUrl),
      personalReference: Boolean(brief.personalReferenceUrl),
    },
    slots: slotMapping(brief, analysis),
    colors: brief.colors.length ? `client accent ${brief.colors.slice(0, 3).join(", ")}` : "reference colors",
  };
}

export function layoutPlanLines(plan: ReturnType<typeof buildLayoutPlan>) {
  return [
    plan.structure ? `Reference visual grammar: ${plan.structure}` : "",
    plan.zones.length ? `Zones (keep these positions): ${plan.zones.map((zone) => `${zone.role.toUpperCase()} = ${zone.position}${zone.description ? ` (${zone.description})` : ""}`).join("; ")}.` : "",
    `Format ${plan.format}${plan.aspectRatio ? `, reference ratio ${plan.aspectRatio}` : ""}.`,
  ].filter(Boolean);
}

/** Original words of the reference that are still visible on the result although the client did not give them. */
export function findLeftovers(visibleText: string[], originalText: string[], clientText: string[]) {
  const client = new Set(clientText.flatMap(tokens));
  const clientDigits = new Set(clientText.flatMap((value) => value.match(/\d{3,}/g) ?? []));
  const original = new Set(
    originalText.flatMap(tokens).filter((word) => word.length >= 4 && !client.has(word) && !["flyermint"].includes(word)),
  );
  const originalDigits = new Set(originalText.flatMap((value) => value.replace(/\s/g, "").match(/\d{4,}/g) ?? []));
  const found = new Set<string>();
  for (const line of visibleText) {
    for (const word of tokens(line)) if (original.has(word)) found.add(word);
    for (const digits of line.replace(/\s/g, "").match(/\d{4,}/g) ?? []) {
      if (originalDigits.has(digits) && !clientDigits.has(digits)) found.add(digits);
    }
  }
  return [...found];
}

export type FinalCheck = { item: string; status: "ok" | "missing" | "not_provided" | "not_verified"; detail?: string };

/** Last gate: every provided value must be readable on the poster, every asset must have really been sent. */
export function finalChecklist(input: {
  brief: CreateBriefInput;
  visibleText: string[] | undefined;
  attachmentsSent: string[];
  referenceRequired: boolean;
}): FinalCheck[] {
  const { brief } = input;
  const seen = input.visibleText?.length ? input.visibleText.join(" ") : null;
  const flat = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const present = (value?: string) => {
    if (!value?.trim()) return { status: "not_provided" as const };
    if (seen === null) return { status: "not_verified" as const };
    return flat(seen).includes(flat(value)) ? { status: "ok" as const } : { status: "missing" as const, detail: value };
  };
  const asset = (provided: boolean, role: string) =>
    !provided ? { status: "not_provided" as const } : input.attachmentsSent.includes(role) ? { status: "ok" as const } : { status: "missing" as const };
  return [
    { item: "TITRE", ...present(brief.title) },
    { item: "PRIX", ...present(brief.newPrice || brief.price) },
    { item: "DATE", ...present(brief.date) },
    { item: "HEURE", ...present(brief.time) },
    { item: "LIEU", ...present(brief.location) },
    { item: "CONTACT", ...present(brief.contactPhone || brief.whatsapp || brief.email) },
    { item: "CTA", ...present(brief.cta) },
    { item: "LOGO", ...asset(Boolean(brief.logoUrl), "logo") },
    { item: "IMAGE", ...asset(Boolean(brief.mainImageUrl), "photo") },
    {
      item: "REFERENCE",
      ...(input.referenceRequired
        ? input.attachmentsSent.includes("reference")
          ? { status: "ok" as const }
          : { status: "missing" as const }
        : { status: "not_provided" as const }),
    },
  ];
}
