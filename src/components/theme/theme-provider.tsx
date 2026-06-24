"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * App-wide theme provider. Manages the `class` on <html> (`dark` / `light`),
 * persists the choice to localStorage, and avoids the flash of the wrong theme
 * on load. Light is the default; users who prefer dark can opt in from the
 * settings menu and their choice is remembered across sessions.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
