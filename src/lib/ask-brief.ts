import { DOMAINS, FORMATS, VISUAL_TYPES } from "@/lib/domains";
import { createBriefSchema, type CreateBriefInput } from "@/lib/flyermint";

type Domain = (typeof DOMAINS)[number];

const HINTS: { domain: Domain; words: string[] }[] = [
  { domain: "Anniversaire", words: ["anniversaire", "birthday"] },
  { domain: "Mariage", words: ["mariage", "maries", "wedding", "noces"] },
  { domain: "Restauration", words: ["restaurant", "resto", "menu", "burger", "pizza", "plat", "cuisine", "snack", "maquis"] },
  { domain: "Beaute & Soins", words: ["beaute", "coiffure", "maquillage", "spa", "salon", "soin", "ongles"] },
  { domain: "Immobilier", words: ["immobilier", "appartement", "villa", "loyer", "terrain"] },
  { domain: "Education & Formation", words: ["formation", "cours", "ecole", "bootcamp", "universite"] },
  { domain: "Emploi & Recrutement", words: ["recrutement", "embauche", "emploi", "poste"] },
  { domain: "Technologie", words: ["application", "logiciel", "startup", "saas"] },
  { domain: "Sante & Clinique", words: ["clinique", "medecin", "sante", "pharmacie", "hopital"] },
  { domain: "Tourisme & Voyage", words: ["voyage", "hotel", "vacances", "tourisme"] },
  { domain: "Finance & Fintech", words: ["fintech", "epargne", "banque"] },
  { domain: "Agriculture", words: ["recolte", "ferme", "agriculture"] },
  { domain: "Automobile", words: ["voiture", "automobile", "moto", "garage"] },
  { domain: "Religion & Culture", words: ["culte", "eglise", "mosquee", "priere", "messe"] },
  { domain: "Associations", words: ["association"] },
  { domain: "Mode & Accessoires", words: ["mode", "robe", "vetement", "fashion"] },
  { domain: "Musique", words: ["album", "dj", "musique", "clip"] },
  { domain: "Sport", words: ["football", "basket", "fitness", "match", "sport"] },
  { domain: "E-commerce", words: ["boutique", "soldes", "livraison", "ecommerce"] },
  { domain: "Business & Entreprise", words: ["entreprise", "societe", "business"] },
  { domain: "Evenementiel", words: ["soiree", "festival", "evenement", "spectacle", "concert", "gala"] },
];

const MONTHS =
  "janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre";
const WEEKDAYS = "lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche";

const DATE_RE = new RegExp(
  `\\b(?:${WEEKDAYS})(?:\\s+\\d{1,2}(?:\\s+(?:${MONTHS})(?:\\s+\\d{4})?)?)?|\\b\\d{1,2}\\s+(?:${MONTHS})(?:\\s+\\d{4})?|\\b\\d{1,2}[/.-]\\d{1,2}(?:[/.-]\\d{2,4})?`,
  "i",
);
const PRICE_RE = /(\d{1,3}(?:[ .\u00a0]\d{3})+|\d{2,7})\s*(?:fcfa|f\s*cfa|cfa|xof|€|eur)\b/i;
const TIME_RE = /\b(\d{1,2})\s*h(?:\s*(\d{2}))?\b|\b(\d{1,2}:\d{2})\b/i;
const PHONE_RE = /(?:\+\d{1,3}[\s.-]*)?(?:\d[\s.-]*){7,11}\d/;
const AUDIENCE_RE = /\b(?:pour les|cible|public)\s+([^,.]{3,40})/i;
const PLACE_RE =
  /(?:^|[\s,])(?:à|a|au|aux|chez)\s+([A-Za-zÀ-ÿ][\p{L}'’-]{1,28}(?:\s+[A-Za-zÀ-ÿ][\p{L}'’-]{1,28})?)/iu;

const SKIP_PLACES = new Set([
  "domicile",
  "venir",
  "partir",
  "faire",
  "voir",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
]);

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function mentions(folded: string, word: string) {
  return new RegExp(`(?:^|[^a-z0-9])${word}s?(?:[^a-z0-9]|$)`, "i").test(folded);
}

function tidy(value: string) {
  return value
    .replace(/[,:;]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s.-]+|[\s.-]+$/g, "")
    .trim();
}

function dropBriefStickers(value: string) {
  return value
    .replace(/\d\uFE0F?\u20E3\s*(?:contexte|cible)?/gi, " ")
    .replace(/(?:^|\s)[1-9]\s+(?:contexte|cible)\b/gi, " ");
}

function cut(source: string, piece: string) {
  if (!piece) return source;
  const index = source.toLowerCase().indexOf(piece.toLowerCase());
  if (index < 0) return source;
  return `${source.slice(0, index)} ${source.slice(index + piece.length)}`.replace(/\s+/g, " ").trim();
}

