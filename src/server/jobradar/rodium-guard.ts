import { parseBooleanFlag } from "@/lib/env";

export const JOBRADAR_RODIUM_DISABLED_CODE = "JOBRADAR_RODIUM_DISABLED";

/**
 * JobRadar must not spend RODI until the owner flips this flag.
 * Reads process.env on every call so a restart/env change is enough to unlock.
 */
export function isJobRadarRodiumEnabled(
  value = process.env.JOBRADAR_RODIUMAI_ENABLED,
): boolean {
  return parseBooleanFlag(value);
}

export function assertJobRadarRodiumEnabled(): void {
  if (!isJobRadarRodiumEnabled()) {
    throw new Error(JOBRADAR_RODIUM_DISABLED_CODE);
  }
}
