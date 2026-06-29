"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus, User, Plane, Zap, LayoutDashboard } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

type Props = {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  unreadCount: number;
  isPro?: boolean;
};

export function BottomNavInner({ username, displayName, avatarUrl, isPro = false }: Props) {
  const pathname = usePathname();

  const profilePath = username ? `/profile/${username}` : "/dashboard";

  const isOnFeed = pathname === "/" || pathname === "/people";
  const isOnTravel = pathname.startsWith("/travel");
  const isOnGoPro = pathname.startsWith("/go-pro");
  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnProfile =
    (username && pathname.startsWith(`/profile/${username}`)) ||
    pathname === "/profile/edit";

  return (
    /* shrink-0 keeps the nav at its natural height inside the body flex column.
       No position:fixed — the nav just sits at the bottom of the flex layout. */
    <nav
      aria-label="Primary"
      className="shrink-0 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div
        className={cn(
          "mx-auto max-w-sm md:max-w-md",
          "rounded-2xl border border-white/[0.08]",
          "bg-white/[0.08] backdrop-blur-2xl",
          "shadow-[0_8px_32px_-8px_rgb(0_0_0/0.7),inset_0_1px_0_0_rgb(255_255_255/0.06)]",
        )}
      >
          <div className="grid grid-cols-5 items-end px-3 py-2">
            <Tab href="/" label="Feed" icon={LayoutGrid} active={isOnFeed} />
            <Tab href="/travel" label="Travel" icon={Plane} active={isOnTravel} />
            <CreateTab />
            {isPro
              ? <Tab href="/dashboard" label="Dashboard" icon={LayoutDashboard} active={isOnDashboard} />
              : <Tab href="/go-pro" label="Upgrade" icon={Zap} active={isOnGoPro} />
            }
            <ProfileTab href={profilePath} active={Boolean(isOnProfile)} avatarUrl={avatarUrl} displayName={displayName} />
          </div>
        </div>
      </nav>
  );
}

function Tab({
  href, label, icon: Icon, active, unread,
}: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  active: boolean;
  unread?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex flex-col items-center gap-0.5 py-1.5 text-[11px]",
        "transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="relative">
        <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
        {unread && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 size-2 rounded-full bg-primary ring-2 ring-background"
          />
        )}
      </span>
      <span className="leading-none">{label}</span>
      {active && (
        <span aria-hidden className="absolute -bottom-0.5 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-primary" />
      )}
    </Link>
  );
}

function CreateTab() {
  return (
    <div className="relative flex justify-center">
      <Link
        href="/opportunities/new"
        aria-label="Post a listing"
        className={cn(
          "-mt-6 flex size-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground",
          "shadow-[0_0_28px_-4px_hsl(var(--primary)/0.7),0_4px_16px_-4px_hsl(var(--primary)/0.4)]",
          "ring-4 ring-background",
          "transition-transform active:scale-95 hover:scale-[1.04]",
        )}
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </Link>
    </div>
  );
}

function ProfileTab({
  href, active, avatarUrl, displayName,
}: {
  href: string;
  active: boolean;
  avatarUrl: string | null;
  displayName: string | null;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex flex-col items-center gap-0.5 py-1.5 text-[11px]",
        "transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {avatarUrl ? (
        <Avatar
          className={cn(
            "size-5 ring-2 transition-colors",
            active ? "ring-primary" : "ring-transparent group-hover:ring-white/20",
          )}
        >
          <AvatarImage src={avatarUrl} alt="" />
          <AvatarFallback className="text-[9px]">{initials(displayName ?? "U")}</AvatarFallback>
        </Avatar>
      ) : (
        <User className="size-5" strokeWidth={active ? 2.4 : 2} />
      )}
      <span className="leading-none">Profile</span>
      {active && (
        <span aria-hidden className="absolute -bottom-0.5 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-primary" />
      )}
    </Link>
  );
}
