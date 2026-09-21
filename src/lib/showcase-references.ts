import { readFileSync } from "node:fs";
import path from "node:path";

export type ShowcaseStyleReference = {
  id: string;
  domaine: string;
  style: string;
  composition: string;
  palette: string[];
  ambiance: string;
  imageUrl?: string;
};

export function loadShowcaseReferenceCatalog(): ShowcaseStyleReference[] {
  try {
    const file = path.join(process.cwd(), "docs/inspirations/references-catalog.json");
    const raw = JSON.parse(readFileSync(file, "utf8")) as { items?: ShowcaseStyleReference[] };
    return (raw.items ?? []).filter((item) => item.style && item.composition);
  } catch {
    return [];
  }
}
