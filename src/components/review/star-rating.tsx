"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** controlled value 1-5; undefined = no rating selected */
  value?: number;
  /** name of hidden form input. Provide for form submission. */
  name?: string;
  /** size in tailwind units, defaults to size-7 */
  size?: "sm" | "md" | "lg";
  /** read-only mode — no hover state, no click. */
  readOnly?: boolean;
  /** emit changes when interactive */
  onChange?: (value: number) => void;
};

const SIZES = {
  sm: "size-4",
  md: "size-5",
  lg: "size-7",
};

export function StarRating({ value, name, size = "lg", readOnly, onChange }: Props) {
  const [internal, setInternal] = useState(value ?? 0);
  const [hover, setHover] = useState(0);
  const current = value ?? internal;
  const display = hover || current;

  function pick(v: number) {
    if (readOnly) return;
    setInternal(v);
    onChange?.(v);
  }

  return (
    <div className={cn("inline-flex items-center gap-1", readOnly && "pointer-events-none")}>
      {name && <input type="hidden" name={name} value={current || ""} />}
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          onMouseEnter={() => !readOnly && setHover(v)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => pick(v)}
          aria-label={`${v} star${v === 1 ? "" : "s"}`}
          className={cn(
            "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !readOnly && "transition-transform hover:scale-110 active:scale-95",
          )}
        >
          <Star
            className={cn(
              SIZES[size],
              v <= display ? "fill-primary text-primary" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
