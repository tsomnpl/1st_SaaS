import folderMap from "./inspiration-folder-map.json";
import { DOMAINS } from "@/lib/domains";

export const INSPIRATION_BUCKET = folderMap.bucket;
export const INSPIRATION_TABLE = folderMap.table;

export type InspirationDomainMap = {
  domaine: (typeof DOMAINS)[number];
  slug: string;
  aliases: string[];
};

export const INSPIRATION_DOMAIN_MAP: InspirationDomainMap[] = folderMap.domains.map((row) => ({
  domaine: row.domaine as (typeof DOMAINS)[number],
  slug: row.slug,
  aliases: row.aliases,
}));

export function normalizeFolderName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[&/\\_+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function variants(value: string) {
  return new Set([
    value,
    value.replace(/ /g, "-"),
    value.replace(/ /g, ""),
    value.replace(/-/g, " "),
  ]);
}

const ALIAS_INDEX = new Map<string, InspirationDomainMap>();
for (const row of INSPIRATION_DOMAIN_MAP) {
  for (const alias of [row.slug, row.domaine, ...row.aliases]) {
    for (const key of variants(normalizeFolderName(alias))) {
      ALIAS_INDEX.set(key, row);
    }
  }
}

export function resolveInspirationFolder(folderName: string) {
  const normalized = normalizeFolderName(folderName);
  for (const key of variants(normalized)) {
    const hit = ALIAS_INDEX.get(key);
    if (hit) return hit;
  }
  return null;
}

export function slugForDomain(domaine: string) {
  return INSPIRATION_DOMAIN_MAP.find((row) => row.domaine === domaine)?.slug ?? null;
}
