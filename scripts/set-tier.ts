/**
 * One-off admin script — inspect or set a user's subscription tier.
 *
 * Usage:
 *   npx tsx scripts/set-tier.ts <username> <tier>            # inspect only (no write)
 *   npx tsx scripts/set-tier.ts <username> <tier> --apply    # apply the change
 *
 * Example:
 *   npx tsx scripts/set-tier.ts paulritani pro --apply
 *
 * Sets subscriptions.tier (which mirrors to profiles.subscription_tier via the
 * sync_subscription_tier trigger) and also writes profiles.subscription_tier
 * directly as a safety net. Reads credentials from .env.local.
 */

import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const VALID_TIERS = ["free", "pro"] as const;
type Tier = (typeof VALID_TIERS)[number];

const [, , rawUsername, rawTier, ...flags] = process.argv;
const apply = flags.includes("--apply");

if (!rawUsername || !rawTier) {
  console.error("Usage: npx tsx scripts/set-tier.ts <username> <tier> [--apply]");
  process.exit(1);
}
const username = rawUsername.replace(/^@/, "");
const tier = rawTier as Tier;
if (!VALID_TIERS.includes(tier)) {
  console.error(`ERROR: tier must be one of ${VALID_TIERS.join(", ")}`);
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Find the profile
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("id, username, display_name, subscription_tier")
    .eq("username", username)
    .maybeSingle();

  if (pErr) throw pErr;
  if (!profile) {
    console.error(`No profile found with username "@${username}".`);
    process.exit(1);
  }

  // 2. Current subscription row (if any)
  const { data: sub } = await admin
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", profile.id)
    .maybeSingle();

  // 3. Active/draft listing count (what the limit gate counts)
  const { count: listingCount } = await admin
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", profile.id)
    .in("status", ["active", "draft"]);

  console.log("\n=== Current state ===");
  console.log(`User:                 @${profile.username} (${profile.display_name})`);
  console.log(`profiles tier:        ${profile.subscription_tier}`);
  console.log(`subscriptions tier:   ${sub?.tier ?? "(no subscription row)"} / status ${sub?.status ?? "—"}`);
  console.log(`active+draft listings: ${listingCount ?? 0}`);
  console.log(`Target tier:          ${tier}`);

  if (!apply) {
    console.log("\n(dry run — re-run with --apply to write the change)\n");
    return;
  }

  // 4. Upsert the subscriptions row to the target tier. The DB trigger mirrors
  //    this to profiles.subscription_tier; we also set it directly as a safety net.
  const { error: subErr } = await admin
    .from("subscriptions")
    .upsert(
      { user_id: profile.id, tier, status: "active", updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (subErr) throw subErr;

  const { error: profErr } = await admin
    .from("profiles")
    .update({ subscription_tier: tier })
    .eq("id", profile.id);
  if (profErr) throw profErr;

  // 5. Verify
  const { data: after } = await admin
    .from("profiles")
    .select("subscription_tier")
    .eq("id", profile.id)
    .single();

  console.log("\n=== Applied ===");
  console.log(`profiles tier is now: ${after?.subscription_tier}`);
  console.log("Done.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
