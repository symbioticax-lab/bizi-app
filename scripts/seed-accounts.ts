/**
 * Seed script — creates 20 mock creator accounts for internal testing.
 *
 * Usage:
 *   npx tsx scripts/seed-accounts.ts           # create all 20 accounts
 *   npx tsx scripts/seed-accounts.ts --clean   # delete all @seed.bizi.app accounts
 *
 * Run from the project root. Reads credentials from .env.local automatically.
 * All seed accounts share the password: BiziSeed2024!
 */

import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { MOCK_ACCOUNTS } from "../src/lib/seed/mock-data";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_PASSWORD = "BiziSeed2024!";
const SEED_DOMAIN = "@seed.bizi.app";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Spread of "last active" offsets so seeded accounts demonstrate every presence
// bucket (Active recently / 1h / 6h / 12h / 24h+). None are within the online
// threshold — seed accounts aren't real, live users, so none show as "Online".
const LAST_SEEN_OFFSETS_MS = [40 * MINUTE, 2 * HOUR, 8 * HOUR, 14 * HOUR, 30 * HOUR, 3 * 24 * HOUR];

function lastSeenForIndex(i: number): string {
  const offset = LAST_SEEN_OFFSETS_MS[i % LAST_SEEN_OFFSETS_MS.length];
  return new Date(Date.now() - offset).toISOString();
}

async function getAllSeedUsers(): Promise<Array<{ id: string; email: string }>> {
  const collected: Array<{ id: string; email: string }> = [];
  let page = 1;
  while (true) {
    const { data: { users }, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error("listUsers error:", error.message); break; }
    for (const u of users) {
      if (u.email?.endsWith(SEED_DOMAIN)) collected.push({ id: u.id, email: u.email! });
    }
    if (users.length < 1000) break;
    page++;
  }
  return collected;
}

async function cleanSeedAccounts() {
  console.log("Fetching seed accounts to delete...\n");
  const seeds = await getAllSeedUsers();

  if (!seeds.length) {
    console.log("No seed accounts found — nothing to clean.");
    return;
  }

  console.log(`Found ${seeds.length} seed account(s). Deleting...\n`);
  let deleted = 0;
  for (const { id, email } of seeds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      console.log(`  ✗ ${email} — ${error.message}`);
    } else {
      console.log(`  ✓ ${email}`);
      deleted++;
    }
  }
  console.log(`\nDone. Deleted ${deleted}/${seeds.length} seed accounts.`);
}

async function seedAccounts() {
  console.log(`Seeding ${MOCK_ACCOUNTS.length} mock accounts...\n`);

  // Fetch existing emails once to check idempotency
  const existingUsers = await getAllSeedUsers();
  const existingEmails = new Set(existingUsers.map(u => u.email));

  let created = 0;
  let skipped = 0;

  for (const [index, mock] of MOCK_ACCOUNTS.entries()) {
    process.stdout.write(`${mock.displayName} (${mock.email}) — `);

    if (existingEmails.has(mock.email)) {
      console.log("already exists, skipping.");
      skipped++;
      continue;
    }

    // 1. Create auth user (email_confirm: true skips email verification)
    const { data: { user }, error: createErr } = await admin.auth.admin.createUser({
      email: mock.email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: mock.displayName },
    });

    if (createErr || !user) {
      console.log(`✗ Auth create failed: ${createErr?.message ?? "unknown error"}`);
      continue;
    }

    // 2. Update profile — handle_new_user() trigger already created the row
    const { error: profileErr } = await admin
      .from("profiles")
      .update({
        display_name: mock.displayName,
        bio: mock.bio,
        skills: mock.skills,
        location: mock.location,
        last_seen_at: lastSeenForIndex(index),
        onboarding_completed: true,
        is_active: true,
      })
      .eq("id", user.id);

    if (profileErr) {
      console.log(`✗ Profile update failed: ${profileErr.message}`);
      continue;
    }

    // 3. Create opportunities
    let oppCount = 0;
    for (const opp of mock.opportunities) {
      const { error: oppErr } = await admin.from("opportunities").insert({
        owner_id: user.id,
        status: "active",
        negotiable: true,
        image_urls: [],
        ...opp,
      });
      if (!oppErr) oppCount++;
    }

    console.log(`✓ created (${oppCount}/${mock.opportunities.length} listings)`);
    created++;
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Created: ${created}  |  Skipped (already existed): ${skipped}`);
  console.log(`Password for all seed accounts: ${SEED_PASSWORD}`);
  console.log(`\nTo delete all seed accounts: npx tsx scripts/seed-accounts.ts --clean`);
}

async function main() {
  if (process.argv.includes("--clean")) {
    await cleanSeedAccounts();
  } else {
    await seedAccounts();
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
