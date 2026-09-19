import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DOMAINS } from "./domains";
import folderMap from "./inspiration-folder-map.json";
import {
  INSPIRATION_BUCKET,
  INSPIRATION_DOMAIN_MAP,
  INSPIRATION_TABLE,
  resolveInspirationFolder,
} from "./inspiration-folders";

const USER_FOLDERS = [
  ["Agriculture", "Agriculture", "agriculture"],
  ["Anniversaire", "Anniversaire", "anniversaire"],
  ["Associations", "Associations", "associations"],
  ["Automobile", "Automobile", "automobile"],
  ["Beauté", "Beaute & Soins", "beaute"],
  ["Business", "Business & Entreprise", "business"],
  ["E-commerce", "E-commerce", "e-commerce"],
  ["Éducation", "Education & Formation", "education"],
  ["Emploi", "Emploi & Recrutement", "emploi"],
  ["Événementiel", "Evenementiel", "evenementiel"],
  ["Finance", "Finance & Fintech", "finance"],
  ["Immobilier", "Immobilier", "immobilier"],
  ["Mariage", "Mariage", "mariage"],
  ["Mode", "Mode & Accessoires", "mode"],
  ["Musique", "Musique", "musique"],
  ["Religion/Culture", "Religion & Culture", "religion-culture"],
  ["Restauration", "Restauration", "restauration"],
  ["Santé", "Sante & Clinique", "sante"],
  ["Services", "Services divers", "services"],
  ["Sport", "Sport", "sport"],
  ["Technologie", "Technologie", "technologie"],
  ["Tourisme", "Tourisme & Voyage", "tourisme"],
] as const;

function walk(dir: string, acc: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".git", ".next"].includes(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

describe("inspiration folder map", () => {
  it("covers the 22 product domains exactly once", () => {
    expect(INSPIRATION_DOMAIN_MAP).toHaveLength(22);
    expect(INSPIRATION_DOMAIN_MAP.map((row) => row.domaine).sort()).toEqual(
      [...DOMAINS].sort(),
    );
    expect(new Set(INSPIRATION_DOMAIN_MAP.map((row) => row.slug)).size).toBe(22);
    expect(INSPIRATION_BUCKET).toBe("inspirations-source");
    expect(INSPIRATION_TABLE).toBe("inspiration_source");
    expect(folderMap.publicServingForbidden).toBe(true);
  });

  it("resolves Isaac folder names including accents and truncated Windows names", () => {
    for (const [folder, domaine, slug] of USER_FOLDERS) {
      const hit = resolveInspirationFolder(folder);
      expect(hit, folder).toBeTruthy();
      expect(hit?.domaine).toBe(domaine);
      expect(hit?.slug).toBe(slug);
    }
    expect(resolveInspirationFolder("Beaut")?.slug).toBe("beaute");
    expect(resolveInspirationFolder("ducation")?.slug).toBe("education");
    expect(resolveInspirationFolder("vnementiel")?.slug).toBe("evenementiel");
    expect(resolveInspirationFolder("Sant")?.slug).toBe("sante");
    expect(resolveInspirationFolder("Religion-Culture")?.slug).toBe("religion-culture");
    expect(resolveInspirationFolder("DossierInconnu")).toBeNull();
  });

  it("keeps the Python uploader aligned with the shared JSON map", () => {
    const script = readFileSync("scripts/upload-inspirations.py", "utf8").split("def run_self_test")[0];
    expect(script).toContain("inspiration-folder-map.json");
    expect(script).toContain("inspirations-source");
    expect(script).toContain("inspiration_source");
    expect(script).toContain("sha256");
    expect(script).not.toMatch(/import PIL|from PIL|Image\.open|thumbnail\(/);
    expect(script).not.toContain("/object/public/");
    expect(script).toMatch(/x-upsert.: .false./);
    expect(script).toContain("aucun appel reseau");
  });
});

describe("inspiration source must stay private", () => {
  it("does not expose the private bucket from any app route or page", () => {
    const files = walk("src").filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (
        file.endsWith("inspiration-folders.ts") ||
        file.endsWith("inspiration-folders.test.ts") ||
        file.endsWith("inspiration-source.ts") ||
        file.endsWith("inspiration-source.test.ts")
      ) {
        continue;
      }
      if (text.includes("/object/public/inspirations-source")) {
        hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });

  it("documents the private bucket and ignores local upload reports", () => {
    const sql = readFileSync("scripts/sql/inspiration_source.sql", "utf8");
    expect(sql).toContain("public = false");
    expect(sql).toContain("revoke all on table public.inspiration_source from anon");
    const gitignore = readFileSync(".gitignore", "utf8");
    expect(gitignore).toContain("storage/private/");
    expect(gitignore).toMatch(/upload-report/);
  });
});
