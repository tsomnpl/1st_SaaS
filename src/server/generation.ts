import { CreditTransactionType, GenerationStatus, GenerationVariant, Prisma } from "@prisma/client";
import { countdownForBrief, type EventCountdown } from "@/lib/countdown";
import {
  applyExactCopyRepair,
  exactCopyQcPrompt,
  exactCopyShouldRegenerate,
  generationProof,
  isExactCopy,
  judgeExactCopyTranscript,
} from "@/lib/exact-copy";
import {
  buildArtDirection,
  buildPrompt,
  createBriefSchema,
  factsForQc,
  mergeRegeneratedBrief,
  scoreQuality,
  type ArtDirection,
  type CreateBriefInput,
} from "@/lib/flyermint";
import { downloadReferenceDataUrl, loadDomainReferences } from "@/lib/inspiration-source";
import {
  assertPersonalReferenceAccess,
  PERSONAL_REFERENCE_PLAN_CODES,
  personalReferenceSelection,
} from "@/lib/personal-reference";
import { selectReferenceInDomain, type DomainReference, type ReferenceSelection } from "@/lib/reference-select";
import { applyRepair, parseQcReport, qcPrompt, shouldRepair, skippedQcReport } from "@/lib/quality-control";
import type { SeasonalArtNote } from "@/lib/seasonal";
import { TWO_VARIANT_MINT_COST, TWO_VARIANT_PLAN_CODES, variantLayoutInstruction, type VariantLayoutMode } from "@/lib/variants";
import { prisma } from "@/lib/prisma";
import { consumeOneMint, grantCredits } from "@/server/credits";
import { notifyAdmin, sendGenerationFailed, sendGenerationSucceeded } from "@/server/mail";
import { generateWithRodium, reviewPosterQuality } from "@/server/rodium";
import { saveBrandKit } from "@/server/brand-kit";
import { resolveSeasonalForBrief } from "@/server/seasonal";

type RenderedPoster = {
  imageUrl: string;
  model: string;
  responseModel: string | null;
  referenceUsed: boolean;
  rodiCost: number;
  prompt: string;
  qc: unknown;
  repaired: boolean;
  regenerationCount: number;
};

export type VariantView = {
  id: string;
  variant: "A" | "B" | null;
  outputUrl: string | null;
  rodiCost: number | null;
};

export type GenerationResult = {
  generationId: string;
  outputUrl: string | null;
  quality: ReturnType<typeof scoreQuality>;
  artDirection: ArtDirection;
  repaired: boolean;
  groupId: string | null;
  selectedVariantId: string;
  variants: VariantView[];
  countdown: EventCountdown | null;
};

function layoutMode(brief: CreateBriefInput): VariantLayoutMode {
  if (brief.personalReferenceUrl) return "personal";
  if (isExactCopy(brief)) return "exact";
  return "free";
}

function withVariant(ad: ArtDirection, variant: "A" | "B", mode: VariantLayoutMode): ArtDirection {
  const note = variantLayoutInstruction(variant, mode);
  return {
    ...ad,
    composition: `${ad.composition} | ${note}`,
    differentiators: [...ad.differentiators, note],
  };
}

