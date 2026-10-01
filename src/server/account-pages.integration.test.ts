import { afterAll, expect, it, vi } from "vitest";
import { isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { prisma } from "@/lib/prisma";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => null,
}));

const clerkUserId = `page_check_${Date.now()}`;

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    requireAuth: async () => clerkUserId,
  };
});

let userId = "";

afterAll(async () => {
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { clerkUserId } });
  const id = user?.id;
  if (id) {
    await prisma.generation.deleteMany({ where: { userId: id } });
    await prisma.creditTransaction.deleteMany({ where: { userId: id } });
    await prisma.creditBucket.deleteMany({ where: { userId: id } });
    await prisma.creditAccount.deleteMany({ where: { userId: id } });
    await prisma.referral.deleteMany({ where: { OR: [{ referrerUserId: id }, { referredUserId: id }] } });
    await prisma.user.deleteMany({ where: { id } });
  }
  await prisma.$disconnect();
});

it("renders dashboard, history, and profile for a signed-in account", async () => {
  const { default: DashboardPage } = await import("@/app/dashboard/page");
  const { default: HistoryPage } = await import("@/app/history/page");
  const { default: ProfilePage } = await import("@/app/profile/page");

  const dashboard = renderToStaticMarkup(await DashboardPage());
  const history = renderToStaticMarkup(await HistoryPage());
  const profile = await ProfilePage();
  expect(dashboard).not.toContain("n’a pas pu s’ouvrir");
  expect(history).toContain("Historique");
  expect(renderToStaticMarkup(profile)).toContain("Profil");
  const user = await prisma.user.findUniqueOrThrow({ where: { clerkUserId } });
  userId = user.id;

  await prisma.generation.create({
    data: {
      userId,
      brief: { title: "Mariage Awa", domain: "mariage" },
      artDirection: {},
      prompt: "check",
      model: "check",
      status: "COMPLETED",
      outputUrl: "https://example.com/poster.png",
    },
  });

  const dashboardAgain = renderToStaticMarkup(await DashboardPage());
  const historyMarkup = renderToStaticMarkup(await HistoryPage());
  expect(dashboardAgain).toContain("Mariage Awa");
  expect(dashboardAgain).toContain("Mint");
  expect(historyMarkup).toContain("Mariage Awa");
  expect(historyMarkup).toContain("https://example.com/poster.png");
  expect(isValidElement(profile)).toBe(true);
  expect(renderToStaticMarkup(profile)).toContain("Profil");
  expect(renderToStaticMarkup(profile)).toContain("Solde");
}, 20000);
