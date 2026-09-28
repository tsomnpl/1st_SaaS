import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildArtDirection, buildPrompt, createBriefSchema, type CreateBriefInput } from "../src/lib/flyermint.ts";
import {
  applyExactCopyRepair,
  exactCopyQcPrompt,
  exactCopyShouldRegenerate,
  EXACT_COPY_MODEL,
  judgeExactCopyTranscript,
} from "../src/lib/exact-copy.ts";
import { downloadReferenceDataUrl, loadDomainReferences } from "../src/lib/inspiration-source.ts";
import { selectReferenceInDomain } from "../src/lib/reference-select.ts";
import { generateWithRodium, reviewPosterQuality } from "../src/server/rodium.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/creations");
const ARTIFACTS = "/opt/cursor/artifacts";

const JOBS: Array<{ file: string; brief: CreateBriefInput }> = [
  {
    file: "cover-sport.webp",
    brief: createBriefSchema.parse({
      visualType: "Affiche événement",
      domain: "Sport",
      objective: "Promouvoir une course",
      targetAudience: "Jeunes coureurs",
      title: "SPRINT 10K",
      subtitle: "Édition jeune",
      date: "Samedi",
      time: "7h",
      location: "Corniche",
      price: "2 000 FCFA",
      cta: "Je m'inscris",
      format: "affiche_a4",
      creativeFreedom: "copie_exacte",
      colors: [],
      adaptiveData: {},
    }),
  },
  {
    file: "cover-mode.webp",
    brief: createBriefSchema.parse({
      visualType: "Affiche promotionnelle",
      domain: "Mode & Accessoires",
      objective: "Promouvoir une collection",
      targetAudience: "Jeunes",
      title: "LOOK NEUF",
      subtitle: "Collection nuit",
      description: "Édition limitée",
      cta: "Voir le look",
      format: "affiche_a4",
      creativeFreedom: "copie_exacte",
      colors: [],
      adaptiveData: {},
    }),
  },
  {
    file: "cover-musique.webp",
    brief: createBriefSchema.parse({
      visualType: "Affiche événement",
      domain: "Musique",
      objective: "Promouvoir un concert",
      targetAudience: "Jeunes",
      title: "SESSION LIVE",
      subtitle: "Guitare et voix",
      date: "Vendredi",
      time: "21h",
      location: "Plateau",
      cta: "Prends ta place",
      format: "affiche_a4",
      creativeFreedom: "copie_exacte",
      colors: [],
      adaptiveData: {},
    }),
  },
];

const originalFetch = globalThis.fetch.bind(globalThis);
const sentModels: string[] = [];
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (init?.body && url.includes("/images/generations")) {
    const body = JSON.parse(String(init.body)) as { model?: string; image?: string };
    sentModels.push(String(body.model ?? ""));
    if (body.model !== EXACT_COPY_MODEL || typeof body.image !== "string" || !body.image.startsWith("data:image/")) {
      throw new Error("EXACT_COPY_REQUEST_INVALID");
    }
  }
  return originalFetch(input, init);
};

async function saveWebp(imageUrl: string, file: string) {
  const sharp = (await import("sharp")).default;
  const buffer = imageUrl.startsWith("data:")
    ? Buffer.from(imageUrl.split(",")[1] ?? "", "base64")
    : Buffer.from(await (await originalFetch(imageUrl)).arrayBuffer());
  const web = await sharp(buffer).rotate().resize({ width: 896, height: 1200, fit: "cover" }).webp({ quality: 82 }).toBuffer();
  await mkdir(OUT, { recursive: true });
  await mkdir(ARTIFACTS, { recursive: true });
  await writeFile(path.join(OUT, file), web);
  await writeFile(path.join(ARTIFACTS, file), web);
}

const report: unknown[] = [];

for (const job of JOBS) {
  const candidates = await loadDomainReferences(job.brief.domain);
  const selection = selectReferenceInDomain({ domain: job.brief.domain, brief: job.brief, candidates });
  if (!selection.selected) throw new Error(`NO_REFERENCE_${job.brief.domain}`);
  if (selection.examined.some((item) => item.slug !== selection.slug)) throw new Error(`DOMAIN_LEAK_${job.brief.domain}`);
  if (process.env.EXACT_COPY_SELECT_ONLY === "1") {
    report.push({
      file: job.file,
      domain: job.brief.domain,
      slug: selection.slug,
      examinedCount: selection.examined.length,
      referenceId: selection.selected.id,
      referencePath: selection.selected.storagePath,
      reason: selection.reason,
    });
    continue;
  }

  const referenceImageDataUrl = await downloadReferenceDataUrl(selection.selected.storagePath);
  const referenceBytes = Buffer.from(referenceImageDataUrl.split(",")[1] ?? "", "base64");
  await mkdir(ARTIFACTS, { recursive: true });
  await writeFile(path.join(ARTIFACTS, `${job.file}.reference.jpg`), referenceBytes);

  let prompt = buildPrompt(job.brief, buildArtDirection(job.brief, selection), selection);
  if (!prompt.includes("Modify the supplied reference poster.")) throw new Error("PROMPT_NOT_EXACT");
  if (prompt.includes("DESIGN LAWS, mandatory")) throw new Error("PROMPT_HAS_RECOMPOSITION_LAWS");

  let result = await generateWithRodium({ prompt, brief: job.brief, referenceImageDataUrl });
  let regenerationCount = 0;
  let qcRaw = await reviewPosterQuality({
    imageUrl: result.imageUrl,
    referenceImageUrl: referenceImageDataUrl,
    prompt: exactCopyQcPrompt(job.brief, selection),
  });
  let qc = judgeExactCopyTranscript(job.brief, qcRaw);
  if (exactCopyShouldRegenerate(qc)) {
    prompt = applyExactCopyRepair(prompt, qc);
    const second = await generateWithRodium({ prompt, brief: job.brief, referenceImageDataUrl });
    regenerationCount = 1;
    if (second.imageUrl) {
      result = second;
      qcRaw = await reviewPosterQuality({
        imageUrl: result.imageUrl,
        referenceImageUrl: referenceImageDataUrl,
        prompt: exactCopyQcPrompt(job.brief, selection),
      });
      qc = judgeExactCopyTranscript(job.brief, qcRaw);
    }
  }

  await saveWebp(result.imageUrl, job.file);
  report.push({
    file: job.file,
    domain: job.brief.domain,
    domainSlug: selection.slug,
    referenceId: selection.selected.id,
    referencePath: selection.selected.storagePath,
    reason: selection.reason,
    mode: "EXACT_COPY",
    model: result.model,
    responseModel: result.responseModel,
    referenceUsed: result.referenceUsed,
    examinedCount: selection.examined.length,
    regenerationCount,
    qualityCheck: qc,
    qcRaw: qcRaw.slice(0, 500),
  });
  if (result.model !== EXACT_COPY_MODEL || !result.referenceUsed) throw new Error(`MODEL_${job.file}`);
}

await writeFile(path.join(ARTIFACTS, "exact-copy-cover-log.json"), JSON.stringify({ sentModels, report }, null, 2));
console.log(JSON.stringify({ sentModels, report }, null, 2));
