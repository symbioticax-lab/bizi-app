import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight", className)}>
      <BiziGlyph className="h-6 w-6" />
      <span className="lowercase">bizi</span>
    </span>
  );
}

/**
 * BIZI mark — heart silhouette with three rightward-opening arc marks.
 * Inherits color via currentColor so the same SVG works on light + dark backgrounds.
 */
export function BiziGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {/* Heart / apple silhouette */}
      <path
        d="M16 7
           C 13 3, 5 3, 3 10
           C 1 16, 8 22, 16 28
           C 24 22, 31 16, 29 10
           C 27 3, 19 3, 16 7 Z"
        className="fill-foreground"
      />
      {/* Three stacked arcs, expanding outward like ripples */}
      <g
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="stroke-background"
      >
        <path d="M10 13 Q 12 16, 10 19" />
        <path d="M14 11 Q 17 16, 14 21" />
        <path d="M18 9 Q 23 16, 18 23" />
      </g>
    </svg>
  );
}
