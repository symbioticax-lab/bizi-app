"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Form field name. Each tag is emitted as a separate hidden input with this name. */
  name: string;
  /** Initial tags to render (uncontrolled mode). */
  defaultValue?: string[];
  /** Controlled tag list — pair with onChange to drive state from parent. */
  value?: string[];
  /** Called when tags change in controlled mode. */
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  /** Hard cap on number of tags. */
  maxTags?: number;
  /** When true, all input is lowercased on add (matches DB normalization). */
  lowercase?: boolean;
  /** Optional id for the inner input — used to anchor `<label htmlFor=...>`. */
  id?: string;
};

/**
 * Asana / ClickUp-style tag input.
 *
 *   - Existing tags render as removable chips with an × icon
 *   - As the user types, a "pending" chip appears next to the cursor with a + icon
 *   - Click the + (or hit Enter / comma) to commit the tag
 *   - Backspace on an empty input removes the previous tag
 *
 * Submitted as repeated form fields with the same name (one hidden input per
 * tag), so the server reads them via `formData.getAll(name)`.
 */
export function TagInput({
  name,
  defaultValue = [],
  value,
  onChange,
  placeholder = "Type a tag and press Enter…",
  maxTags = 12,
  lowercase = true,
  id,
}: Props) {
  const isControlled = value !== undefined;
  const [internalTags, setInternalTags] = useState<string[]>(() => dedupe(defaultValue));
  const tags = isControlled ? value! : internalTags;
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function normalize(v: string) {
    const trimmed = v.trim().replace(/\s+/g, " ");
    return lowercase ? trimmed.toLowerCase() : trimmed;
  }

  function setTags(next: string[]) {
    if (isControlled) {
      onChange?.(next);
    } else {
      setInternalTags(next);
    }
  }

  function addTag(value: string) {
    const v = normalize(value);
    if (!v) {
      setDraft("");
      return;
    }
    if (tags.includes(v)) {
      setDraft("");
      return;
    }
    if (tags.length >= maxTags) return;
    setTags([...tags, v]);
    setDraft("");
    // Re-focus so the user can immediately type the next tag.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function removeTag(value: string) {
    setTags(tags.filter((t) => t !== value));
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      // Pop the last tag — like Mail/Discord recipient chips
      e.preventDefault();
      setTags(tags.slice(0, -1));
    }
  }

  const previewValue = normalize(draft);
  const showPreview = previewValue.length > 0 && !tags.includes(previewValue) && tags.length < maxTags;
  const atCap = tags.length >= maxTags;

  return (
    <div className="space-y-1">
      {/* Hidden inputs — one per tag — for native form submission */}
      {tags.map((t) => (
        <input key={t} type="hidden" name={name} value={t} />
      ))}

      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-input/40 p-2",
          "min-h-[42px] focus-within:ring-2 focus-within:ring-ring",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              aria-label={`Remove ${t}`}
              className="rounded-full p-0.5 hover:bg-primary/20"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          disabled={atCap}
          autoComplete="off"
          className={cn(
            "flex-1 min-w-[120px] bg-transparent text-sm outline-none",
            "placeholder:text-muted-foreground disabled:opacity-50",
          )}
        />

        {showPreview && (
          <button
            type="button"
            onClick={() => addTag(draft)}
            aria-label={`Add tag ${previewValue}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary",
              "transition-all hover:bg-primary/25 hover:shadow-[0_0_14px_-2px_hsl(var(--primary)/0.55)]",
              "active:scale-95",
            )}
          >
            {previewValue}
            <Plus className="size-3" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {atCap
          ? `Cap reached — ${maxTags} tags max.`
          : "Press Enter or tap the + to add a tag. Backspace deletes the last one."}
      </p>
    </div>
  );
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}
