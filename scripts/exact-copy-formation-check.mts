import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildArtDirection, buildPrompt, createBriefSchema } from "../src/lib/flyermint.ts";
import {
  applyExactCopyRepair,
  exactCopyQcPrompt,
  exactCopyShouldRegenerate,
  EXACT_COPY_MODEL,
  generationProof,
  parseExactCopyQc,
} from "../src/lib/exact-copy.ts";
import { downloadReferenceDataUrl, loadDomainReferences } from "../src/lib/inspiration-source.ts";
import { selectReferenceInDomain } from "../src/lib/reference-select.ts";
import { generateWithRodium, reviewPosterQuality } from "../src/server/rodium.ts";

const brief = createBriefSchema.parse({
  visualType: "Affiche promotionnelle",
  domain: "Education & Formation",
  objective: "Promouvoir une formation",
  targetAudience: "Professionnels",
  title: "Formation Excel",
  format: "affiche_a4",
  creativeFreedom: "copie_exacte",
  colors: [],
  adaptiveData: {},
});

const artifactDir = "/opt/cursor/artifacts";
const sent: Array<{ url: string; model?: string; hasImage?: boolean; promptStarts?: string }> = [];
const originalFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (init?.body && url.includes("/images/generations")) {
    const body = JSON.parse(String(init.body)) as { model?: string; image?: string; prompt?: string };
    sent.push({
      url: url.replace(/\?.*/, ""),
      model: body.model,
      hasImage: typeof body.image === "string" && body.image.startsWith("data:image/"),
      promptStarts: String(body.prompt ?? "").slice(0, 80),
    });
  } else if (url.includes("inspiration_source") || url.includes("_analysis/by-domain")) {
    const parsed = new URL(url);
    sent.push({ url: `${parsed.origin}${parsed.pathname}?${parsed.searchParams.get("domaine") ?? parsed.pathname}` });
  }
  return originalFetch(input, init);
};

const candidates = await loadDomainReferences(brief.domain);
const selection = selectReferenceInDomain({ domain: brief.domain, brief, candidates });
if (!selection.selected) throw new Error("EXACT_COPY_NO_REFERENCE");
if (!selection.selected.storagePath.startsWith("education/")) throw new Error("DOMAIN_LEAK");
if (selection.examined.some((item) => !item.storagePath.startsWith("education/"))) throw new Error("DOMAIN_LEAK");

if (process.env.EXACT_COPY_SELECT_ONLY === "1") {
  console.log(JSON.stringify({
    domain: "FORMATION",
    slug: selection.slug,
    examinedCount: selection.examined.length,
    rejectedOtherDomains: selection.rejectedOtherDomains,
    referenceId: selection.selected.id,
    referencePath: selection.selected.storagePath,
    reason: selection.reason,
    paths: selection.examined.map((item) => item.storagePath),
  }, null, 2));
  process.exit(0);
}

const referenceImageDataUrl = await downloadReferenceDataUrl(selection.selected.storagePath);
const art = buildArtDirection(brief, selection);
let prompt = buildPrompt(brief, art, selection);
if (!prompt.includes("Modify the supplied reference poster.")) throw new Error("PROMPT_NOT_EXACT");
if (prompt.includes("DESIGN LAWS, mandatory")) throw new Error("PROMPT_HAS_RECOMPOSITION_LAWS");

let result = await generateWithRodium({ prompt, brief, referenceImageDataUrl });
let regenerationCount = 0;
let qcRaw = await reviewPosterQuality({
  imageUrl: result.imageUrl,
  referenceImageUrl: referenceImageDataUrl,
  prompt: exactCopyQcPrompt(brief, selection),
});
let qc = parseExactCopyQc(qcRaw);
if (exactCopyShouldRegenerate(qc)) {
  prompt = applyExactCopyRepair(prompt, qc);
  const second = await generateWithRodium({ prompt, brief, referenceImageDataUrl });
  regenerationCount = 1;
  if (second.imageUrl) {
    result = second;
    qcRaw = await reviewPosterQuality({
      imageUrl: result.imageUrl,
      referenceImageUrl: referenceImageDataUrl,
      prompt: exactCopyQcPrompt(brief, selection),
    });
    qc = parseExactCopyQc(qcRaw);
  }
}

const proof = generationProof({
  brief,
  selection,
  model: result.model,
  responseModel: result.responseModel,
  referenceUsed: result.referenceUsed,
  qualityCheck: qc,
  regenerationCount,
});

await mkdir(artifactDir, { recursive: true });
const referenceBytes = Buffer.from(referenceImageDataUrl.split(",")[1] ?? "", "base64");
await writeFile(path.join(artifactDir, "exact-copy-reference.jpg"), referenceBytes);

async function saveResult(url: string) {
  if (url.startsWith("data:")) {
    const bytes = Buffer.from(url.split(",")[1] ?? "", "base64");
    await writeFile(path.join(artifactDir, "exact-copy-result.png"), bytes);
    return;
  }
  const response = await originalFetch(url);
  if (!response.ok) throw new Error("RESULT_DOWNLOAD_FAILED");
  await writeFile(path.join(artifactDir, "exact-copy-result.png"), Buffer.from(await response.arrayBuffer()));
}
await saveResult(result.imageUrl);

const log = {
  domain: "FORMATION",
  domainEnum: proof.domain,
  domainSlug: proof.domainSlug,
  reference: proof.reference,
  referenceId: proof.referenceId,
  referencePath: proof.referencePath,
  selectionReason: proof.selectionReason,
  mode: proof.mode,
  model: proof.model,
  responseModel: proof.responseModel,
  referenceUsed: proof.referenceUsed,
  qualityCheck: proof.qualityCheck,
  regenerationCount: proof.regenerationCount,
  examinedCount: proof.examinedCount,
  examinedPaths: selection.examined.map((item) => item.storagePath),
  requests: sent.filter((row) => row.model || row.url.includes("inspiration") || row.url.includes("education")),
  qcRaw: qcRaw.slice(0, 1200),
};
await writeFile(path.join(artifactDir, "exact-copy-formation-log.json"), JSON.stringify(log, null, 2));
console.log(JSON.stringify({
  domain: log.domain,
  referenceId: log.referenceId,
  referencePath: log.referencePath,
  mode: log.mode,
  model: log.model,
  responseModel: log.responseModel,
  referenceUsed: log.referenceUsed,
  examinedCount: log.examinedCount,
  regenerationCount: log.regenerationCount,
  pass: qc.pass,
  sentModels: sent.map((row) => row.model).filter(Boolean),
}, null, 2));

if (proof.model !== EXACT_COPY_MODEL) throw new Error("WRONG_MODEL");
if (!proof.referenceUsed) throw new Error("REFERENCE_NOT_SENT");
if (sent.some((row) => row.model && row.model !== EXACT_COPY_MODEL)) throw new Error("WRONG_MODEL_SENT");
