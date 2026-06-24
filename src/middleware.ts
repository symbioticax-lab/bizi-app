import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Middleware runs on the Edge runtime, where the Upstash Redis client does not
// load reliably. Rate limiting is therefore applied at the Node.js layer — see
// src/lib/ratelimit.ts, used by the username-check route and the auth actions.
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - any file with an extension (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
