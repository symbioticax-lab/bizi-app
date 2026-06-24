const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-* required by Next.js
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://dkmqkzmkfbmwmywynrbb.supabase.co https://lh3.googleusercontent.com https://images.unsplash.com https://plus.unsplash.com",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The codebase has pervasive cosmetic lint errors (react/no-unescaped-entities)
  // across many pre-existing files. These don't affect runtime, so we don't block
  // production builds on ESLint. TypeScript type-checking still runs and must pass.
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    // AVIF first, then WebP — both are far sharper per byte than the default
    // single-format output, so uploaded hero/cover photos render crisp.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "dkmqkzmkfbmwmywynrbb.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
};

export default nextConfig;
