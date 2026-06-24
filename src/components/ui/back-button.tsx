"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Where to navigate if there's no browser history (direct URL load, fresh tab). */
  fallbackHref: string;
  /** Button label, defaults to "Back". */
  label?: string;
  className?: string;
};

/**
 * Goes back to whatever page the user was on. Uses native browser history,
 * so it respects however they got here — bottom nav, link, search result.
 *
 * Falls back to `fallbackHref` when there's no history (e.g., the user
 * pasted the URL directly or arrived via an external link).
 */
export function BackButton({ fallbackHref, label = "Back", className }: Props) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn("gap-1.5", className)}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
}