async function renderPoster(input: {
  prompt: string;
  brief: CreateBriefInput;
  selection: ReferenceSelection;
  referenceImageDataUrl?: string;
  exact: boolean;
}): Promise<RenderedPoster> {
  const first = await generateWithRodium({
    prompt: input.prompt,
    brief: input.brief,
    referenceImageDataUrl: input.referenceImageDataUrl,
  });
  if (!first.imageUrl) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");

  let imageUrl = first.imageUrl;
  let model = first.model;
  let responseModel = first.responseModel;
  let referenceUsed = first.referenceUsed;
  let rodiCost = first.rodiCostEstimate;
  let prompt = input.prompt;
  let qc: unknown = skippedQcReport();
  let repaired = false;
  let regenerationCount = 0;

  if (input.exact) {
    const qcRaw = await reviewPosterQuality({
      imageUrl,
      referenceImageUrl: input.referenceImageDataUrl,
      prompt: exactCopyQcPrompt(input.brief, input.selection),
    });
    let exactQc = judgeExactCopyTranscript(input.brief, qcRaw);
    qc = exactQc;
    if (exactCopyShouldRegenerate(exactQc)) {
      prompt = applyExactCopyRepair(prompt, exactQc);
      const second = await generateWithRodium({
        prompt,
        brief: input.brief,
        referenceImageDataUrl: input.referenceImageDataUrl,
      });
      regenerationCount = 1;
      if (second.imageUrl) {
        imageUrl = second.imageUrl;
        model = second.model;
        responseModel = second.responseModel;
        referenceUsed = second.referenceUsed;
        rodiCost = Number((first.rodiCostEstimate + second.rodiCostEstimate).toFixed(3));
        repaired = true;
        const secondQc = await reviewPosterQuality({
          imageUrl,
          referenceImageUrl: input.referenceImageDataUrl,
          prompt: exactCopyQcPrompt(input.brief, input.selection),
        });
        exactQc = judgeExactCopyTranscript(input.brief, secondQc);
        qc = exactQc;
      }
    }
  } else {
    const qcRaw = await reviewPosterQuality({
      imageUrl,
      prompt: qcPrompt(input.brief.title, input.brief.domain, factsForQc(input.brief)),
    });
    if (qcRaw) {
      const report = parseQcReport(qcRaw);
      qc = report;
      if (shouldRepair(report)) {
        prompt = applyRepair(prompt, report);
        const second = await generateWithRodium({ prompt, brief: input.brief });
        regenerationCount = 1;
        if (second.imageUrl) {
          imageUrl = second.imageUrl;
          model = `${first.model}+repair:${second.model}`;
          responseModel = second.responseModel;
          referenceUsed = second.referenceUsed;
          rodiCost = Number((first.rodiCostEstimate + second.rodiCostEstimate).toFixed(3));
          repaired = true;
          const secondQc = await reviewPosterQuality({
            imageUrl,
            prompt: qcPrompt(input.brief.title, input.brief.domain, factsForQc(input.brief)),
          });
          if (secondQc) qc = parseQcReport(secondQc);
        }
      }
    }
  }

  return { imageUrl, model, responseModel, referenceUsed, rodiCost, prompt, qc, repaired, regenerationCount };
}

async function refundGenerationOnce(userId: string, generationId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.generation.update({
      where: { id: generationId },
      data: { status: GenerationStatus.FAILED },
    });
    const already = await tx.creditTransaction.findFirst({
      where: { userId, type: CreditTransactionType.REFUND, reference: generationId },
    });
    if (already) return;
    await grantCredits(
      userId,
      1,
      CreditTransactionType.REFUND,
      {
        tx,
        reference: generationId,
        metadata: { reason: "RODIUM_FAILURE_REFUND" },
      },
      null,
    );
  });
}

function applySeasonalReference(
  selection: ReferenceSelection,
  note: SeasonalArtNote | null,
  candidates: DomainReference[],
  personal: boolean,
) {
  if (!note?.accepted) return { selection, seasonal: note };
  const pinned = personal
    ? undefined
    : candidates.find((item) => note.usedReferenceIds.includes(item.id) && item.domain === selection.domain);
  const next = pinned
    ? {
        ...selection,
        selected: pinned,
        reason: `${selection.reason} Campagne ${note.slug}.`,
      }
    : selection;
  const actualId = next.selected?.id;
  const used = actualId && !note.usedReferenceIds.includes(actualId)
    ? [...note.usedReferenceIds, actualId]
    : note.usedReferenceIds;
  return { selection: next, seasonal: { ...note, usedReferenceIds: used } };
}

