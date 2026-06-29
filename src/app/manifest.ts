import type { MetadataRoute } from "next";

/**
 * Web app manifest — controls the install/"Add to Home Screen" experience.
 * Icons are the white brand mark on the dark-mode purple gradient.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BIZI — Trade skills, not money",
    short_name: "BIZI",
    description:
      "A trust-based barter marketplace. Exchange services with people in your community.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0814",
    theme_color: "#0A0814",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
