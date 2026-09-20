import { readFileSync } from "node:fs";
import { join } from "node:path";

type CatalogueFiche = {
  id: string;
  domaine: string;
  arriere_plan?: string;
  visuel?: string;
};

const DOMAIN_TO_CATALOGUE: Record<string, string[]> = {
  Evenementiel: ["Événementiel"],
  Restauration: ["Restauration"],
  "Mode & Accessoires": ["Mode & Accessoires"],
  "Beaute & Soins": ["Beauté & Soins"],
  Immobilier: ["Immobilier & Business"],
  "Business & Entreprise": ["Immobilier & Business"],
  Technologie: ["Technologie & Éducation"],
  "Education & Formation": ["Technologie & Éducation"],
  Sport: ["Sport & Finance"],
  "Finance & Fintech": ["Sport & Finance"],
  "Sante & Clinique": ["Santé/Tourisme/Associations"],
  "Tourisme & Voyage": ["Santé/Tourisme/Associations"],
  Associations: ["Santé/Tourisme/Associations"],
};

function loadCatalogueFiches(): CatalogueFiche[] {
  try {
    const raw = readFileSync(join(process.cwd(), "docs/inspirations/catalogue-extrait.json"), "utf8");
    const parsed = JSON.parse(raw) as { fiches?: CatalogueFiche[] };
    return parsed.fiches ?? [];
  } catch {
    return [];
  }
}

export function catalogueStyleNotesFor(domain: string, count = 2) {
  const labels = DOMAIN_TO_CATALOGUE[domain] ?? [];
  return loadCatalogueFiches()
    .filter((fiche) => labels.includes(fiche.domaine))
    .slice(0, count)
    .map((fiche) => {
      const fond = (fiche.arriere_plan ?? "").replace(/["“”]/g, "").slice(0, 160);
      const visuel = (fiche.visuel ?? "").replace(/["“”]/g, "").slice(0, 160);
      return `catalogue ${fiche.id}: fond=${fond || "composition nette"}; visuel=${visuel || "personne réelle dans l’action"}`;
    });
}
