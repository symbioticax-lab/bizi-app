import { cn } from "@/lib/utils";

export function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div aria-hidden className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === current ? "w-6 bg-foreground/85" : "w-1.5 bg-foreground/25",
          )}
        />
      ))}
    </div>
  );
}
