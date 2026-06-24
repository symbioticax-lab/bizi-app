"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** The URL to share (defaults to current page URL if omitted). */
  url?: string;
  title?: string;
  text?: string;
  className?: string;
  /** "icon" = square icon button, "pill" = rounded pill with label. */
  variant?: "icon" | "pill";
};

/**
 * Share button: uses the Web Share API when available, falls back to
 * copying the URL to the clipboard. Shows a brief checkmark on success.
 */
export function ShareButton({ url, title, text, className, variant = "icon" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = url
      ? new URL(url, window.location.origin).href
      : window.location.href;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: shareUrl, ...(title && { title }), ...(text && { text }) });
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — nothing to do.
    }
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          copied
            ? "border-primary/40 bg-primary/15 text-primary"
            : "border-white/20 bg-black/45 text-white backdrop-blur-md hover:bg-black/65",
          className,
        )}
      >
        {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
        {copied ? "Copied!" : "Share"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? "Link copied" : "Share"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full backdrop-blur-md transition-colors",
        copied
          ? "bg-primary/20 text-primary"
          : "bg-black/45 text-white hover:bg-black/65",
        className,
      )}
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
    </button>
  );
}
