import { readFile } from "node:fs/promises";
import path from "node:path";
import { ALL_SHOWCASE_SHEETS } from "@/lib/showcase-sheets";
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
  return ALL_SHOWCASE_SHEETS.find((sheet) => sheet.id === id);
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
