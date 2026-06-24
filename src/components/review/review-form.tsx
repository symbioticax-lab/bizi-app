"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./star-rating";
import { REVIEW_TAGS, MAX_TAGS } from "@/lib/review-tags";
import { submitReviewAction, type ReviewFormState } from "@/app/trades/actions";
import { cn } from "@/lib/utils";

type Props = {
  tradeId: string;
  revieweeName: string;
};

export function ReviewForm({ tradeId, revieweeName }: Props) {
  const action = submitReviewAction.bind(null, tradeId);
  const [state, formAction] = useFormState<ReviewFormState, FormData>(action, undefined);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);

  function toggleTag(id: string) {
    setTags((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, id];
    });
  }

  if (state?.ok) {
    return (
      <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm">
        Thanks for the review — it's now visible on {revieweeName}'s profile.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label>How was trading with {revieweeName}?</Label>
        <StarRating name="rating" value={rating} onChange={setRating} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comment (optional)</Label>
        <Textarea
          id="comment"
          name="comment"
          rows={3}
          placeholder="What stood out? What would you do differently next time?"
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <p className="text-xs text-muted-foreground">Pick up to {MAX_TAGS} that fit.</p>
        <div className="flex flex-wrap gap-1.5">
          {REVIEW_TAGS.map((t) => {
            const active = tags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {tags.map((id) => <input key={id} type="hidden" name="tags" value={id} />)}
      </div>

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <SubmitButton disabled={!rating} />
      </div>
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending || disabled}>{pending ? "Submitting…" : "Leave review"}</Button>;
}
