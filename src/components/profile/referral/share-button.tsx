"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  shareUrl: string;
  shareTitle: string;
  shareText: string;
  /** Optional class override for the trigger button. */
  className?: string;
};

/**
 * Native share on mobile (Web Share API), copy-to-clipboard fallback elsewhere.
 * Shows a "Copied" confirmation for 1.5s after copy.
 */
export function ShareButton({ shareUrl, shareTitle, shareText, className }: Props) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      // Web Share API gives a native share sheet on iOS / Android. On desktop
      // browsers it's typically not present, so we fall back to clipboard.
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
          return;
        } catch (err) {
          // User cancelled the share sheet — silent. Other errors fall through to clipboard.
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={className}
    >
      {copied ? (
        <>
          <Check className="size-4" /> Copied
        </>
      ) : (
        <>
          <Share2 className="size-4" /> Share invite
        </>
      )}
    </Button>
  );
}

/**
 * Smaller variant — copy URL only, no share text. Used inline next to the
 * displayed share link.
 */
export function CopyLinkButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onClick}
      aria-label={copied ? "Copied" : "Copy link"}
      className={className}
    >
      {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
    </Button>
  );
}
