import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Node.js-runtime rate limiter. Unlike Edge middleware, server actions and
// route handlers run on Node, where the Upstash client loads cleanly.
//
// Stays null when the env vars are absent (e.g. local dev without Upstash),
// in which case callers simply skip the check.
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests/min per key
        analytics: false,
      })
    : null;

/**
 * Returns true if the request is allowed, false if the caller has exceeded the
 * limit. Fails open — a Redis error never blocks a legitimate request.
 */
export async function checkRateLimit(key: string): Promise<boolean> {
  if (!ratelimit) return true;
  try {
    const { success } = await ratelimit.limit(key);
    return success;
  } catch (err) {
    console.error("[ratelimit]", err);
    return true; // fail open
  }
}