function isCauseEvent(folded: string) {
  const hike = /montee|marche|randonnee|pic d|solidarite|sensibilisation/.test(folded);
  const clinic = /clinique|hopital|pharmacie|medecin|consultation|cabinet/.test(folded);
  return hike && !clinic;
}

function domainFor(folded: string): Domain {
  if (/cancer|octobre rose|ruban rose/.test(folded)) return "Sante & Clinique";
  if (isCauseEvent(folded)) return "Evenementiel";
  for (const hint of HINTS) {
    if (hint.words.some((word) => mentions(folded, word))) return hint.domain;
  }
  if (mentions(folded, "atelier") && /formation|cours|certificat|eleve/.test(folded)) return "Education & Formation";
  return "Evenementiel";
}

function visualFor(domain: Domain, folded: string) {
  if (domain === "Emploi & Recrutement") return "Offre d’emploi";
  if (domain === "Immobilier") return "Annonce immobilière";
  if (domain === "Restauration" && mentions(folded, "menu")) return "Menu";
  if (domain === "Anniversaire" || domain === "Mariage" || domain === "Evenementiel" || domain === "Musique") {
    return "Affiche événement";
  }
  if (domain === "Sante & Clinique" && /cancer|octobre rose|montee|sensibilisation/.test(folded)) {
    return "Affiche événement";
  }
  return "Affiche promotionnelle";
}

function formatFor(folded: string) {
  if (mentions(folded, "statut")) return "whatsapp_status";
  if (mentions(folded, "story")) return "instagram_story";
  if (mentions(folded, "a3")) return "affiche_a3";
  if (mentions(folded, "a4") || mentions(folded, "print")) return "affiche_a4";
  if (mentions(folded, "facebook")) return "facebook_post";
  if (mentions(folded, "banniere")) return "banniere";
  return "instagram_post";
}

function marketFor(folded: string) {
  const togo = mentions(folded, "togo") || mentions(folded, "lome");
  const benin = mentions(folded, "benin") || mentions(folded, "cotonou");
  if (togo && !benin) return "TG" as const;
  if (benin && !togo) return "BJ" as const;
  return undefined;
}

function ctaFor(text: string) {
  if (/\bwhatsapp\b/i.test(text)) return "WhatsApp";
  if (/\b(?:appelle|appeler|appel)\b/i.test(text)) return "Appelle";
  if (/\b(?:inscri(?:s|t)|inscription)\b/i.test(text)) return "Inscris-toi";
  if (/\br[ée]serv/i.test(text)) return "Réserve";
  if (/\b(?:command|ach[èe]te)/i.test(text)) return "Commande";
  if (/\bviens\b/i.test(text)) return "Viens";
  return "";
}

const COLOR =
  "rouge|noir|blanc|vert|bleu|or|dorée|doree|doré|dore|violet|violette|rose|orange|jaune|marron|beige|bordeaux|gold|red|black|white|green|blue|purple|pink";
