import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeRedirectPath(raw: string | null): string {
  const path = raw ?? "/dashboard";
  // Only allow relative paths — reject anything that would redirect off-domain
  return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);

      // Persist display name for personalized login page greeting
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.display_name) {
          response.cookies.set("bizi_last_user", profile.display_name, {
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
            httpOnly: true,
            path: "/",
          });
        }
      }

      return response;
    }
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }
  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
