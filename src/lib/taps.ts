export type TapTargetType = "profile" | "listing";

/**
 * A tap is active for 24 hours. After that it expires:
 *   - it disappears from the receiver's Taps tab
 *   - the tapper can tap that profile / listing again
 */
export const TAP_TTL_MS = 24 * 60 * 60 * 1000;

/** ISO timestamp for the active-tap cutoff — anything older has expired. */
export function tapCutoffIso(): string {
  return new Date(Date.now() - TAP_TTL_MS).toISOString();
}
