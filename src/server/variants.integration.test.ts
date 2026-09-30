import { CreditTransactionType, GenerationStatus } from "@prisma/client";
import { afterAll, describe, expect, it, vi } from "vitest";
import { countdownForBrief } from "@/lib/countdown";
import { prisma } from "@/lib/prisma";
import { grantCredits } from "@/server/credits";

const generateWithRodium = vi.hoisted(() => vi.fn());
const reviewPosterQuality = vi.hoisted(() => vi.fn());

vi.mock("@/server/rodium", () => ({
  generateWithRodium,
  reviewPosterQuality,
}));

vi.mock("@/server/mail", () => ({
  notifyAdmin: vi.fn(async () => undefined),
  sendGenerationFailed: vi.fn(async () => undefined),
  sendGenerationSucceeded: vi.fn(async () => undefined),
}));

vi.mock("@/lib/inspiration-source", () => ({
  loadDomainReferences: vi.fn(async () => [
    {
      id: "edu-real",
      domain: "Education & Formation",
      slug: "education",
      storagePath: "education/poster.jpg",
      style: "studio",
      background: "fond",
      texts: "titre",
      visual: "personne",
      palette: ["#111111"],
      analyzed: true,
    },
    {
      id: "event-real",
      domain: "Evenementiel",
      slug: "evenementiel",
      storagePath: "evenementiel/poster.jpg",
      style: "studio",
      background: "fond",
      texts: "titre",
      visual: "personne",
      palette: ["#111111"],
      analyzed: true,
    },
    {
      id: "immo-real",
      domain: "Immobilier",
      slug: "immobilier",
      storagePath: "immobilier/poster.jpg",
      style: "studio",
      background: "fond",
      texts: "titre",
      visual: "personne",
      palette: ["#111111"],
      analyzed: true,
    },
  ]),
  downloadReferenceDataUrl: vi.fn(async () => "data:image/png;base64,abc"),
}));

const prefix = `it_var_${Date.now()}`;
const now = new Date("2026-09-27T12:00:00.000Z");

function brief(extra: Record<string, unknown> = {}) {
  return {
    visualType: "Affiche",
    domain: "Evenementiel",
    objective: "Remplir la salle",
    targetAudience: "Etudiants",
    title: "Soiree campus",
    format: "instagram_post",
    creativeFreedom: "liberte_guidee",
    date: "30 septembre 2026",
    colors: [],
    adaptiveData: {},
    ...extra,
  };
}

