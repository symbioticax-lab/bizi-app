"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error?: string } | undefined;

/**
 * Resolve the site URL we should redirect through. Priority:
 *   1. NEXT_PUBLIC_SITE_URL (configured in .env.local — matches the ngrok / Vercel URL)
 *   2. Origin header (request-scoped, only set on POST/preflight)
 *   3. localhost fallback
 *
 * We prefer the env var because it's deterministic — the same value Supabase
 * has in its Allowed Redirect URLs list, so OAuth/magic-link callbacks land
 * at a URL Supabase will honor.
 */
function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (envUrl) return envUrl;
  const origin = headers().get("origin");
  if (origin) return origin;
  return "http://localhost:3000";
}

function safeNext(raw: unknown): string {
  const s = String(raw ?? "/dashboard");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
}

export async function loginAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  // Persist display name so the login page can greet returning users by name
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.display_name) {
      cookies().set("bizi_last_user", profile.display_name, {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: true,
        path: "/",
      });
    }
  }

  revalidatePath("/", "layout");
  redirect(next);
}

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function signupAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const ref_code_raw = String(formData.get("ref_code") ?? "").trim().toUpperCase();
  const ref_code = /^[A-Z0-9]{6}$/.test(ref_code_raw) ? ref_code_raw : null;
  const next = safeNext(formData.get("next"));
  const origin = headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL!;

  if (!USERNAME_RE.test(username)) {
    return { error: "Username must be 3–20 characters: lowercase letters, numbers, and underscores only" };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  // Guard against race conditions — verify availability server-side before creating the account
  const { data: taken } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();
  if (taken) return { error: "That username is already taken — try another" };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: username,
        username,
        ...(ref_code ? { ref_code } : {}),
      },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is OFF in Supabase settings, the user is signed in immediately.
  // If it's ON, redirect to a "check your email" page.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    revalidatePath("/", "layout");
    redirect(next);
  }
  redirect(`/login?check_email=1&next=${encodeURIComponent(next)}`);
}

export async function googleLoginAction(formData: FormData) {
  const supabase = createClient();
  const siteUrl = resolveSiteUrl();
  const next = safeNext(formData.get("next"));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      // access_type=offline tells Google to issue a refresh token so Supabase
      // can keep the session alive without re-prompting the user.
      // prompt=consent ensures the consent screen renders consistently across
      // first-time and returning users (avoids silent-fail edge cases).
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data?.url) redirect(data.url);
}

// -----------------------------------------------------------------------------
// Email magic link — passwordless login. Sends a one-time link to the user's
// email; clicking it completes the auth flow via /auth/callback.
// -----------------------------------------------------------------------------
export async function magicLinkAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  const display_name = String(formData.get("display_name") ?? "").trim();
  const ref_code_raw = String(formData.get("ref_code") ?? "").trim().toUpperCase();
  const ref_code = /^[A-Z0-9]{6}$/.test(ref_code_raw) ? ref_code_raw : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address" };
  }

  const siteUrl = resolveSiteUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
      data: {
        ...(display_name ? { full_name: display_name } : {}),
        ...(ref_code ? { ref_code } : {}),
      },
    },
  });

  if (error) return { error: error.message };

  redirect(`/login?check_email=magic&email=${encodeURIComponent(email)}`);
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/signup");
}
