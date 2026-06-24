"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, Tag, X, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addTagAction, removeTagAction } from "@/app/profile/tags/actions";
import { cn } from "@/lib/utils";

const MAX_TAGS = 12;

type Props = {
  initialTags: string[];
};

/**
 * Inline tag adder rendered on the owner's profile hero. Click → popover
 * opens with a tiny input. Type a tag, hit Enter → tag commits to the
 * profile.skills array via server action and appears immediately on the
 * profile (optimistic UI, server roll-back on failure).
 */
export function AddTagsPopover({ initialTags }: Props) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(() => Array.from(new Set(initialTags)));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep local state in sync if the parent's `initialTags` ever changes
  // (e.g., via a route revalidation while the popover is closed).
  useEffect(() => {
    if (!open) setTags(Array.from(new Set(initialTags)));
  }, [initialTags, open]);

  function normalize(v: string) {
    return v.trim().toLowerCase().replace(/\s+/g, " ");
  }

  function commit(rawValue: string) {
    const value = normalize(rawValue);
    setError(null);

    if (!value) { setDraft(""); return; }
    if (tags.includes(value)) { setDraft(""); return; }
    if (tags.length >= MAX_TAGS) {
      setError(`Cap reached — ${MAX_TAGS} tags max.`);
      return;
    }

    // Optimistic add
    const next = [...tags, value];
    setTags(next);
    setDraft("");

    startTransition(async () => {
      const result = await addTagAction(value);
      if (result?.error) {
        setTags((prev) => prev.filter((t) => t !== value));
        setError(result.error);
      }
    });
  }

  function remove(value: string) {
    const prev = tags;
    setTags(tags.filter((t) => t !== value));
    setError(null);
    startTransition(async () => {
      const result = await removeTagAction(value);
      if (result?.error) {
        setTags(prev);
        setError(result.error);
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      e.preventDefault();
      remove(tags[tags.length - 1]);
    }
  }

  const previewValue = normalize(draft);
  const showPreview = previewValue.length > 0 && !tags.includes(previewValue) && tags.length < MAX_TAGS;
  const atCap = tags.length >= MAX_TAGS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md transition-colors hover:bg-primary/25"
        >
          <Plus className="size-3.5" />
          <Tag className="size-3.5" />
          Add tags
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-72"
        onOpenAutoFocus={(e) => {
          // Defer focus to the input for a snappier feel
          e.preventDefault();
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add a tag
            </p>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-input/40 p-1.5 focus-within:ring-2 focus-within:ring-ring">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="ecom, graphic design…"
                disabled={atCap}
                autoComplete="off"
                className="flex-1 min-w-[120px] bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
              />
              {showPreview && (
                <button
                  type="button"
                  onClick={() => commit(draft)}
                  aria-label={`Add ${previewValue}`}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary",
                    "transition-all hover:bg-primary/25 hover:shadow-[0_0_14px_-2px_hsl(var(--primary)/0.55)] active:scale-95",
                  )}
                >
                  {previewValue}
                  <Plus className="size-3" />
                </button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Press <kbd className="rounded bg-muted px-1 text-[10px]">Enter</kbd> to add. Backspace removes the last.
            </p>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>

          {tags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Your tags {pending && <Loader2 className="ml-1 inline size-3 animate-spin" />}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => remove(t)}
                      aria-label={`Remove ${t}`}
                      className="rounded-full p-0.5 hover:bg-primary/20"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