const COLOR_CLAUSE = new RegExp(
  `(?:[,.]\\s*)?(?:je veux\\s+)?(?:des\\s+|en\\s+)?couleurs?\\s+((?:${COLOR})(?:\\s*(?:,|et)\\s*(?:${COLOR}))*)`,
  "gi",
);
const THEME_CLAUSE =
  /(?:[,.]\s*)?(?:sur\s+le\s+)?th[èe]me\s+(?:[«"“']([^»"”']+)[»"”']|([\p{L}][\p{L}'’-]+))/giu;
const LEAD =
  /^(?:je veux|je voudrais|j['’]aimerais|fais(?:-moi)?|cr[ée]e(?:r|z)?(?:\s+moi)?|une|un|la|le|affiche|poster|pour annoncer|annoncer)\s+/i;
const SKIP_NAMES = new Set(["mon", "ma", "mes", "le", "la", "les", "un", "une", "notre", "nos", "ton", "ta", "son", "sa"]);

export type AskGap = "date" | "names" | "who" | "price" | "poste" | "title";

export type AskReading =
  | { status: "empty" }
  | { status: "incomplete"; missing: AskGap[]; brief: CreateBriefInput | null }
  | { status: "ready"; brief: CreateBriefInput };

function titleFrom(text: string) {
  let value = text.replace(/^[\s,.:;-]+/, "").split(/[.!?]/)[0]?.trim() ?? "";
  for (let i = 0; i < 8; i += 1) {
    const next = value.replace(LEAD, "").replace(/^[\s,.:;-]+/, "").trim();
    if (next === value) break;
    value = next;
  }
  if (value.length > 110) value = value.slice(0, 110).replace(/\s+\S*$/, "").trim();
  if (/\b(?:je veux|couleurs?|th[èe]me)\b/i.test(value)) value = "";
  if (value.length < 2) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function pullColors(source: string) {
  const found: string[] = [];
  const rest = source.replace(COLOR_CLAUSE, (_all, list: string) => {
    for (const color of list.split(/\s*(?:,|et)\s*/i)) {
      const clean = color.trim().toLowerCase();
      if (clean && !found.includes(clean)) found.push(clean);
    }
    return " ";
  });
  return { colors: found.slice(0, 4), rest: rest.replace(/\s+/g, " ").trim() };
}

function pullTheme(source: string) {
  let theme = "";
  const rest = source.replace(THEME_CLAUSE, (_all, quoted?: string, bare?: string) => {
    theme = tidy(quoted || bare || "");
    return " ";
  });
  return { theme, rest: rest.replace(/\s+/g, " ").trim() };
}

function named(value: string) {
  const first = fold(value.split(/\s+/)[0] ?? "");
  return value.trim().length > 1 && !SKIP_NAMES.has(first);
}

function coupleFrom(text: string) {
  const match = text.match(/\bmariage\s+(?:de\s+|d['’])\s*([\p{L}][\p{L}'’-]+(?:\s+et\s+[\p{L}][\p{L}'’-]+)?)/iu);
  const names = match?.[1]?.trim() ?? "";
  return named(names) ? names : "";
}

export function missingFacts(brief: CreateBriefInput): AskGap[] {
  const gaps: AskGap[] = [];
  if (brief.title.trim().length < 2 || /\b(?:je veux|couleurs?|th[èe]me)\b/i.test(brief.title)) gaps.push("title");
  return gaps;
}

export function askGapSentence(missing: AskGap[], labels: Record<AskGap, string>, lead: string, andWord: string) {
  const items = missing.map((gap) => labels[gap]);
  const list = items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} ${andWord} ${items[items.length - 1]}`;
  return `${lead} ${list}.`;
}

function phoneFits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 && /^[0-9+\s().-]{6,20}$/.test(value.trim());
}

function colorsInSection(text: string) {
  const start = text.search(/couleurs?/i);
  if (start < 0) return [];
  const window = text.slice(start, start + 420);
  const found: string[] = [];
  const named = new RegExp(`\\b(${COLOR})\\b`, "gi");
  for (const match of window.matchAll(named)) {
    const clean = match[1].toLowerCase();
    if (!found.includes(clean)) found.push(clean);
  }
  return found.slice(0, 4);
}

const NEXT_LABEL =
  /\s+(?=(?:organis[eé]e?\s+par|mention\s*:|lieu\s*:|espace\s+r[ée]serv|cible\s*:|couleurs?\b|nom de l['’]|objectif du|direction artistique|message principal|ambiance recherch|formats? attendus|univers visuel|ton visuel|chaque ann[ée]e|dans cette|le cadre|[ée]l[ée]ments à))/i;

function fieldValue(text: string, pattern: RegExp) {
  const raw = text.match(pattern)?.[1] ?? "";
  return tidy((raw.split(NEXT_LABEL)[0] ?? "").replace(/[.:;,-]+$/, ""));
}

function structuredFacts(text: string) {
  const title =
    fieldValue(text, /nom de l['’]év[ée]nement\s*:\s*([^\n]{3,160})/i) ||
    fieldValue(text, /(?:^|\n)\s*[ée]v[ée]nement\s*:\s*([^\n]{3,160})/i) ||
    fieldValue(text, /[ée]v[ée]nement\s*:\s*([^\n]{3,160})/i);
  const organizer = fieldValue(text, /organis[eé]e?\s+par\s*:?\s*([^\n]{3,160})/i);
  const place =
    fieldValue(text, /(?:^|\n)\s*lieu\s*:\s*([^\n]{2,120})/i) ||
    fieldValue(text, /\blieu\s*:\s*([^\n]{2,120})/i);
  return {
    title,
    organizer,
    place,
    rose: /octobre rose/i.test(text),
    dateReserved: /espace r[ée]serv[ée][^\n.]{0,48}date/i.test(text),
  };
}

function parseAsk(raw: string): CreateBriefInput | null {
  const text = dropBriefStickers(raw).replace(/\s+/g, " ").trim();
  if (text.length < 2) return null;

  const folded = fold(text);
  const facts = structuredFacts(text);
  const colored = pullColors(text);
  const themed = pullTheme(colored.rest);
  const colors = colored.colors.slice();
  for (const color of colorsInSection(text)) {
    if (!colors.includes(color)) colors.push(color);
  }
  colors.splice(4);
  const theme = themed.theme;
  let rest = themed.rest;
  const price = rest.match(PRICE_RE)?.[0]?.replace(/\s+/g, " ").trim() ?? "";
  rest = cut(rest, price);
  const date = rest.match(DATE_RE)?.[0]?.replace(/\s+/g, " ").trim() ?? "";
  rest = cut(rest, date);
  const timeMatch = rest.match(TIME_RE);
  const time = timeMatch?.[0]?.replace(/\s+/g, "").replace(/h(\d{2})?/i, (_all, minutes) => `h${minutes ?? ""}`) ?? "";
  rest = cut(rest, timeMatch?.[0] ?? "");
  const phoneMatch = rest.match(PHONE_RE)?.[0]?.trim() ?? "";
  const phone = phoneFits(phoneMatch) ? phoneMatch.replace(/\s+/g, " ") : "";
  rest = cut(rest, phoneMatch);
  const placeMatch = rest.match(PLACE_RE);
  const placeRaw = placeMatch?.[1]?.trim() ?? "";
  const place = placeRaw && !SKIP_PLACES.has(fold(placeRaw)) ? placeRaw : "";
  rest = place ? cut(rest, placeMatch?.[0] ?? place) : rest;
  const audienceMatch = rest.match(AUDIENCE_RE);
  const audience = audienceMatch?.[1]?.trim() ?? "";
  rest = audience ? cut(rest, audienceMatch?.[0] ?? "") : rest;
  rest = tidy(
    rest.replace(/\b(?:appelle|appeler|appel|inscription|inscris-toi|inscris|r[ée]serve|commande|whatsapp|viens|entr[ée]e)\b/gi, " "),
  );

  const domain = domainFor(folded);
  const names = coupleFrom(text);
  let title = facts.title || (names && domain === "Mariage" ? `Mariage de ${names}` : titleFrom(rest));
  if (title.length < 2 && domain === "Mariage") title = "Mariage";
  if (title.length < 2) return null;

  const whatsapp = /\bwhatsapp\b/i.test(text);
  const visualType = visualFor(domain, folded);
  const format = formatFor(folded);

  if (!VISUAL_TYPES.includes(visualType as (typeof VISUAL_TYPES)[number])) return null;
  if (!FORMATS.some((item) => item.value === format)) return null;

  const parsed = createBriefSchema.safeParse({
    visualType,
    domain,
    objective: (facts.title ? `${facts.title}${facts.place ? `, ${facts.place}` : ""}` : text).slice(0, 240),
    targetAudience: (audience || "Public visé").slice(0, 240),
    title: title.slice(0, 120),
    subtitle: (facts.rose ? "Octobre Rose" : theme).slice(0, 160),
    description: (facts.organizer ? `Organisé par ${facts.organizer}` : "").slice(0, 240),
    price: price.slice(0, 40),
    date: date.slice(0, 40),
    time: time.slice(0, 40),
    location: (facts.place || place).slice(0, 160),
    contactPhone: whatsapp ? "" : phone,
    whatsapp: whatsapp ? phone : "",
    cta: ctaFor(text),
    format,
    creativeFreedom: "copie_exacte",
    colors,
    style: theme ? `Thème ${theme}`.slice(0, 80) : undefined,
    market: marketFor(folded),
    seasonalDecline: true,
    adaptiveData: {
      ...(theme ? { theme } : {}),
      ...(facts.dateReserved ? { dateSpace: "reserved" } : {}),
    },
  });

  return parsed.success ? parsed.data : null;
}

export function askFieldValues(brief: CreateBriefInput) {
  const adaptive = brief.adaptiveData ?? {};
  const fields: Record<string, string> = {
    visualType: brief.visualType,
    objective: brief.objective,
    targetAudience: brief.targetAudience,
    title: brief.title,
    subtitle: brief.subtitle ?? "",
    description: brief.description ?? "",
    price: brief.price ?? "",
    date: brief.date ?? "",
    time: brief.time ?? "",
    location: brief.location ?? "",
    contactPhone: brief.contactPhone ?? "",
    whatsapp: brief.whatsapp ?? "",
    cta: brief.cta ?? "",
    style: brief.style ?? "",
    mood: brief.mood ?? "",
    format: brief.format,
    colors: (brief.colors ?? []).join(", "),
  };
  for (const [key, value] of Object.entries(adaptive)) {
    if (value.trim()) fields[`adaptive_${key}`] = value;
  }
  const names = adaptive.noms?.trim() || coupleFrom(`${brief.title} ${brief.objective}`);
  if (names) fields.adaptive_noms = names;
  return fields;
}

export function readAsk(raw: string): AskReading {
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length < 2) return { status: "empty" };
  const brief = parseAsk(text);
  if (!brief) return { status: "incomplete", missing: ["title"], brief: null };
  const missing = missingFacts(brief);
  if (missing.length) return { status: "incomplete", missing, brief };
  return { status: "ready", brief };
}

export function briefFromAsk(raw: string): CreateBriefInput | null {
  const reading = readAsk(raw);
  return reading.status === "ready" ? reading.brief : null;
}
