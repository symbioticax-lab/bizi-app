"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES } from "@/lib/categories";
import { ImageUpload } from "./image-upload";
import {
  createOpportunityAction,
  updateOpportunityAction,
  type OpportunityFormState,
} from "@/app/opportunities/actions";

type Initial = {
  title: string;
  description: string;
  category: string;
  offering_title: string;
  offering_desc: string;
  offering_tags: string[];
  want_title: string;
  want_desc: string;
  want_tags: string[];
  image_url: string | null;
  negotiable: boolean;
};

const empty: Initial = {
  title: "", description: "", category: "",
  offering_title: "", offering_desc: "", offering_tags: [],
  want_title: "", want_desc: "", want_tags: [],
  image_url: null,
  negotiable: true,
};

export function ListingForm({
  userId,
  initial = empty,
  mode,
  opportunityId,
  cancelHref,
  /** Current status when editing (drives which buttons appear). */
  currentStatus,
}: {
  userId: string;
  initial?: Initial;
  mode: "create" | "edit";
  opportunityId?: string;
  cancelHref: string;
  currentStatus?: "active" | "paused" | "draft" | "closed" | "completed";
}) {
  const action = mode === "create"
    ? createOpportunityAction
    : updateOpportunityAction.bind(null, opportunityId!);

  const [state, formAction] = useFormState<OpportunityFormState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};
  const isDraftEdit = mode === "edit" && currentStatus === "draft";

  return (
    <form action={formAction} className="space-y-8">
      <Section title="Cover image" sub="One image for now — multi-image carousels come later.">
        <ImageUpload userId={userId} initialUrl={initial.image_url} />
      </Section>

      <Section title="The basics">
        <Field label="Headline" name="title" defaultValue={initial.title} placeholder="e.g. Web design in exchange for marketing copy" error={fe.title} />
        <div className="grid gap-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={initial.category}
            className="flex h-10 w-full rounded-md border border-input bg-input/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Pick a category…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {fe.category && <p className="text-xs text-destructive">{fe.category}</p>}
        </div>
        <TextareaField label="Describe the deal" name="description" defaultValue={initial.description} rows={4}
          placeholder="Set the scene — what you're proposing, who it's for, any constraints." error={fe.description} />
      </Section>

      <Section title="The exchange" sub={
        <span className="inline-flex items-center gap-2 text-xs">
          <span>What you offer</span>
          <ArrowLeftRight className="size-3.5" />
          <span>What you want in return</span>
        </span>
      }>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">You offer</p>
            <Field label="Title" name="offering_title" defaultValue={initial.offering_title} placeholder="e.g. Landing page design" error={fe.offering_title} />
            <TextareaField label="Details" name="offering_desc" defaultValue={initial.offering_desc} rows={4}
              placeholder="What's included? Deliverables, timing, scope." error={fe.offering_desc} />
            <Field label="Tags (comma-separated)" name="offering_tags" defaultValue={initial.offering_tags.join(", ")} placeholder="figma, web, branding" />
          </div>
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">You want</p>
            <Field label="Title" name="want_title" defaultValue={initial.want_title} placeholder="e.g. Marketing copy for 4 emails" error={fe.want_title} />
            <TextareaField label="Details" name="want_desc" defaultValue={initial.want_desc} rows={4}
              placeholder="Be specific so people know if they're a fit." error={fe.want_desc} />
            <Field label="Tags (comma-separated)" name="want_tags" defaultValue={initial.want_tags.join(", ")} placeholder="copywriting, email, b2b" />
          </div>
        </div>
      </Section>

      <Section title="Deal terms">
        <Switch
          name="negotiable"
          defaultChecked={initial.negotiable}
          label="Open to counter-offers (Negotiable)"
          description="Toggle on if you're open to seekers proposing different terms. Off means take it or leave it — they can only Accept or Decline what you posted."
        />
      </Section>

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="ghost"><a href={cancelHref}>Cancel</a></Button>
        {(mode === "create" || isDraftEdit) && (
          <SubmitVariant intent="draft" variant="outline">
            {mode === "create" ? "Save as draft" : "Save draft"}
          </SubmitVariant>
        )}
        <SubmitVariant intent="publish" variant="default">
          {mode === "create"
            ? "Publish listing"
            : isDraftEdit
              ? "Publish now"
              : "Save changes"}
        </SubmitVariant>
      </div>
    </form>
  );
}

/**
 * One submit button variant. Sets `intent` on the form so the server action
 * can branch between draft (relaxed validation) and publish (strict).
 */
function SubmitVariant({
  intent, variant, children,
}: {
  intent: "draft" | "publish";
  variant: "default" | "outline";
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="intent" value={intent} variant={variant} disabled={pending}>
      {pending ? "Saving…" : children}
    </Button>
  );
}

function Section({ title, sub, children }: { title: string; sub?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">{title}</h2>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={String(props.name)}>{label}</Label>
      <Input id={String(props.name)} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function TextareaField({ label, error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={String(props.name)}>{label}</Label>
      <Textarea id={String(props.name)} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

