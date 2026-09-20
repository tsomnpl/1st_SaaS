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
  const needle = domaine.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return generated.find((entry) => {
    const hay = entry.domaine.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    return hay.includes(needle) || needle.includes(hay.split(/[&/]/)[0].trim());
  });
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
