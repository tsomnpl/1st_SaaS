import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { designFor } from "@/lib/showcase-design";
import { loadShowcaseReferenceCatalog, type ShowcaseStyleReference } from "@/lib/showcase-references";

export type VisualBriefHint = {
  domain: string;
  visualType: string;
  objective: string;
};

export function normalizeDomainKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Maps FlyerMint domains onto the visual groups extracted from references.pdf. */
export const DOMAIN_CATALOG_GROUPS: Record<string, string[]> = {
  Evenementiel: ["Événementiel"],
  Restauration: ["Restauration"],
  "Mode & Accessoires": ["Mode & Accessoires"],
  "Beaute & Soins": ["Beauté & Soins"],
  Immobilier: ["Immobilier & Business"],
  "Business & Entreprise": ["Immobilier & Business"],
  Technologie: ["Technologie & Éducation"],
  "Education & Formation": ["Technologie & Éducation"],
  Sport: ["Sport & Finance"],
  "Finance & Fintech": ["Sport & Finance", "Immobilier & Business"],
  "Sante & Clinique": ["Santé/Tourisme/Associations"],
  "Tourisme & Voyage": ["Santé/Tourisme/Associations"],
  Associations: ["Santé/Tourisme/Associations"],
  "E-commerce": ["Immobilier & Business"],
  Mariage: ["Mode & Accessoires"],
  Anniversaire: ["Événementiel"],
  "Emploi & Recrutement": ["Technologie & Éducation"],
  Agriculture: ["Restauration"],
  Automobile: ["Immobilier & Business"],
  Musique: ["Événementiel"],
  "Religion & Culture": ["Santé/Tourisme/Associations"],
  "Services divers": ["Immobilier & Business"],
};

type PageMapFiche = {
  id: string;
  page_reference_pdf: number | null;
  local_ref_path?: string | null;
  visual_ref_supported?: boolean;
};

function loadPageMap(): PageMapFiche[] {
  try {
    const file = path.join(process.cwd(), "docs/inspirations/reference-page-map.json");
    const raw = JSON.parse(readFileSync(file, "utf8")) as { fiches?: PageMapFiche[] };
    return raw.fiches ?? [];
  } catch {
    return [];
  }
}

export function selectVisualReferences(input: VisualBriefHint) {
  const catalog = loadShowcaseReferenceCatalog();
  const pages = loadPageMap();
  const groups = DOMAIN_CATALOG_GROUPS[input.domain] ?? [];
  const groupKeys = new Set(groups.map(normalizeDomainKey));
  const matched = catalog.filter((item) => groupKeys.has(normalizeDomainKey(item.domaine)));
  const pool = matched.length ? matched : catalog.slice(0, 4);
  const hint = normalizeDomainKey(`${input.visualType} ${input.objective}`);

  const ranked = [...pool].sort((a, b) => scoreRef(b, hint) - scoreRef(a, hint));
  const selected = ranked.slice(0, 2);
  const principles = selected.flatMap((item) => principlesFor(item));
  const bitmapPaths = selected
    .map((item) => pages.find((row) => row.id === item.id)?.local_ref_path)
    .filter((value): value is string => Boolean(value));

  return {
    selected,
    principles,
    bitmapPaths,
    catalogGroup: groups[0] ?? null,
    usedVisualLibrary: selected.length > 0,
  };
}

function scoreRef(item: ShowcaseStyleReference, hint: string) {
  if (!hint) return 0;
  const hay = normalizeDomainKey(`${item.style} ${item.composition} ${item.ambiance}`);
  return hint.split(" ").filter((token) => token.length > 3 && hay.includes(token)).length;
}

function principlesFor(item: ShowcaseStyleReference) {
  const design = designFor(item.id);
  return [
    `Visual library ${item.id}: composition ${item.composition}`,
    `Human placement and framing must follow that composition principle, not copy the source poster.`,
    `Palette principle: ${item.palette.join(", ")} — adapt, do not clone branded colors.`,
    `Mood: ${item.ambiance}. Style: ${item.style}.`,
    design ? `Typography principle: ${design.typography}.` : "",
    "Never copy logos, celebrity faces, or identifiable real-company text from the reference.",
  ].filter(Boolean);
}

export function loadPrivateStyleReferenceDataUrl(relativePath?: string) {
  if (!relativePath) return "";
  if (relativePath.includes("..") || path.isAbsolute(relativePath)) return "";
  if (!relativePath.startsWith("storage/private/ref-pages/")) return "";
  const fileName = path.basename(relativePath);
  if (!fileName || fileName !== relativePath.slice("storage/private/ref-pages/".length)) return "";
  const abs = path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "private", "ref-pages", fileName);
  try {
    if (!existsSync(abs)) return "";
    const buf = readFileSync(abs);
    if (!buf.length || buf.length > 2_000_000) return "";
    const ext = path.extname(abs).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export function firstAvailableStyleReference(paths: string[]) {
  for (const relativePath of paths) {
    const dataUrl = loadPrivateStyleReferenceDataUrl(relativePath);
    if (dataUrl) return { path: relativePath, dataUrl };
  }
  return null;
}
