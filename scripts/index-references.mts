/**
 * Indexes the real Supabase library (bucket inspirations-source, table inspiration_source):
 * one vision analysis per image, stored in Reference.analysis. Already indexed images are skipped.
 * Usage: npx tsx scripts/index-references.mts [domainKey ...]
 */
import { prisma } from "@/lib/prisma";
import { SUPABASE_DOMAIN_BY_APP } from "@/lib/inspiration-domains";
import { listInspirationByDomain } from "@/server/supabase-inspiration";
import { indexInspirationRow } from "@/server/visual-library";

const appByKey = Object.fromEntries(Object.entries(SUPABASE_DOMAIN_BY_APP).map(([app, key]) => [key, app]));
const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.values(SUPABASE_DOMAIN_BY_APP);
const CONCURRENCY = 2;
let done = 0;
let failed = 0;
for (const key of keys) {
  const rows = await listInspirationByDomain(key, 80);
  const cached = await prisma.reference.findMany({
    where: { imageUrl: { in: rows.map((row) => `supabase:${row.id}`) }, NOT: { analysis: { equals: null as never } } },
    select: { imageUrl: true },
  });
  const skip = new Set(cached.map((row) => row.imageUrl));
  const todo = rows.filter((row) => !skip.has(`supabase:${row.id}`));
  const index = async (row: (typeof todo)[number]) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const analysis = await indexInspirationRow(row, appByKey[key] ?? key).catch(() => null);
      if (analysis) return analysis;
      await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
    }
    return null;
  };
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const results = await Promise.all(todo.slice(i, i + CONCURRENCY).map(index));
    results.forEach((analysis, j) => {
      const row = todo[i + j];
      if (analysis) done += 1;
      else failed += 1;
      console.log(`${key} ${row.storage_path} → ${analysis ? `${analysis.subject} | slots ${analysis.textSlots.join(",")} | ${analysis.aspectRatio}` : "ÉCHEC"}`);
    });
  }
  console.log(`== ${key}: ${rows.length} images, ${skip.size} déjà indexées, ${todo.length} analysées maintenant`);
}
console.log(`TOTAL indexées: ${done}, échecs: ${failed}`);
await prisma.$disconnect();
