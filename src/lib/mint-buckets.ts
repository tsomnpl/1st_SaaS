export type MintBucketLike = {
  expiresAt: Date | null;
  createdAt: Date;
};

/** FEFO: consume the mint that expires soonest; never-expiring buckets come last. */
export function sortMintBucketsFefo<T extends MintBucketLike>(buckets: T[]): T[] {
  return [...buckets].sort((a, b) => {
    if (a.expiresAt && b.expiresAt) {
      const diff = a.expiresAt.getTime() - b.expiresAt.getTime();
      if (diff !== 0) return diff;
    } else if (a.expiresAt && !b.expiresAt) {
      return -1;
    } else if (!a.expiresAt && b.expiresAt) {
      return 1;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}
