import { DOMAINS, FORMATS, VISUAL_TYPES } from "@/lib/domains";
import { briefFromAsk } from "@/lib/ask-brief";
import { createBriefSchema, type CreateBriefInput } from "@/lib/flyermint";

type Domain = (typeof DOMAINS)[number];

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

export function grounded(source: string, value: string) {
  const text = value.trim();
  if (text.length < 2) return false;
  const src = fold(source);
  const whole = fold(text);
  if (whole.length > 3 && src.includes(whole)) return true;
  const compactSrc = src.replace(/[^a-z0-9]/g, "");
  const compact = whole.replace(/[^a-z0-9]/g, "");
  if (compact.length > 3 && compactSrc.includes(compact)) return true;
  const tokens = whole.split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  if (tokens.length > 0) return tokens.every((token) => src.includes(token));
  const escaped = whole.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(src);
}

function domainOf(value: unknown): Domain | null {
  const folded = fold(str(value));
  if (!folded) return null;
  return DOMAINS.find((domain) => fold(domain) === folded) ?? null;
}

function visualOf(value: unknown) {
  const folded = fold(str(value));
  if (!folded) return "";
  return VISUAL_TYPES.find((item) => fold(item) === folded) ?? "";
}

function formatOf(value: unknown) {
  const raw = str(value);
  const folded = fold(raw);
  if (!folded) return "";
  return (
    FORMATS.find((item) => item.value === raw || fold(item.value) === folded || fold(item.label) === folded)?.value ??
    ""
  );
}

function formatAsked(format: string, source: string) {
  const folded = fold(source);
  if (format === "instagram_post") return true;
  if (format === "instagram_story") return folded.includes("story");
  if (format === "whatsapp_status") return folded.includes("statut");
  if (format === "affiche_a3") return /(?:^|[^a-z0-9])a3(?:[^a-z0-9]|$)/.test(folded);
  if (format === "affiche_a4") return /(?:^|[^a-z0-9])a4(?:[^a-z0-9]|$)/.test(folded) || folded.includes("print");
  if (format === "facebook_post") return folded.includes("facebook");
  if (format === "banniere") return folded.includes("banniere");
  return false;
}

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1] ?? raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

function printed(model: string, local: string | undefined, source: string, max: number) {
  if (model && grounded(source, model)) return clip(model, max);
  if (local && grounded(source, local)) return clip(local, max);
  return "";
}

function colorList(value: unknown) {
  const parts = Array.isArray(value) ? value.flatMap((item) => str(item).split(/[,/]/)) : str(value).split(/[,/]/);
  return parts.map((item) => item.trim()).filter(Boolean);
}

function colorsOf(value: unknown, source: string, local: string[]) {
  const model = colorList(value)
    .filter((color) => grounded(source, color))
    .slice(0, 4);
  if (model.length) return model;
  return local.filter((color) => grounded(source, color)).slice(0, 4);
}

function phoneOf(value: string) {
  return /^[0-9+\s().-]{6,20}$/.test(value) ? value : "";
}

function marketOf(value: unknown, source: string, local?: "TG" | "BJ") {
  const folded = fold(source);
  const mentioned = value === "TG" || value === "BJ" ? value : undefined;
  if (mentioned === "TG" && /togo|lome/.test(folded)) return "TG" as const;
  if (mentioned === "BJ" && /benin|cotonou/.test(folded)) return "BJ" as const;
  return local;
}

function adaptiveOf(value: unknown, source: string, local: Record<string, string>) {
  const out: Record<string, string> = { ...local };
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [key, raw] of Object.entries(value)) {
    const text = str(raw);
    if (!text || !grounded(source, text)) continue;
    out[key.slice(0, 40)] = clip(text, 400);
  }
  return out;
}

export function askTextOf(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input) || !("ask" in input)) return null;
  const ask = (input as { ask?: unknown }).ask;
  if (typeof ask !== "string") return null;
  return ask.trim();
}