async function prepareBrief(userId: string, unsafeInput: unknown, now: Date) {
  const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.status === "SUSPENDED") throw new Error("ACCOUNT_SUSPENDED");

  let brief = createBriefSchema.parse(unsafeInput);
  if (brief.regenerateFromId) {
    const previous = await prisma.generation.findFirst({
      where: { id: brief.regenerateFromId, userId: user.id, status: GenerationStatus.COMPLETED },
    });
    if (previous) {
      const parsed = createBriefSchema.safeParse(previous.brief);
      if (parsed.success) brief = mergeRegeneratedBrief(parsed.data, brief);
    }
  }
  brief = { ...brief, creativeFreedom: "copie_exacte" };
  if (brief.personalReferenceUrl) {
    assertPersonalReferenceAccess(await userHasPersonalReference(user.id), brief.personalReferenceUrl);
  }

  const candidates = brief.personalReferenceUrl ? [] : await loadDomainReferences(brief.domain);
  let selection = brief.personalReferenceUrl
    ? personalReferenceSelection(brief.domain)
    : selectReferenceInDomain({ domain: brief.domain, brief, candidates });
  const seasonal = await resolveSeasonalForBrief({
    domain: brief.domain,
    market: brief.market,
    slug: brief.seasonalSlug,
    decline: brief.seasonalDecline,
    availableReferenceIds: candidates.map((item) => item.id),
    now,
  }).catch(() => null);
  const applied = applySeasonalReference(selection, seasonal, candidates, Boolean(brief.personalReferenceUrl));
  selection = applied.selection;

  const exact = isExactCopy(brief);
  if (exact && !selection.selected) throw new Error("EXACT_COPY_NO_REFERENCE");
  const referenceImageDataUrl = brief.personalReferenceUrl
    ? brief.personalReferenceUrl
    : exact && selection.selected
      ? await downloadReferenceDataUrl(selection.selected.storagePath)
      : undefined;
  if (exact && !referenceImageDataUrl) throw new Error("EXACT_COPY_REFERENCE_MISSING");

  const countdown = countdownForBrief(brief, now);
  const artDirection = buildArtDirection(brief, selection, { countdown, seasonal: applied.seasonal });
  const pair = !brief.regenerateFromId && (await userHasTwoVariants(user.id));
  return { user, brief, selection, referenceImageDataUrl, exact, artDirection, countdown, pair };
}

async function notifyFailure(email: string | null, title: string, generationId: string) {
  if (!email) return;
  await sendGenerationFailed({ to: email, title, generationId });
  await notifyAdmin(
    `Génération non aboutie, ${generationId}`,
    `La génération ${generationId} a échoué. Le Mint a été recrédité.`,
    email,
  );
}

function rememberBrandLater(userId: string, brief: CreateBriefInput) {
  if (!brief.rememberBrand) return;
  return saveBrandKit(userId, { colors: brief.colors.slice(0, 3), logoUrl: brief.logoUrl });
}

export async function runGeneration(clerkUserId: string, unsafeInput: unknown, now = new Date()): Promise<GenerationResult> {
  const prepared = await prepareBrief(clerkUserId, unsafeInput, now);
  if (prepared.pair) return runVariantPair(prepared);
  return runSingle(prepared);
}

async function runSingle(prepared: Awaited<ReturnType<typeof prepareBrief>>): Promise<GenerationResult> {
  const { user, brief, selection, referenceImageDataUrl, exact, artDirection } = prepared;
  const prompt = buildPrompt(brief, artDirection, selection);
  const qualityScores = scoreQuality(brief, prompt);
  const generation = await prisma.$transaction(async (tx) => {
    await consumeOneMint(user.id, {
      tx,
      reference: "GENERATION_LOCK",
      metadata: { domain: brief.domain, format: brief.format },
    });
    return tx.generation.create({
      data: {
        userId: user.id,
        mintCost: 1,
        brief: brief as Prisma.JsonObject,
        artDirection: artDirection as unknown as Prisma.InputJsonValue,
        prompt,
        model: "pending",
        status: GenerationStatus.PENDING,
      },
    });
  });

  try {
    const rendered = await renderPoster({ prompt, brief, selection, referenceImageDataUrl, exact });
    const proof = generationProof({
      brief,
      selection,
      model: rendered.model,
      responseModel: rendered.responseModel,
      referenceUsed: rendered.referenceUsed,
      qualityCheck: rendered.qc,
      regenerationCount: rendered.regenerationCount,
    });
    await rememberBrandLater(user.id, brief);
    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        prompt: rendered.prompt,
        model: rendered.model,
        rodiCost: rendered.rodiCost,
        outputUrl: rendered.imageUrl,
        qualityScore: qualityScores.overall_score,
        qualityDetails: {
          ...qualityScores,
          qc: rendered.qc,
          repaired: rendered.repaired,
          durationMs: Date.now() - generation.createdAt.getTime(),
          checks: exact
            ? ["exact_copy", "domain_lock", "reference_image", "qc_reference_vs_result"]
            : ["human_required", "art_direction", "qc_vision", "domain_lock"],
          generationLog: proof,
          countdown: artDirection.countdown,
        } as Prisma.InputJsonValue,
        status: GenerationStatus.COMPLETED,
      },
    });
    if (user.email) {
      await sendGenerationSucceeded({ to: user.email, title: brief.title, generationId: updated.id });
    }
    return {
      generationId: updated.id,
      outputUrl: updated.outputUrl,
      quality: qualityScores,
      artDirection,
      repaired: rendered.repaired,
      groupId: null,
      selectedVariantId: updated.id,
      variants: [{ id: updated.id, variant: null, outputUrl: updated.outputUrl, rodiCost: updated.rodiCost }],
      countdown: artDirection.countdown,
    };
  } catch (error) {
    await refundGenerationOnce(user.id, generation.id);
    await notifyFailure(user.email, brief.title, generation.id);
    throw error;
  }
}

