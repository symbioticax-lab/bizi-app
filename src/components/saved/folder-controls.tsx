"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Lock, Copy, Trash2, MoreHorizontal, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setFolderVisibilityAction, deleteFolderAction } from "@/app/saved/actions";

type Props = {
  folderId: string;
  folderName: string;
  visibility: "private" | "unlisted";
  shareSlug: string | null;
};

/**
 * Owner-only controls on a folder detail page. Makes the folder shareable (or
 * private), copies the share URL, and deletes with confirmation.
 */
export function FolderControls({ folderId, folderName, visibility, shareSlug }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUnlisted = visibility === "unlisted";
  const shareUrl = shareSlug
    ? `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || (typeof window !== "undefined" ? window.location.origin : "")}/folders/${shareSlug}`
    : "";

  function toggleShareable() {
    setError(null);
    startTransition(async () => {
      const result = await setFolderVisibilityAction({
        id: folderId,
        visibility: isUnlisted ? "private" : "unlisted",
      });
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDelete() {
    if (!window.confirm(`Delete the folder "${folderName}"?\n\nSaved items inside will move to All saves — they're not deleted.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteFolderAction({ id: folderId });
      if (result?.error) setError(result.error);
      else router.push("/saved");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={isUnlisted ? "default" : "outline"}
        size="sm"
        onClick={toggleShareable}
        disabled={pending}
        className="gap-1.5"
      >
        {isUnlisted ? <Globe2 className="size-4" /> : <Lock className="size-4" />}
        {isUnlisted ? "Shareable" : "Make shareable"}
      </Button>

      {isUnlisted && shareUrl && (
        <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
          {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isUnlisted && shareSlug && (
            <DropdownMenuItem asChild>
              <a href={`/folders/${shareSlug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Open share view
              </a>
            </DropdownMenuItem>
          )}
          {isUnlisted && shareSlug && <DropdownMenuSeparator />}
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); handleDelete(); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" /> Delete folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </div>
  );
}
