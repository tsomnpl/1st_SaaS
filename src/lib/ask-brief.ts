import { DOMAINS, FORMATS, VISUAL_TYPES } from "@/lib/domains";
import { createBriefSchema, type CreateBriefInput } from "@/lib/flyermint";

type Domain = (typeof DOMAINS)[number];

const HINTS: { domain: Domain; words: string[] }[] = [
  { domain: "Anniversaire", words: ["anniversaire", "birthday"] },
  { domain: "Mariage", words: ["mariage", "maries", "wedding", "noces"] },
  { domain: "Restauration", words: ["restaurant", "resto", "menu", "burger", "pizza", "plat", "cuisine", "snack", "maquis"] },
  { domain: "Beaute & Soins", words: ["beaute", "coiffure", "maquillage", "spa", "salon", "soin", "ongles"] },
  { domain: "Immobilier", words: ["immobilier", "appartement", "villa", "loyer", "terrain"] },
  { domain: "Education & Formation", words: ["formation", "cours", "atelier", "ecole", "bootcamp", "universite"] },
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

function cut(source: string, piece: string) {
  if (!piece) return source;
  const index = source.toLowerCase().indexOf(piece.toLowerCase());
  if (index < 0) return source;
  return `${source.slice(0, index)} ${source.slice(index + piece.length)}`.replace(/\s+/g, " ").trim();
}

function domainFor(folded: string): Domain {
  for (const hint of HINTS) {
    if (hint.words.some((word) => mentions(folded, word))) return hint.domain;
  }
  return "Evenementiel";
}

function visualFor(domain: Domain, folded: string) {
  if (domain === "Emploi & Recrutement") return "Offre d’emploi";
  if (domain === "Immobilier") return "Annonce immobilière";
  if (domain === "Restauration" && mentions(folded, "menu")) return "Menu";
  if (domain === "Anniversaire" || domain === "Mariage" || domain === "Evenementiel" || domain === "Musique") {
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

function titleFrom(text: string) {
  let value = text
    .replace(/^(?:je veux|fais(?:-moi)?|cr[ée]e(?:r|z)?(?:\s+moi)?|affiche|poster|story|une|un|la|le)\s+/i, "")
    .replace(/^[\s,.:;-]+/, "")
    .split(/[.!?]/)[0]
    ?.trim() ?? "";
  value = value.replace(/^(?:une|un|la|le|affiche)\s+/i, "").trim();
  if (value.length > 110) value = value.slice(0, 110).replace(/\s+\S*$/, "").trim();
  if (value.length < 2) value = text.replace(/\s+/g, " ").trim().slice(0, 110);
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function phoneFits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 && /^[0-9+\s().-]{6,20}$/.test(value.trim());
}

export function briefFromAsk(raw: string): CreateBriefInput | null {
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length < 2) return null;

  const folded = fold(text);
  const price = text.match(PRICE_RE)?.[0]?.replace(/\s+/g, " ").trim() ?? "";
  let rest = cut(text, price);
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

  const title = titleFrom(rest);
  if (title.length < 2) return null;

  const domain = domainFor(folded);
  const whatsapp = /\bwhatsapp\b/i.test(text);
  const visualType = visualFor(domain, folded);
  const format = formatFor(folded);

  if (!VISUAL_TYPES.includes(visualType as (typeof VISUAL_TYPES)[number])) return null;
  if (!FORMATS.some((item) => item.value === format)) return null;

  const parsed = createBriefSchema.safeParse({
    visualType,
    domain,
    objective: text.slice(0, 240),
    targetAudience: (audience || "Public visé").slice(0, 240),
    title: title.slice(0, 120),
    subtitle: "",
    description: "",
    price: price.slice(0, 40),
    date: date.slice(0, 40),
    time: time.slice(0, 40),
    location: place.slice(0, 160),
    contactPhone: whatsapp ? "" : phone,
    whatsapp: whatsapp ? phone : "",
    cta: ctaFor(text),
    format,
    creativeFreedom: "copie_exacte",
    colors: [],
    market: marketFor(folded),
    seasonalDecline: true,
    adaptiveData: {},
  });

  return parsed.success ? parsed.data : null;
}