export function askUnderstandPrompt(message: string) {
  const domains = DOMAINS.join(" | ");
  const visuals = VISUAL_TYPES.join(" | ");
  const formats = FORMATS.map((item) => item.value).join(" | ");
  return [
    "Tu lis la demande d'une affiche. Réponds uniquement avec un objet JSON.",
    "Comprends d'abord ce que la personne veut faire, puis prépare la copie exacte.",
    "N'invente aucune date, heure, prix, téléphone, nom, lieu, couleur ou phrase absente de la demande.",
    "La date, le prix, les noms, le lieu et le poste sont optionnels. Laisse-les vides s'ils ne sont pas écrits.",
    "Le titre est le texte à écrire sur l'affiche, pas la consigne « je veux une affiche ».",
    "creativeFreedom vaut toujours copie_exacte.",
    "Cancer, octobre rose ou ruban rose : domain Sante & Clinique et visualType Affiche événement.",
    `domain est exactement une de ces valeurs : ${domains}.`,
    `visualType est exactement une de ces valeurs : ${visuals}.`,
    `format est exactement une de ces valeurs : ${formats}.`,
    "Champs : visualType, domain, objective, targetAudience, title, subtitle, description, price, date, time, location, contactPhone, whatsapp, cta, format, colors, style, mood, market, adaptiveData.",
    "Demande :",
    message.slice(0, 4000),
  ].join("\n");
}

export function briefFromModelJson(modelText: string, source: string): CreateBriefInput | null {
  const json = extractJson(modelText);
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const row = json as Record<string, unknown>;
  const local = briefFromAsk(source);
  const cancer = /cancer|octobre rose|ruban rose/.test(fold(source));
  const domain = cancer ? ("Sante & Clinique" as const) : (domainOf(row.domain) ?? local?.domain ?? null);
  if (!domain) return null;

  const visualType = cancer
    ? "Affiche événement"
    : visualOf(row.visualType) || local?.visualType || "Affiche promotionnelle";
  const title = printed(str(row.title), local?.title, source, 120);
  if (title.length < 2) return null;

  const objective = clip(str(row.objective) || local?.objective || title, 240);
  const audienceModel = str(row.targetAudience);
  const targetAudience = clip(
    audienceModel && grounded(source, audienceModel) ? audienceModel : local?.targetAudience || "Public visé",
    240,
  );
  const colors = colorsOf(row.colors, source, local?.colors ?? []);
  const style = printed(str(row.style), local?.style, source, 80);
  const mood = printed(str(row.mood), local?.mood, source, 80);
  const market = marketOf(row.market, source, local?.market);

  const parsed = createBriefSchema.safeParse({
    visualType,
    domain,
    objective,
    targetAudience,
    title,
    subtitle: printed(str(row.subtitle), local?.subtitle, source, 160),
    description: printed(str(row.description), local?.description, source, 2000),
    price: printed(str(row.price), local?.price, source, 40),
    oldPrice: printed(str(row.oldPrice), local?.oldPrice, source, 40),
    newPrice: printed(str(row.newPrice), local?.newPrice, source, 40),
    date: printed(str(row.date), local?.date, source, 40),
    time: printed(str(row.time), local?.time, source, 40),
    location: printed(str(row.location), local?.location, source, 160),
    contactPhone: phoneOf(printed(str(row.contactPhone), local?.contactPhone, source, 20)),
    whatsapp: phoneOf(printed(str(row.whatsapp), local?.whatsapp, source, 20)),
    cta: printed(str(row.cta), local?.cta, source, 80),
    format: (() => {
      const picked = formatOf(row.format);
      if (picked && formatAsked(picked, source)) return picked;
      return local?.format || "instagram_post";
    })(),
    creativeFreedom: "copie_exacte",
    colors,
    style: style || undefined,
    mood: mood || undefined,
    market,
    adaptiveData: adaptiveOf(row.adaptiveData, source, local?.adaptiveData ?? {}),
  });

  return parsed.success ? parsed.data : null;
}

export function mergeAskAssets(brief: CreateBriefInput, input: unknown): CreateBriefInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ...brief, creativeFreedom: "copie_exacte" };
  const body = input as Record<string, unknown>;
  const image = (value: unknown) => (typeof value === "string" && value.trim() ? value : undefined);
  return {
    ...brief,
    creativeFreedom: "copie_exacte",
    mainImageUrl: image(body.mainImageUrl) ?? brief.mainImageUrl,
    logoUrl: image(body.logoUrl) ?? brief.logoUrl,
    personalReferenceUrl: image(body.personalReferenceUrl) ?? brief.personalReferenceUrl,
    rememberBrand: typeof body.rememberBrand === "boolean" ? body.rememberBrand : brief.rememberBrand,
    seasonalDecline: typeof body.seasonalDecline === "boolean" ? body.seasonalDecline : true,
  };
}
