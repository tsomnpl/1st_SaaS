import type { CreateBriefInput } from "@/lib/flyermint";
import { dnaHasStructure, dnaPromptBlock, parseCreativeDna, type CreativeDna } from "@/lib/creative-dna";
import { supabaseDomainFor } from "@/lib/inspiration-domains";
import {
  parseReferenceAnalysis,
  rankDomainReferences,
  type ReferenceAnalysis,
  type ReferenceCandidate,
} from "@/lib/reference-selection";
import { firstAvailableStyleReference } from "@/lib/visual-references";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeReferenceFull, analyzeStyleReference } from "@/server/rodium";
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
  analysis: ReferenceAnalysis | null;
  selection: {
    domainKey: string;
    candidates: number;
    analyzed: number;
    score: number;
    reason: string;
    runnersUp: Array<{ id: string; score: number }>;
  } | null;
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
  analysis: null,
  selection: null,
};

const RUNTIME_ANALYSIS_LIMIT = 4;

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

/** The folder of the domain chosen by the user is the only search space; the brief ranks references inside it. */
async function resolveSupabaseReference(brief: CreateBriefInput): Promise<VisualLibraryHit> {
  const domainKey = supabaseDomainFor(brief.domain);
  if (!domainKey) return EMPTY_HIT;
  let rows: InspirationSourceRow[] = [];
  try {
    rows = await listInspirationByDomain(domainKey, 80);
  } catch {
    rows = [];
  }
  if (!rows.length) return EMPTY_HIT;

  const analyses = await loadDomainAnalyses(rows);
  const missing = rows.filter((row) => !analyses.has(row.id)).slice(0, RUNTIME_ANALYSIS_LIMIT);
  await Promise.all(
    missing.map(async (row) => {
      const analysis = await indexInspirationRow(row, brief.domain).catch(() => null);
      if (analysis) analyses.set(row.id, analysis);
    }),
  );

  const candidates: ReferenceCandidate[] = rows.map((row) => ({
    id: row.id,
    storagePath: row.storage_path,
    analysis: analyses.get(row.id) ?? null,
  }));
  const ranked = rankDomainReferences(brief, candidates);
  for (const choice of ranked) {
    const file = await downloadInspirationObject(choice.storagePath);
    if (!file) continue;
    const row = rows.find((item) => item.id === choice.id)!;
    const dataUrl = bufferToDataUrl(file.buffer, file.mime);
    const dna = await loadOrAnalyzeDna(row, brief.domain, dataUrl);
    const principles = [
      "A real poster from the FlyerMint visual library (domain folder chosen by the client) is attached as the composition model.",
      dna && dnaHasStructure(dna) ? dnaPromptBlock(dna) : "",
    ].filter(Boolean);
    return {
      source: "supabase",
      referenceId: row.id,
      domainKey,
      storagePath: row.storage_path,
      dataUrl,
      bytes: file.bytes,
      dna,
      principles,
      analysis: choice.analysis,
      selection: {
        domainKey,
        candidates: rows.length,
        analyzed: candidates.filter((item) => item.analysis).length,
        score: choice.score,
        reason: choice.reason,
        runnersUp: ranked.filter((item) => item.id !== choice.id).slice(0, 3).map((item) => ({ id: item.id, score: item.score })),
      },
    };
  }
  return EMPTY_HIT;
}

async function loadDomainAnalyses(rows: InspirationSourceRow[]) {
  const map = new Map<string, ReferenceAnalysis>();
  try {
    const cached = await prisma.reference.findMany({
      where: { imageUrl: { in: rows.map((row) => `supabase:${row.id}`) } },
      select: { imageUrl: true, analysis: true },
    });
    for (const row of cached) {
      const analysis = parseReferenceAnalysis(row.analysis);
      if (analysis && row.imageUrl) map.set(row.imageUrl.slice("supabase:".length), analysis);
    }
  } catch {
    // Cache is optional; unanalyzed references rank last.
  }
  return map;
}