async function runVariantPair(prepared: Awaited<ReturnType<typeof prepareBrief>>): Promise<GenerationResult> {
  const { user, brief, selection, referenceImageDataUrl, exact, artDirection } = prepared;
  const mode = layoutMode(brief);
  const directionA = withVariant(artDirection, "A", mode);
  const promptA = `${buildPrompt(brief, directionA, selection)}\n${variantLayoutInstruction("A", mode)}`;
  const qualityScores = scoreQuality(brief, promptA);

  const opened = await prisma.$transaction(async (tx) => {
    await consumeOneMint(user.id, {
      tx,
      reference: "GENERATION_LOCK",
      metadata: { domain: brief.domain, format: brief.format, variants: 2, mintCost: TWO_VARIANT_MINT_COST },
    });
    const group = await tx.generationGroup.create({
      data: { userId: user.id, mintCost: TWO_VARIANT_MINT_COST },
    });
    const generation = await tx.generation.create({
      data: {
        userId: user.id,
        mintCost: TWO_VARIANT_MINT_COST,
        brief: brief as Prisma.JsonObject,
        artDirection: directionA as unknown as Prisma.InputJsonValue,
        prompt: promptA,
        model: "pending",
        status: GenerationStatus.PENDING,
        groupId: group.id,
        variant: GenerationVariant.A,
      },
    });
    return { group, generation };
  });

  let renderedA: RenderedPoster;
  try {
    renderedA = await renderPoster({ prompt: promptA, brief, selection, referenceImageDataUrl, exact });
  } catch (error) {
    await refundGenerationOnce(user.id, opened.generation.id);
    await notifyFailure(user.email, brief.title, opened.generation.id);
    throw error;
  }

  const savedA = await prisma.generation.update({
    where: { id: opened.generation.id },
    data: {
      prompt: renderedA.prompt,
      model: renderedA.model,
      rodiCost: renderedA.rodiCost,
      outputUrl: renderedA.imageUrl,
      qualityScore: qualityScores.overall_score,
      qualityDetails: variantQuality(qualityScores, renderedA, exact, artDirection.countdown),
      status: GenerationStatus.COMPLETED,
    },
  });

  const directionB = withVariant(artDirection, "B", mode);
  const promptB = `${buildPrompt(brief, directionB, selection)}\n${variantLayoutInstruction("B", mode)}`;
  const generationB = await prisma.generation.create({
    data: {
      userId: user.id,
      mintCost: 0,
      brief: brief as Prisma.JsonObject,
      artDirection: directionB as unknown as Prisma.InputJsonValue,
      prompt: promptB,
      model: "pending",
      status: GenerationStatus.PENDING,
      groupId: opened.group.id,
      variant: GenerationVariant.B,
    },
  });

  try {
    const renderedB = await renderPoster({ prompt: promptB, brief, selection, referenceImageDataUrl, exact });
    const savedB = await prisma.generation.update({
      where: { id: generationB.id },
      data: {
        prompt: renderedB.prompt,
        model: renderedB.model,
        rodiCost: renderedB.rodiCost,
        outputUrl: renderedB.imageUrl,
        qualityScore: qualityScores.overall_score,
        qualityDetails: variantQuality(qualityScores, renderedB, exact, artDirection.countdown),
        status: GenerationStatus.COMPLETED,
      },
    });
    await prisma.generationGroup.update({
      where: { id: opened.group.id },
      data: {
        selectedGenerationId: savedA.id,
        rodiCostA: savedA.rodiCost,
        rodiCostB: savedB.rodiCost,
        rodiCostTotal: Number(((savedA.rodiCost ?? 0) + (savedB.rodiCost ?? 0)).toFixed(3)),
      },
    });
    await rememberBrandLater(user.id, brief);
    if (user.email) {
      await sendGenerationSucceeded({ to: user.email, title: brief.title, generationId: savedA.id });
    }
    return pairResult(savedA, savedB, opened.group.id, qualityScores, directionA, renderedA.repaired || renderedB.repaired);
  } catch {
    await prisma.generation.update({
      where: { id: generationB.id },
      data: { status: GenerationStatus.FAILED },
    });
    await prisma.generationGroup.update({
      where: { id: opened.group.id },
      data: {
        selectedGenerationId: savedA.id,
        rodiCostA: savedA.rodiCost,
        rodiCostTotal: savedA.rodiCost,
      },
    });
    return pairResult(
      savedA,
      { id: generationB.id, outputUrl: null, rodiCost: null },
      opened.group.id,
      qualityScores,
      directionA,
      renderedA.repaired,
    );
  }
}

