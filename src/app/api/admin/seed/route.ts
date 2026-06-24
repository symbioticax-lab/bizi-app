/**
 * POST /api/admin/seed
 *
 * On-demand mock account creation for internal team members who don't have a
 * local dev environment. Protected by ADMIN_SECRET env var.
 *
 * Body: { secret: string, preset?: string, count?: number }
 *   preset — category keyword filter, e.g. "photography", "design", or "random" (default)
 *   count  — how many accounts to create, 1–5 per request (default: 1)
 *
 * Returns: { created: Array<{ id, username, email, display_name }>, password: string }
 *
 * Example:
 *   curl -X POST https://your-app.vercel.app/api/admin/seed \
 *     -H "Content-Type: application/json" \
 *     -d '{"secret":"YOUR_ADMIN_SECRET","preset":"photographer","count":2}'
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_ACCOUNTS } from "@/lib/seed/mock-data";

const SEED_DOMAIN = "@seed.bizi.app";

const HOUR = 60 * 60 * 1000;
// Varied "last active" offsets so seeded accounts show realistic, non-uniform
// presence (Active recently / 1h / 6h / 12h / 24h+) rather than all "Online".
const LAST_SEEN_OFFSETS_MS = [40 * 60 * 1000, 2 * HOUR, 8 * HOUR, 14 * HOUR, 30 * HOUR, 3 * 24 * HOUR];

function randomLastSeen(): string {
  const offset = LAST_SEEN_OFFSETS_MS[Math.floor(Math.random() * LAST_SEEN_OFFSETS_MS.length)];
  return new Date(Date.now() - offset).toISOString();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  // Auth check — timing-safe to prevent secret-length oracle attacks
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = typeof body.secret === "string" ? body.secret : "";
  const secretsMatch = adminSecret && timingSafeEqual(
    createHash("sha256").update(provided).digest(),
    createHash("sha256").update(adminSecret).digest(),
  );
  if (!secretsMatch) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "BiziSeed2024!";
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 5);
  const preset = typeof body.preset === "string" ? body.preset.toLowerCase() : "random";

  // Filter pool by preset category
  const pool = preset === "random"
    ? MOCK_ACCOUNTS
    : MOCK_ACCOUNTS.filter(a => a.category.toLowerCase().includes(preset));

  if (!pool.length) {
    return NextResponse.json(
      { error: `No mock accounts found matching preset "${body.preset}"` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Fetch existing seed emails to avoid duplicates
  const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingEmails = new Set(
    existingUsers.filter(u => u.email?.endsWith(SEED_DOMAIN)).map(u => u.email!),
  );

  // Shuffle pool and pick `count` unseen accounts
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const candidates = shuffled.filter(a => !existingEmails.has(a.email)).slice(0, count);

  if (!candidates.length) {
    return NextResponse.json(
      { message: "All matching accounts already exist.", created: [] },
      { status: 200 },
    );
  }

  const created: Array<{ id: string; username: string; email: string; display_name: string }> = [];

  for (const mock of candidates) {
    const { data: { user }, error: createErr } = await supabase.auth.admin.createUser({
      email: mock.email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: mock.displayName },
    });

    if (createErr || !user) continue;

    await supabase
      .from("profiles")
      .update({
        display_name: mock.displayName,
        bio: mock.bio,
        skills: mock.skills,
        location: mock.location,
        last_seen_at: randomLastSeen(),
        onboarding_completed: true,
        is_active: true,
      })
      .eq("id", user.id);

    for (const opp of mock.opportunities) {
      await supabase.from("opportunities").insert({
        owner_id: user.id,
        status: "active",
        negotiable: true,
        image_urls: [],
        ...opp,
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();

    created.push({
      id: user.id,
      username: profile?.username ?? "",
      email: mock.email,
      display_name: profile?.display_name ?? mock.displayName,
    });
  }

  return NextResponse.json({ created, password: SEED_PASSWORD }, { status: 201 });
}
