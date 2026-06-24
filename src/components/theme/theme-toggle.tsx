"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Segmented Light/Dark control for the settings panel's Preferences group.
 * Guards against hydration mismatch by only reflecting the resolved theme
 * after mount (next-themes can't know the stored value during SSR).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const active = mounted ? theme : undefined;

  return (
    <div className={cn("inline-flex rounded-full border border-border bg-secondary/40 p-0.5", className)}>
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={active === "light"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
          active === "light" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        <Sun className="size-3.5" /> Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={active === "dark"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
          active === "dark" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        <Moon className="size-3.5" /> Dark
      </button>
    </div>
  );
}