function variantQuality(
  qualityScores: ReturnType<typeof scoreQuality>,
  rendered: RenderedPoster,
  exact: boolean,
  countdown: EventCountdown | null,
) {
  return {
    ...qualityScores,
    qc: rendered.qc,
    repaired: rendered.repaired,
    checks: exact ? ["exact_copy", "variant_pair"] : ["variant_pair"],
    countdown,
  } as Prisma.InputJsonValue;
}

function pairResult(
  savedA: { id: string; outputUrl: string | null; rodiCost: number | null },
  savedB: { id: string; outputUrl: string | null; rodiCost: number | null },
  groupId: string,
  quality: ReturnType<typeof scoreQuality>,
  artDirection: ArtDirection,
  repaired: boolean,
): GenerationResult {
  return {
    generationId: savedA.id,
    outputUrl: savedA.outputUrl,
    quality,
    artDirection,
    repaired,
    groupId,
    selectedVariantId: savedA.id,
    variants: [
      { id: savedA.id, variant: "A", outputUrl: savedA.outputUrl, rodiCost: savedA.rodiCost },
      { id: savedB.id, variant: "B", outputUrl: savedB.outputUrl, rodiCost: savedB.rodiCost },
    ],
    countdown: artDirection.countdown,
  };
}

export async function selectOwnedVariant(clerkUserId: string, generationId: string) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) throw new Error("USER_NOT_FOUND");
  const generation = await prisma.generation.findFirst({
    where: { id: generationId, userId: user.id },
  });
  if (!generation?.groupId) throw new Error("NOT_FOUND");
  const group = await prisma.generationGroup.findFirst({
    where: { id: generation.groupId, userId: user.id },
  });
  if (!group) throw new Error("NOT_FOUND");
  return prisma.generationGroup.update({
    where: { id: group.id },
    data: { selectedGenerationId: generation.id },
  });
}

export async function userHasPersonalReference(userId: string) {
  const paid = await prisma.payment.findFirst({
    where: {
      userId,
      status: "COMPLETED",
      plan: { code: { in: [...PERSONAL_REFERENCE_PLAN_CODES] } },
    },
    select: { id: true },
  });
  return Boolean(paid);
}

export async function userHasTwoVariants(userId: string) {
  const paid = await prisma.payment.findFirst({
    where: {
      userId,
      status: "COMPLETED",
      plan: { code: { in: [...TWO_VARIANT_PLAN_CODES] } },
    },
    select: { id: true },
  });
  return Boolean(paid);
}

export async function userHasEditableExport(userId: string) {
  const paid = await prisma.payment.findFirst({
    where: {
      userId,
      status: "COMPLETED",
      plan: { editableExport: true },
    },
  });
  return Boolean(paid);
}

export type { CreateBriefInput };
