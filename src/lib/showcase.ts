import { readFile } from "node:fs/promises";
import path from "node:path";
import { SHOWCASE_SHEETS } from "@/lib/showcase-sheets";
import type { ShowcaseManifestEntry, ShowcaseManifestFile } from "@/lib/showcase-manifest";

export async function loadShowcaseManifest(): Promise<ShowcaseManifestFile | null> {
  try {
    const file = path.join(process.cwd(), "docs/inspirations/showcase-manifest.json");
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as ShowcaseManifestFile;
  } catch {
    return null;
  }
}

export async function getGeneratedShowcase() {
  const manifest = await loadShowcaseManifest();
  const generated = (manifest?.fiches ?? []).filter((entry) => entry.statut === "genere" && entry.fichier_image);
  return { manifest, generated };
}

export function sheetFor(id: string) {
  return SHOWCASE_SHEETS.find((sheet) => sheet.id === id);
}

export function pickLandingShowcase(generated: ShowcaseManifestEntry[], limit = 8) {
  const heroes = generated.filter((entry) => entry.hero_loop);
  const rest = generated.filter((entry) => !entry.hero_loop);
  return [...heroes, ...rest].slice(0, limit);
}

export function pickAfterPoster(generated: ShowcaseManifestEntry[]) {
  return generated.find((entry) => /restauration/i.test(entry.id)) ?? generated[0] ?? null;
}

export function posterForDomaine(generated: ShowcaseManifestEntry[], domaine: string) {
  const matches = postersForDomaine(generated, domaine);
  if (matches.length === 0) return undefined;
  const needle = fold(domaine);
  const index = [...needle].reduce((sum, char) => sum + char.charCodeAt(0), 0) % matches.length;
  return matches[index];
}

const GROUP_ALIASES: Array<{ keys: string[]; hay: string }> = [
  { keys: ["immobilier", "entreprise", "business"], hay: "immobilier & business" },
  { keys: ["technologie", "formation", "education"], hay: "technologie & education" },
  { keys: ["sport", "finance", "fintech"], hay: "sport & finance" },
  { keys: ["sante", "tourisme", "voyage", "associations", "association"], hay: "sante/tourisme/associations" },
  { keys: ["mode", "accessoires"], hay: "mode & accessoires" },
  { keys: ["beaute", "soins"], hay: "beaute & soins" },
  { keys: ["evenementiel"], hay: "evenementiel" },
  { keys: ["restauration"], hay: "restauration" },
];

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function postersForDomaine(generated: ShowcaseManifestEntry[], domaine: string) {
  const needle = fold(domaine);
  const alias = GROUP_ALIASES.find((group) => group.keys.some((key) => needle === key || needle.includes(key)));
  return generated.filter((entry) => {
    const hay = fold(entry.domaine);
    if (hay.includes(needle) || needle.includes(hay.split(/[&/]/)[0].trim())) return true;
    return Boolean(alias && hay === alias.hay);
  });
}

export function isVerified4k(entry: { master_width?: number; master_height?: number }) {
  return Math.max(entry.master_width ?? 0, entry.master_height ?? 0) >= 3840;
}

export function toPoster(entry: ShowcaseManifestEntry, hero = false) {
  const sheet = sheetFor(entry.id);
  return {
    id: entry.id,
    title: entry.titre_affiche_finale,
    subtitle: entry.sous_titre_affiche_finale,
    meta: sheet?.meta,
    cta: sheet?.cta ?? "Découvrir",
    tone: sheet?.tone ?? "night",
    imageSrc: hero
      ? entry.fichier_image_hero || entry.fichier_image_web || entry.fichier_image
      : entry.fichier_image_web || entry.fichier_image,
    domaine: entry.domaine,
  };
}
