"use client";

import { usePathname } from "next/navigation";

/**
 * Conditionally renders global navigation chrome. The auth routes
 * (/login, /signup) want a full-bleed marketing-style canvas — no
 * top header, no bottom nav — so we strip them out there.
 */
export function NavGuard({
  header,
  bottom,
  children,
}: {
  header: React.ReactNode;
  bottom: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChromeless =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding");

  return (
    <>
      {!isChromeless && header}
      {/* flex-1 + overflow-y-auto makes <main> the sole scroll container.
          min-h-0 prevents the flex child from overflowing its parent. */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none min-h-0 w-full">{children}</main>
      {!isChromeless && bottom}
    </>
  );
}