describe.sequential("two variants and countdown", () => {
  const createdPlans: string[] = [];

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { clerkUserId: { startsWith: prefix } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);
    if (userIds.length) {
      await prisma.generation.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.generationGroup.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditTransaction.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditBucket.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditAccount.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.payment.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (createdPlans.length) await prisma.plan.deleteMany({ where: { id: { in: createdPlans } } });
    await prisma.seasonalCampaign.updateMany({
      where: { slug: "rentree-scolaire" },
      data: { referenceIds: [] },
    });
    await prisma.$disconnect();
  });

  async function plan(code: string) {
    const existing = await prisma.plan.findUnique({ where: { code } });
    if (existing) return existing;
    const created = await prisma.plan.create({
      data: { code, name: code, priceFcfa: 1, mintAmount: 1, editableExport: code === "PACK_20K" || code === "PACK_25K" },
    });
    createdPlans.push(created.id);
    return created;
  }

  async function user(name: string, mints: number, planCode?: string) {
    const row = await prisma.user.create({
      data: { clerkUserId: `${prefix}_${name}`, email: null, name },
    });
    if (mints > 0) {
      await grantCredits(row.id, mints, CreditTransactionType.FREE_GRANT, { reference: `${prefix}_${name}` }, null);
    }
    if (planCode) {
      const chosen = await plan(planCode);
      await prisma.payment.create({
        data: {
          userId: row.id,
          planId: chosen.id,
          orderId: `${prefix}_${name}`,
          amountFcfa: chosen.priceFcfa,
          status: "COMPLETED",
          creditedAt: new Date(),
        },
      });
    }
    return row;
  }

  it("keeps a normal plan on one variant and stores the server countdown", async () => {
    reviewPosterQuality.mockResolvedValue(
      JSON.stringify({ visible_text: "Soiree campus 30 septembre 2026", same_layout: true }),
    );
    generateWithRodium.mockImplementation(async ({ prompt }: { prompt: string }) => ({
      imageUrl: prompt.includes("VARIANT B") ? "data:image/png;base64,bbb" : "data:image/png;base64,aaa",
      model: "google/gemini-3-pro-image",
      responseModel: "google/gemini-3-pro-image",
      referenceUsed: true,
      rodiCostEstimate: prompt.includes("VARIANT B") ? 7 : 6,
    }));
    const member = await user("normal", 1);
    const { runGeneration } = await import("@/server/generation");
    generateWithRodium.mockClear();
    const result = await runGeneration(member.clerkUserId, brief(), now);
    expect(generateWithRodium).toHaveBeenCalledTimes(1);
    expect(result.groupId).toBeNull();
    expect(result.variants).toHaveLength(1);
    expect(result.countdown).toEqual(countdownForBrief({ date: "30 septembre 2026" }, now));
    const stored = await prisma.generation.findUnique({ where: { id: result.generationId } });
    expect((stored?.artDirection as { countdown?: { label?: string } }).countdown?.label).toBe("Plus que 3 jours");
    expect(stored?.prompt).toContain("CALCULATED COUNTDOWN");
    expect(stored?.prompt).not.toContain("VARIANT B");
  });

  it("refuses a user with no Mint before calling Rodium", async () => {
    const member = await user("broke", 0);
    const { runGeneration } = await import("@/server/generation");
    generateWithRodium.mockClear();
    await expect(runGeneration(member.clerkUserId, brief(), now)).rejects.toThrow("INSUFFICIENT_MINTS");
    expect(generateWithRodium).not.toHaveBeenCalled();
    const account = await prisma.creditAccount.findUnique({ where: { userId: member.id } });
    expect(account?.balance ?? 0).toBe(0);
  });

  it("creates two variants for 20k and 25k, records both costs, and exports the chosen one", async () => {
    const { runGeneration, selectOwnedVariant } = await import("@/server/generation");
    for (const code of ["PACK_20K", "PACK_25K"] as const) {
      const member = await user(code.toLowerCase(), 1, code);
      generateWithRodium.mockClear();
      const result = await runGeneration(member.clerkUserId, brief(), now);
      expect(result.variants.map((item) => item.variant)).toEqual(["A", "B"]);
      expect(result.variants[0]?.rodiCost).toBe(6);
      expect(result.variants[1]?.rodiCost).toBe(7);
      const group = await prisma.generationGroup.findUnique({ where: { id: result.groupId ?? "" } });
      expect(group).toMatchObject({ mintCost: 1, rodiCostA: 6, rodiCostB: 7, rodiCostTotal: 13, selectedGenerationId: result.variants[0]?.id });
      const debits = await prisma.creditTransaction.findMany({
        where: { userId: member.id, type: CreditTransactionType.GENERATION },
      });
      expect(debits).toHaveLength(1);
      expect(debits[0]?.amount).toBe(-1);
      const prompts = generateWithRodium.mock.calls.map((call) => String(call[0].prompt));
      expect(prompts[0]).not.toBe(prompts[1]);
      expect(prompts[0]).toContain("VARIANT A");
      expect(prompts[1]).toContain("VARIANT B");
      const chosen = await selectOwnedVariant(member.clerkUserId, result.variants[1]!.id);
      expect(chosen.selectedGenerationId).toBe(result.variants[1]?.id);
      const exported = await prisma.generation.findFirst({
        where: { id: chosen.selectedGenerationId ?? "", userId: member.id, status: "COMPLETED" },
      });
      expect(exported?.outputUrl).toContain("bbb");
      expect(exported?.variant).toBe("B");
      const stranger = await user(`${code}_other`, 0);
      await expect(selectOwnedVariant(stranger.clerkUserId, result.variants[0]!.id)).rejects.toThrow("NOT_FOUND");
    }
  });

  it("does not open a second pair when regenerating one variant", async () => {
    const member = await user("regen", 2, "PACK_20K");
    const { runGeneration } = await import("@/server/generation");
    const first = await runGeneration(member.clerkUserId, brief(), now);
    generateWithRodium.mockClear();
    const second = await runGeneration(
      member.clerkUserId,
      brief({ regenerateFromId: first.generationId, date: "30 septembre 2026" }),
      new Date("2026-09-28T12:00:00.000Z"),
    );
    expect(generateWithRodium).toHaveBeenCalledTimes(1);
    expect(second.groupId).toBeNull();
    expect(second.countdown?.label).toBe("Plus que 2 jours");
  });

  it("keeps a personal reference inside two limited variants", async () => {
    const member = await user("personal", 1, "PACK_20K");
    const { runGeneration } = await import("@/server/generation");
    generateWithRodium.mockClear();
    await runGeneration(
      member.clerkUserId,
      brief({ personalReferenceUrl: "data:image/png;base64,abc" }),
      now,
    );
    const prompts = generateWithRodium.mock.calls.map((call) => String(call[0].prompt));
    expect(prompts).toHaveLength(2);
    expect(prompts[0]).toContain("personal reference");
    expect(prompts[1]).toContain("personal reference");
    expect(prompts[0]).toContain("Do not invent a new composition");
    expect(prompts[0]).not.toBe(prompts[1]);
  });

  it("refunds once when variant A fails and does not call variant B", async () => {
    const member = await user("faila", 1, "PACK_20K");
    generateWithRodium.mockImplementationOnce(async () => {
      throw new Error("RODIUM_DOWN");
    });
    const { runGeneration } = await import("@/server/generation");
    await expect(runGeneration(member.clerkUserId, brief(), now)).rejects.toThrow("RODIUM_DOWN");
    const rows = await prisma.generation.findMany({ where: { userId: member.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe(GenerationStatus.FAILED);
    const refunds = await prisma.creditTransaction.findMany({
      where: { userId: member.id, type: CreditTransactionType.REFUND },
    });
    expect(refunds).toHaveLength(1);
    const account = await prisma.creditAccount.findUnique({ where: { userId: member.id } });
    expect(account?.balance).toBe(1);
  });

  it("keeps one Mint when two generations race", async () => {
    const member = await user("race", 1);
    generateWithRodium.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
      return {
        imageUrl: "data:image/png;base64,aaa",
        model: "google/gemini-3-pro-image",
        responseModel: "google/gemini-3-pro-image",
        referenceUsed: true,
        rodiCostEstimate: 6,
      };
    });
    const { runGeneration } = await import("@/server/generation");
    const results = await Promise.allSettled([
      runGeneration(member.clerkUserId, brief(), now),
      runGeneration(member.clerkUserId, brief(), now),
    ]);
    expect(results.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((item) => item.status === "rejected")).toHaveLength(1);
    const account = await prisma.creditAccount.findUnique({ where: { userId: member.id } });
    expect(account?.balance).toBe(0);
    const debits = await prisma.creditTransaction.count({
      where: { userId: member.id, type: CreditTransactionType.GENERATION },
    });
    expect(debits).toBe(1);
  });

  it("applies an accepted seasonal theme and records a missing reference", async () => {
    const member = await user("season", 1);
    await prisma.seasonalCampaign.upsert({
      where: { slug: "rentree-scolaire" },
      update: { referenceIds: ["missing-poster", "edu-real"], active: true },
      create: {
        slug: "rentree-scolaire",
        name: "Rentrée scolaire",
        startDate: new Date("2026-09-01T00:00:00.000Z"),
        endDate: new Date("2026-10-15T23:59:59.999Z"),
        markets: ["GLOBAL"],
        domains: ["Education & Formation"],
        styleProfile: { campaign: "rentree-scolaire", mood: "rentree", typography: "lisible", composition: "grille", visualElements: [], forbiddenElements: [] },
        referenceIds: ["missing-poster", "edu-real"],
        active: true,
        priority: 40,
      },
    });
    const { runGeneration } = await import("@/server/generation");
    const accepted = await runGeneration(
      member.clerkUserId,
      brief({
        domain: "Education & Formation",
        market: "TG",
        seasonalSlug: "rentree-scolaire",
        seasonalDecline: false,
      }),
      now,
    );
    const acceptedRow = await prisma.generation.findUnique({ where: { id: accepted.generationId } });
    const note = (acceptedRow?.artDirection as { seasonal?: { accepted?: boolean; usedReferenceIds?: string[]; missingReferenceIds?: string[] } }).seasonal;
    expect(note?.accepted).toBe(true);
    expect(note?.usedReferenceIds).toContain("edu-real");
    expect(note?.missingReferenceIds).toContain("missing-poster");
    expect(acceptedRow?.prompt).toContain("SEASONAL CAMPAIGN rentree-scolaire");

    await grantCredits(member.id, 1, CreditTransactionType.FREE_GRANT, { reference: `${prefix}_season2` }, null);
    const refused = await runGeneration(
      member.clerkUserId,
      brief({
        domain: "Education & Formation",
        market: "TG",
        seasonalDecline: true,
      }),
      now,
    );
    const refusedRow = await prisma.generation.findUnique({ where: { id: refused.generationId } });
    expect((refusedRow?.artDirection as { seasonal?: { accepted?: boolean } }).seasonal?.accepted).toBe(false);
    expect(refusedRow?.prompt).not.toContain("SEASONAL CAMPAIGN");

    await grantCredits(member.id, 1, CreditTransactionType.FREE_GRANT, { reference: `${prefix}_season3` }, null);
    const quiet = await runGeneration(
      member.clerkUserId,
      brief({ domain: "Immobilier", market: "BJ", seasonalSlug: "rentree-scolaire" }),
      now,
    );
    const quietRow = await prisma.generation.findUnique({ where: { id: quiet.generationId } });
    expect((quietRow?.artDirection as { seasonal?: unknown }).seasonal).toBeNull();
  });
});