/** Analyzes one library image and stores DNA + analysis in the existing Reference cache row. */
export async function indexInspirationRow(row: InspirationSourceRow, appDomain: string, dataUrlIn?: string) {
  let dataUrl = dataUrlIn;
  if (!dataUrl) {
    const file = await downloadInspirationObject(row.storage_path);
    if (!file) return null;
    dataUrl = bufferToDataUrl(file.buffer, file.mime);
  }
  const raw = await analyzeReferenceFull({ imageUrl: dataUrl, domain: appDomain, referenceId: row.id });
  const analysis = parseReferenceAnalysis(raw);
  if (!analysis) return null;
  const dna = parseCreativeDna(raw, { referenceId: row.id, domain: appDomain });
  const storedKey = `supabase:${row.id}`;
  const data = {
    domain: appDomain,
    style: dna.mood || "reference",
    composition: dna.composition || analysis.structureSummary,
    colorPalette: dna.colorPalette.join(", "),
    typography: dna.typographyHierarchy,
    imageTreatment: dna.imageTreatment,
    layout: dna.layout,
    density: dna.visualDensity,
    mood: dna.mood,
    imageUrl: storedKey,
    tags: dnaTags(dna),
    analysis: analysis as unknown as Prisma.InputJsonValue,
  };
  const existing = await prisma.reference.findFirst({ where: { imageUrl: storedKey }, select: { id: true } });
  if (existing) await prisma.reference.update({ where: { id: existing.id }, data });
  else await prisma.reference.create({ data });
  return analysis;
}

/** Client-owned reference: analyzed for this generation only, never written to the library cache. */
export async function analyzePersonalReference(dataUrl: string, appDomain: string) {
  const raw = await analyzeReferenceFull({ imageUrl: dataUrl, domain: appDomain, referenceId: "personal" });
  return parseReferenceAnalysis(raw);
}

function dnaTags(dna: CreativeDna) {
  return [
    `human:${dna.humanPlacement}`,
    `role:${dna.humanRole}`,
    `contrast:${dna.contrast}`,
    `spacing:${dna.spacing}`,
    `cta:${dna.ctaPosition}`,
    `bg:${dna.background}`,
    `scale:${dna.subjectScale}`,
    `text:${dna.textPosition}`,
    `title:${dna.titleHierarchy}`,
    `white:${dna.whiteSpace}`,
    `margins:${dna.margins}`,
    `safe:${dna.safeZone}`,
    `price:${dna.pricePosition}`,
  ].filter((tag) => !tag.endsWith(":"));
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
      const tag = (prefix: string) => cached.tags.find((item) => item.startsWith(prefix))?.slice(prefix.length) ?? "";
      return {
        referenceId: row.id,
        domain: appDomain,
        background: tag("bg:"),
        composition: cached.composition,
        layout: cached.layout ?? "",
        humanPlacement: tag("human:"),
        subjectScale: tag("scale:"),
        textPosition: tag("text:"),
        titleHierarchy: tag("title:"),
        humanRole: tag("role:"),
        imageTreatment: cached.imageTreatment ?? "",
        typographyHierarchy: cached.typography ?? "",
        colorPalette: cached.colorPalette ? cached.colorPalette.split(",").map((v) => v.trim()).filter(Boolean) : [],
        contrast: tag("contrast:"),
        spacing: tag("spacing:"),
        whiteSpace: tag("white:"),
        margins: tag("margins:"),
        safeZone: tag("safe:"),
        ctaPosition: tag("cta:"),
        pricePosition: tag("price:"),
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
          `bg:${dna.background}`,
          `scale:${dna.subjectScale}`,
          `text:${dna.textPosition}`,
          `title:${dna.titleHierarchy}`,
          `white:${dna.whiteSpace}`,
          `margins:${dna.margins}`,
          `safe:${dna.safeZone}`,
          `price:${dna.pricePosition}`,
        ].filter((tag) => !tag.endsWith(":")),
      },
    });
  } catch {
    // Unique collisions or missing table must not block generation.
  }
  return dna;
}
