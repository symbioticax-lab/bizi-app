"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CATEGORIES } from "@/lib/categories";
import {
  upsertOfferingAction,
  upsertWantAction,
  type ProfileItemFormState,
} from "@/app/profile/items/actions";

type Initial = {
  id?: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
};

type Props = {
  kind: "offering" | "want";
  initial?: Initial;
  triggerVariant?: "add" | "edit";
};

const empty: Initial = { title: "", description: "", category: "", tags: [] };

export function ProfileItemDialog({ kind, initial = empty, triggerVariant = "add" }: Props) {
  const [open, setOpen] = useState(false);

  const action = kind === "offering"
    ? upsertOfferingAction.bind(null, initial.id ?? null)
    : upsertWantAction.bind(null, initial.id ?? null);

  const [state, formAction] = useFormState<ProfileItemFormState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};
  const isEdit = Boolean(initial.id);

  if (state?.ok && open) {
    setTimeout(() => setOpen(false), 300);
  }

  const labels = kind === "offering"
    ? {
        title: "Add an offering",
        editTitle: "Edit offering",
        sub: "Things you can do for others — keep it concise so people get the gist quickly.",
        descLabel: "Description",
        descRequired: true,
        categoryLabel: "Category",
        categoryRequired: true,
      }
    : {
        title: "Add a want",
        editTitle: "Edit want",
        sub: "Things you're looking for in exchange — open-ended is fine.",
        descLabel: "Description (optional)",
        descRequired: false,
        categoryLabel: "Category (optional)",
        categoryRequired: false,
      };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerVariant === "edit" ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${kind}`}><Pencil className="size-4" /></Button>
        ) : (
          <Button size="sm" variant="outline"><Plus className="size-4" /> Add</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? labels.editTitle : labels.title}</DialogTitle>
          <DialogDescription>{labels.sub}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={initial.title} placeholder={kind === "offering" ? "e.g. Web design" : "e.g. Editorial photography"} />
            {fe.title && <p className="text-xs text-destructive">{fe.title}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">{labels.descLabel}</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={initial.description}
              placeholder={kind === "offering" ? "Scope, style, ideal collaborators." : "Format, scale, anything that'd make it a great fit."}
            />
            {fe.description && <p className="text-xs text-destructive">{fe.description}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="category">{labels.categoryLabel}</Label>
            <select
              id="category"
              name="category"
              defaultValue={initial.category}
              className="flex h-10 w-full rounded-md border border-input bg-input/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{labels.categoryRequired ? "Pick a category…" : "No category"}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {fe.category && <p className="text-xs text-destructive">{fe.category}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tags">Tags (comma-separated, optional)</Label>
            <Input id="tags" name="tags" defaultValue={initial.tags.join(", ")} placeholder="figma, branding, web" />
          </div>

          {state?.error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <SubmitButton isEdit={isEdit} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving…" : isEdit ? "Save" : "Add"}</Button>;
}
