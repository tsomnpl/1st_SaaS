export function isSafeCreationAsset(rel: string) {
  return Boolean(rel) && /^[\w./-]+$/.test(rel) && !rel.includes("..") && rel.endsWith(".webp");
}
