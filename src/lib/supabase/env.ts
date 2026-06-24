// Sanitized Supabase connection values.
//
// Env vars pasted into a hosting dashboard frequently arrive with surrounding
// quotes or trailing whitespace/newlines. A malformed URL makes the Supabase
// client throw the moment it is constructed — which, in middleware, surfaces as
// MIDDLEWARE_INVOCATION_FAILED on every request. Trimming defensively here keeps
// one bad paste from taking down the whole app.
function clean(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
