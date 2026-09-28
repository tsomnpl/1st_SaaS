import { slugForDomain } from "@/lib/inspiration-folders";
import type { CreateBriefInput } from "@/lib/flyermint";

export type DomainReference = {
  id: string;
  domain: string;
  slug: string;
  storagePath: string;
  style: string;
  background: string;
  texts: string;
  visual: string;
  palette: string[];
  analyzed: boolean;
};

export type ReferenceSelection = {
  domain: string;
  slug: string | null;
  selected: DomainReference | null;
  examined: DomainReference[];
  rejectedOtherDomains: number;
  reason: string;
};

const STOP = new Set([
  "les",
  "des",
  "une",
  "pour",
  "dans",
  "avec",
  "sur",
  "par",
  "the",
  "and",
  "for",
  "with",
]);

const SCHOOL = ["ecolier", "devoirs", "cahier", "ecole", "cartable", "primaire", "college", "lycee", "sacados"];
const PROFESSIONAL = ["corporate", "adulte", "professionnel", "bureau", "dossier", "certificat", "entreprise"];
const PROMO = ["cta", "bouton", "contact", "appel", "inscription", "promo", "offre"];

function fold(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokens(value: string) {
  return fold(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3 && !STOP.has(token));
}

function haystack(ref: DomainReference) {
  return fold(`${ref.style} ${ref.background} ${ref.texts} ${ref.visual}`);
}

function briefText(brief: CreateBriefInput) {
  return [
    brief.visualType,
    brief.objective,
    brief.targetAudience,
    brief.title,
    brief.subtitle,
    brief.description,
    brief.style,
    brief.mood,
    brief.cta,
    ...Object.values(brief.adaptiveData ?? {}),
  ]
    .filter(Boolean)
    .join(" ");
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function scoreReference(brief: CreateBriefInput, ref: DomainReference) {
  const hay = haystack(ref);
  const briefTokens = new Set(tokens(briefText(brief)));
  const domainTokens = new Set(tokens(`${brief.domain} ${ref.slug} formation education`));
  let score = ref.analyzed ? 1 : 0;
  const hits: string[] = [];

  for (const token of tokens(`${ref.style} ${ref.texts} ${ref.visual} ${ref.background}`)) {
    if (domainTokens.has(token)) continue;
    if (briefTokens.has(token)) {
      score += 3;
      hits.push(token);
    }
  }

  const objective = fold(`${brief.objective} ${brief.visualType} ${brief.cta ?? ""}`);
  if (hasAny(objective, ["promouvoir", "promo", "inscri", "vente", "offre", "pub"])) {
    if (hasAny(hay, PROMO)) {
      score += 4;
      hits.push("structure-promo");
    }
  }
  if (brief.price || brief.oldPrice || brief.newPrice) {
    if (hasAny(hay, ["prix", "tarif", "fcfa"])) {
      score += 4;
      hits.push("prix");
    }
  }
  if (brief.date || brief.time) {
    if (hasAny(hay, ["date", "heure", "horaire"])) {
      score += 3;
      hits.push("date");
    }
  }
  if (brief.location) {
    if (hasAny(hay, ["lieu", "adresse", "ville"])) {
      score += 2;
      hits.push("lieu");
    }
  }
  if (brief.contactPhone || brief.whatsapp) {
    if (hasAny(hay, ["contact", "telephone", "whatsapp"])) {
      score += 3;
      hits.push("telephone");
    }
  }
  if (hasAny(hay, ["titre"])) {
    score += 2;
    hits.push("titre");
  }

  const subject = fold(`${brief.title} ${brief.subtitle ?? ""} ${brief.description ?? ""} ${brief.targetAudience}`);
  const wantsProfessional = hasAny(subject, [
    "excel",
    "certification",
    "professionnel",
    "adulte",
    "bureau",
    "logiciel",
    "competence",
    "entreprise",
  ]);
  const wantsSchool = hasAny(subject, ["ecole", "devoir", "primaire", "college", "enfant", "eleve"]);

  if (wantsProfessional && !wantsSchool) {
    if (hasAny(hay, PROFESSIONAL)) {
      score += 6;
      hits.push("pro");
    }
    if (hasAny(hay, SCHOOL) || hay.includes("enfant")) {
      score -= 6;
      hits.push("ecole-ecarte");
    }
  }
  if (wantsSchool && hasAny(hay, SCHOOL)) {
    score += 6;
    hits.push("scolaire");
  }

  const wantsPerson = Boolean(brief.mainImageUrl) || hasAny(subject, ["formateur", "personne", "portrait"]);
  if (wantsPerson && hasAny(hay, ["personne", "homme", "femme", "portrait", "enseignant", "fille", "garcon"])) {
    score += 3;
    hits.push("personne");
  }

  return { score, hits };
}

export function selectReferenceInDomain(input: {
  domain: string;
  brief: CreateBriefInput;
  candidates: DomainReference[];
}): ReferenceSelection {
  const slug = slugForDomain(input.domain);
  const examined: DomainReference[] = [];
  let rejectedOtherDomains = 0;

  for (const candidate of input.candidates) {
    const sameDomain = candidate.domain === input.domain && (!slug || candidate.slug === slug);
    const pathOk = !slug || candidate.storagePath.startsWith(`${slug}/`);
    if (!sameDomain || !pathOk) {
      rejectedOtherDomains += 1;
      continue;
    }
    examined.push(candidate);
  }

  const ranked = examined
    .map((ref) => ({ ref, ...scoreReference(input.brief, ref) }))
    .sort((a, b) => b.score - a.score || Number(b.ref.analyzed) - Number(a.ref.analyzed) || a.ref.id.localeCompare(b.ref.id));

  const selected = ranked[0]?.ref ?? null;
  const top = ranked.slice(0, 3).map((row) => `${row.ref.id.slice(0, 8)}:${row.score}(${row.hits.join("+") || "base"})`);
  const reason = selected
    ? `Domaine impose ${input.domain} (${slug ?? "sans-slug"}). ${examined.length} references du dossier, ${rejectedOtherDomains} hors domaine ignorees. Choisie ${selected.id} (${selected.storagePath}) score ${ranked[0]?.score}. Top: ${top.join(", ")}.`
    : `Domaine impose ${input.domain} (${slug ?? "sans-slug"}). Aucune reference reelle dans ce dossier. ${rejectedOtherDomains} hors domaine ignorees. Pas de repli vers un autre domaine.`;

  return {
    domain: input.domain,
    slug,
    selected,
    examined,
    rejectedOtherDomains,
    reason,
  };
}
