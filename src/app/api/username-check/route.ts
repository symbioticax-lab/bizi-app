import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const allowed = await checkRateLimit(`username-check:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { available: false, reason: "rate_limited" },
      { status: 429 },
    );
  }

  const raw = request.nextUrl.searchParams.get("username") ?? "";
  const username = raw.toLowerCase().trim();

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
