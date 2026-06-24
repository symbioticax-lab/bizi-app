import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  // Public allowlist — anything outside this set requires auth.
  // /folders/[shareSlug] stays public so unlisted folder share links work for
  // recipients who don't have an account yet.
  const isPublic =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/folders/") ||
    pathname.startsWith("/api/username-check");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/signup";
    // Preserve the originally-requested URL (including query string) so we
    // can route the user there after signup completes.
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // -------------------------------------------------------------------------
  // Onboarding gate. Once authenticated, the user must finish the onboarding
  // flow before any other route renders. We exempt /onboarding itself plus
  // the auth callback / logout path so the flow and sign-out remain reachable.
  // -------------------------------------------------------------------------
  if (user && !pathname.startsWith("/onboarding") && !pathname.startsWith("/auth/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && !profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.searchParams.set("next", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
  }

  return response;
}
