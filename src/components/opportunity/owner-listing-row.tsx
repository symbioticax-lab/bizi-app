"use client";

import Link from "next/link";
import Image from "next/image";
import { useTransition } from "react";
import { ArrowLeftRight, MoreHorizontal, Pencil, FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  setOpportunityStatusAction,
  hardDeleteOpportunityAction,
} from "@/app/opportunities/actions";
import { formatRelative } from "@/lib/utils";

type Listing = {
  id: string;
  title: string;
  category: string;
  status: "active" | "paused" | "draft" | "closed" | "completed" | "deleted";
  image_urls: string[];
  created_at: string;
  intent?: string | null;
};

type Props = {
  listing: Listing;
};

/**
 * Owner-only management row used on the profile listings section. Shows a
 * thumbnail + title + category, with two control surfaces:
 *   • Switch toggle for active ↔ paused (instant)
 *   • 3-dot menu for less-frequent actions (edit, move to drafts, delete)
 *
 * Listings in "draft" or terminal states (closed/completed) hide the toggle
 * and show a status badge instead — those don't fit the active/paused dichotomy.
 */
export function OwnerListingRow({ listing }: Props) {
  const cover = listing.image_urls?.[0];
  const isActive = listing.status === "active";
  const isToggleable = listing.status === "active" || listing.status === "paused";
  const [pending, startTransition] = useTransition();

  function toggle() {
    const nextStatus = isActive ? "paused" : "active";
    const fd = new FormData();
    fd.set("id", listing.id);
    fd.set("status", nextStatus);
    startTransition(async () => {
      await setOpportunityStatusAction(fd);
    });
  }

  function moveToDraft() {
    const fd = new FormData();
    fd.set("id", listing.id);
    fd.set("status", "draft");
    startTransition(async () => {
      await setOpportunityStatusAction(fd);
    });
  }

  function permanentlyDelete() {
    const ok = window.confirm(
      `Permanently delete "${listing.title}"?\n\nThis cannot be undone. Any active negotiations or interests on this listing will also be removed.`,
    );
    if (!ok) return;
    const fd = new FormData();
    fd.set("id", listing.id);
    startTransition(async () => {
      await hardDeleteOpportunityAction(fd);
    });
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border glass p-3">
      <Link
        href={`/opportunities/${listing.id}`}
        className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted"
      >
        {cover ? (
          <Image src={cover} alt="" fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            <ArrowLeftRight className="size-5" />
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/opportunities/${listing.id}`} className="line-clamp-1 font-medium hover:underline">
          {listing.title}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{listing.category}</span>
          <span>·</span>
          <span>{formatRelative(listing.created_at)}</span>
          {listing.intent === "trade-skills" && (
            <Badge className="ml-1 border-amber-500/25 bg-amber-500/15 text-amber-400 hover:bg-amber-500/20">
              Barter
            </Badge>
          )}
          {!isToggleable && (
            <Badge variant="muted" className="ml-1 capitalize">
              {listing.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Toggle: active ↔ paused. Hidden when status doesn't apply. */}
      {isToggleable && (
        <div
          className="flex shrink-0 items-center gap-2"
          aria-label={isActive ? "Listing is active. Toggle to pause." : "Listing is paused. Toggle to activate."}
        >
          <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
            {isActive ? "Active" : "Paused"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            disabled={pending}
            onClick={toggle}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              isActive ? "bg-primary" : "bg-muted"
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block size-4 transform rounded-full bg-foreground shadow transition-transform ${
                isActive ? "translate-x-[1.125rem] bg-primary-foreground" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}

      {/* 3-dot menu — edit, move to drafts, delete */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More options" className="shrink-0">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/opportunities/${listing.id}/edit`}>
              <Pencil className="size-4" /> Edit listing
            </Link>
          </DropdownMenuItem>
          {listing.status !== "draft" && (
            <DropdownMenuItem onSelect={() => moveToDraft()}>
              <FileText className="size-4" /> Move to drafts
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault(); // keep menu open while window.confirm pops
              permanentlyDelete();
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" /> Permanently delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
