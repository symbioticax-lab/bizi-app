import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Node.js-runtime rate limiter. Unlike Edge middleware, server actions and
// route handlers run on Node, where the Upstash client loads cleanly.
//
// The client is created lazily on first use (not at module load) so a missing
// or malformed env var can never crash the build — only disable rate limiting.

let cached: Ratelimit | null | undefined;

function getRatelimit(): Ratelimit | null {
  if (cached !== undefined) return cached;

  // Defensively strip surrounding quotes/whitespace — a common copy-paste error
  // when pasting values into a dashboard.
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/^["']|["']$/g, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/^["']|["']$/g, "");

  if (!url || !token || !url.startsWith("https://")) {
    cached = null; // not configured (or misconfigured) — rate limiting disabled
    return cached;
  }

  try {
    cached = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests/min per key
      analytics: false,
    });
  } catch (err) {
    console.error("[ratelimit] init failed", err);
    cached = null;
  }
  return cached;
}

/**
 * Returns true if the request is allowed, false if the caller has exceeded the
 * limit. Fails open — a missing config or Redis error never blocks a request.
 */
export async function checkRateLimit(key: string): Promise<boolean> {
  const ratelimit = getRatelimit();
  if (!ratelimit) return true;
  try {
    const { success } = await ratelimit.limit(key);
    return success;
  } catch (err) {
    console.error("[ratelimit]", err);
    return true; // fail open
  }
}
