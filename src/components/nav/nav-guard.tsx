"use client";

import { usePathname } from "next/navigation";

/**
 * Conditionally renders global navigation chrome. The auth routes
 * (/login, /signup) want a full-bleed marketing-style canvas — no
 * top header, no bottom nav — so we strip them out there.
 *
 * On desktop (lg:+), a sidebar is passed alongside the main content
 * in a flex-row middle zone between the header and the bottom nav.
 */
export function NavGuard({
  header,
  bottom,
  sidebar,
  children,
}: {
  header: React.ReactNode;
  bottom: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChromeless =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding");

  if (isChromeless) {
    return (
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none min-h-0 w-full">
        {children}
      </main>
    );
  }

  return (
    <>
      {header}
      {/* flex-1 + min-h-0 makes this zone consume remaining height between
          header and bottom nav without overflowing. Sidebar sits left of
          <main> on desktop; on mobile the sidebar is hidden (lg:flex inside). */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {sidebar}
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none min-h-0 w-full">
          {children}
        </main>
      </div>
      {bottom}
    </>
  );
}
