"use client";

import Link from "next/link";
import { Menu, Handshake, LayoutDashboard, Trophy, Pencil, LogOut, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/app/(auth)/login/actions";

type Props = {
  signedIn: boolean;
  username?: string | null;
};

/**
 * Top-right hamburger menu on mobile. Holds the *overflow* destinations that
 * don't fit in the 5-slot bottom nav (Trades, Rewards, Dashboard, Edit Profile,
 * Sign Out) plus auth shortcuts when signed out. Discover, Negotiations,
 * Notifications, and Profile are reachable from the bottom nav.
 */
export function MobileMenu({ signedIn }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {signedIn ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/trades"><Handshake className="size-4" /> Trades</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/saved"><Bookmark className="size-4" /> Saved</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/rewards"><Trophy className="size-4" /> Rewards</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard"><LayoutDashboard className="size-4" /> Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile/edit"><Pencil className="size-4" /> Edit profile</Link>
            </DropdownMenuItem>
            <form action={logoutAction}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-destructive focus:text-destructive">
                  <LogOut className="size-4" /> Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild><Link href="/login">Sign in</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/signup">Sign up</Link></DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
