/**
 * Diagnostic — why is the People tab empty?
 * Runs the exact feed query with BOTH the service-role key (bypasses RLS) and
 * the anon key (what the page sees), so we can tell data vs RLS vs query.
 *
 *   npx tsx scripts/diag-people.ts
 */
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!URL || !SERVICE || !ANON) {
  console.error("Missing env. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const PROFILE_FULL =
  "id, username, display_name, avatar_url, rating_avg, review_count, skills, location, verified, hero_url, status, location_lat, location_lng, last_seen_at";

async function run(label: string, key: string) {
  const db = createClient(URL, key, { auth: { autoRefreshToken: false, persistSession: false } });

  console.log(`\n========== ${label} ==========`);

  // Total rows visible
  const { count: total, error: cErr } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true });
  console.log(`total profiles visible: ${total ?? "?"}${cErr ? `  (err: ${cErr.code} ${cErr.message})` : ""}`);

  // Breakdown of is_active values
  const { data: allRows } = await db.from("profiles").select("id, username, is_active, onboarding_completed");
  if (allRows) {
    const t = allRows.filter((r: any) => r.is_active === true).length;
    const f = allRows.filter((r: any) => r.is_active === false).length;
    const n = allRows.filter((r: any) => r.is_active === null || r.is_active === undefined).length;
    const onb = allRows.filter((r: any) => r.onboarding_completed === true).length;
    console.log(`is_active → true:${t}  false:${f}  null/undefined:${n}`);
    console.log(`onboarding_completed=true: ${onb} of ${allRows.length}`);
  }

  // The exact full-column query the page runs
  const full = await db.from("profiles").select(PROFILE_FULL).neq("is_active", false).limit(24);
  console.log(`FULL-cols query → rows:${full.data?.length ?? 0}${full.error ? `  ERROR ${full.error.code}: ${full.error.message}` : ""}`);

  // Corrected base-cols query (the fallback path) — should succeed
  const BASE = "id, username, display_name, avatar_url, rating_avg, review_count, skills, location, verified";
  const base = await db.from("profiles").select(BASE).neq("is_active", false).limit(24);
  console.log(`BASE-cols fallback query → rows:${base.data?.length ?? 0}${base.error ? `  ERROR ${base.error.code}: ${base.error.message}` : ""}`);
  if (base.data?.length) {
    console.log(`  sample usernames: ${base.data.slice(0, 8).map((r: any) => r.username).join(", ")}`);
  }

  // Probe which migration-added columns actually exist
  const probes = ["hero_url", "status", "location_lat", "location_lng", "last_seen_at", "subscription_tier", "onboarding_completed"];
  const present: string[] = [];
  const missing: string[] = [];
  for (const col of probes) {
    const r = await db.from("profiles").select(col).limit(1);
    (r.error?.code === "42703" ? missing : present).push(col);
  }
  console.log(`columns PRESENT: ${present.join(", ") || "(none)"}`);
  console.log(`columns MISSING: ${missing.join(", ") || "(none)"}`);
}

async function main() {
  await run("SERVICE ROLE (bypasses RLS)", SERVICE);
  await run("ANON KEY (what the page sees, logged-out)", ANON);
}

main().catch((e) => { console.error(e); process.exit(1); });
