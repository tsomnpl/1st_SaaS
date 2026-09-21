import type { CreateBriefInput } from "@/lib/flyermint";
import { dnaHasStructure, dnaPromptBlock, parseCreativeDna, type CreativeDna } from "@/lib/creative-dna";
import { pickIndex, supabaseDomainFor } from "@/lib/inspiration-domains";
import { firstAvailableStyleReference } from "@/lib/visual-references";
import { prisma } from "@/lib/prisma";
import { analyzeStyleReference } from "@/server/rodium";
import {
  bufferToDataUrl,
  downloadInspirationObject,
  listInspirationByDomain,
  type InspirationSourceRow,
} from "@/server/supabase-inspiration";

export type VisualLibraryHit = {
  source: "supabase" | "local" | "none";
  referenceId: string;
  domainKey: string;
  storagePath: string;
  dataUrl: string;
  bytes: number;
  dna: CreativeDna | null;
  principles: string[];
};

const EMPTY_HIT: VisualLibraryHit = {
  source: "none",
  referenceId: "",
  domainKey: "",
  storagePath: "",
  dataUrl: "",
  bytes: 0,
  dna: null,
  principles: [],
};

export async function resolveVisualLibrary(
  brief: CreateBriefInput,
  pathsFromCatalog: string[] = [],
): Promise<VisualLibraryHit> {
  const supabaseHit = await resolveSupabaseReference(brief);
  if (supabaseHit.dataUrl) return supabaseHit;

  const local = firstAvailableStyleReference(pathsFromCatalog);
  if (local?.dataUrl) {
    return {
      ...EMPTY_HIT,
      source: "local",
      referenceId: local.path,
      storagePath: local.path,
      dataUrl: local.dataUrl,
      principles: [
        "A local PDF page extract is attached as a style bitmap.",
        "Keep composition; never copy logos or brand text.",
      ],
    };
  }
  return EMPTY_HIT;
}

async function resolveSupabaseReference(brief: CreateBriefInput): Promise<VisualLibraryHit> {
  const domainKey = supabaseDomainFor(brief.domain);
  if (!domainKey) return EMPTY_HIT;

  let rows: InspirationSourceRow[] = [];
  try {
    rows = await listInspirationByDomain(domainKey);
  } catch {
    return EMPTY_HIT;
  }
  if (!rows.length) return EMPTY_HIT;

  const seed = `${brief.domain}|${brief.visualType}|${brief.title}|${brief.objective}`;
  const selected = rows[pickIndex(seed, rows.length)] ?? rows[0];
  const file = await downloadInspirationObject(selected.storage_path);
  if (!file) return EMPTY_HIT;

  const dataUrl = bufferToDataUrl(file.buffer, file.mime);
  const dna = await loadOrAnalyzeDna(selected, brief.domain, dataUrl);
  const principles = [
    "A real poster from the FlyerMint visual library is attached as the composition model.",
    "Keep layout, human placement, hierarchy, margins and contrast from that image.",
    "Replace names, dates, prices, phones, logos and headlines with the client brief.",
    "Never copy a real brand, celebrity face, or protected copy.",
    dna && dnaHasStructure(dna) ? dnaPromptBlock(dna) : "",
  ].filter(Boolean);

  return {
    source: "supabase",
    referenceId: selected.id,
    domainKey,
    storagePath: selected.storage_path,
    dataUrl,
    bytes: file.bytes,
    dna,
    principles,
  };
}

async function loadOrAnalyzeDna(
  row: InspirationSourceRow,
  appDomain: string,
  dataUrl: string,
): Promise<CreativeDna | null> {
  const storedKey = `supabase:${row.id}`;
  try {
    const cached = await prisma.reference.findFirst({
      where: { imageUrl: storedKey },
    });
    if (cached?.composition) {
      return {
        referenceId: row.id,
        domain: appDomain,
        composition: cached.composition,
        layout: cached.layout ?? "",
        humanPlacement: cached.tags.find((tag) => tag.startsWith("human:"))?.slice(6) ?? "",
        humanRole: cached.tags.find((tag) => tag.startsWith("role:"))?.slice(5) ?? "",
        imageTreatment: cached.imageTreatment ?? "",
        typographyHierarchy: cached.typography ?? "",
        colorPalette: cached.colorPalette ? cached.colorPalette.split(",").map((v) => v.trim()).filter(Boolean) : [],
        contrast: cached.tags.find((tag) => tag.startsWith("contrast:"))?.slice(9) ?? "",
        spacing: cached.tags.find((tag) => tag.startsWith("spacing:"))?.slice(8) ?? "",
        ctaPosition: cached.tags.find((tag) => tag.startsWith("cta:"))?.slice(4) ?? "",
        mood: cached.mood ?? "",
        visualDensity: cached.density ?? "",
        aspectRatio: "3:4",
      };
    }
  } catch {
    // Prisma cache is optional.
  }

  const raw = await analyzeStyleReference({
    imageUrl: dataUrl,
    domain: appDomain,
    referenceId: row.id,
  });
  const dna = parseCreativeDna(raw, { referenceId: row.id, domain: appDomain });
  if (!dnaHasStructure(dna)) return dna.composition ? dna : null;

  try {
    await prisma.reference.create({
      data: {
        domain: appDomain,
        style: dna.mood || "reference",
        composition: dna.composition,
        colorPalette: dna.colorPalette.join(", "),
        typography: dna.typographyHierarchy,
        imageTreatment: dna.imageTreatment,
        layout: dna.layout,
        density: dna.visualDensity,
        mood: dna.mood,
        imageUrl: storedKey,
        tags: [
          `human:${dna.humanPlacement}`,
          `role:${dna.humanRole}`,
          `contrast:${dna.contrast}`,
          `spacing:${dna.spacing}`,
          `cta:${dna.ctaPosition}`,
        ].filter((tag) => !tag.endsWith(":")),
      },
    });
  } catch {
    // Unique collisions or missing table must not block generation.
  }
  return dna;
}
