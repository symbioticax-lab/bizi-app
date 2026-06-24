"use client";

import { useState, useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus, ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTripAction, type TripFormState } from "@/app/travel/actions";
import { CITIES, TRIP_PURPOSES, TRIP_OPPORTUNITY_TYPES } from "@/lib/travel/cities";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const SELECT_CLASS = cn(
  "flex h-9 w-full rounded-md border border-input",
  "bg-background text-foreground [color-scheme:dark]",
  "px-3 py-1 text-sm shadow-sm",
  "focus:outline-none focus:ring-1 focus:ring-ring",
  "disabled:opacity-50",
);

async function uploadCover(file: File): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/trips/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("listings")
    .upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
  if (error) return null;
  const { data } = supabase.storage.from("listings").getPublicUrl(path);
  return data.publicUrl;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating…" : "Create Trip"}
    </Button>
  );
}

export function CreateTripDialog() {
  const [open, setOpen] = useState(false);
  const [titleLen, setTitleLen] = useState(0);
  const [oppType, setOppType] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [state, formAction] = useFormState<TripFormState, FormData>(
    createTripAction,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      setTitleLen(0);
      setOppType(null);
      setCoverUrl(null);
    }
  }, [state?.ok]);

  function handleClose(v: boolean) {
    setOpen(v);
    if (!v) {
      setTitleLen(0);
      setOppType(null);
      setCoverUrl(null);
    }
  }

  const fe = state?.fieldErrors ?? {};

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Image must be under 8 MB.");
      return;
    }
    setUploading(true);
    const url = await uploadCover(file);
    setUploading(false);
    if (url) setCoverUrl(url);
    else alert("Upload failed — please try again.");
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Add trip">
          <Plus className="size-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Trip</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-1">
          {state?.error && !Object.keys(fe).length && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              maxLength={50}
              placeholder="e.g. Makeup Artist for Hire"
              onChange={(e) => setTitleLen(e.target.value.length)}
              className={cn(fe.title && "border-destructive")}
            />
            <div className="flex items-center justify-between">
              {fe.title
                ? <p className="text-xs text-destructive">{fe.title}</p>
                : <span />}
              {titleLen > 0 && (
                <span className={cn(
                  "text-xs tabular-nums",
                  titleLen >= 45 ? "text-destructive" : "text-muted-foreground",
                )}>
                  {titleLen} / 50
                </span>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="grid gap-1.5">
            <Label htmlFor="destination">Destination</Label>
            <select
              id="destination"
              name="destination"
              required
              defaultValue=""
              className={cn(SELECT_CLASS, fe.destination && "border-destructive")}
            >
              <option value="" disabled>Select a city…</option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            {fe.destination && <p className="text-xs text-destructive">{fe.destination}</p>}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="begin_date">Begin Date</Label>
              <Input
                id="begin_date"
                name="begin_date"
                type="date"
                required
                style={{ colorScheme: "dark" }}
                className={cn(fe.begin_date && "border-destructive")}
              />
              {fe.begin_date && <p className="text-xs text-destructive">{fe.begin_date}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                required
                style={{ colorScheme: "dark" }}
                className={cn(fe.end_date && "border-destructive")}
              />
              {fe.end_date && <p className="text-xs text-destructive">{fe.end_date}</p>}
            </div>
          </div>

          {/* Purpose */}
          <div className="grid gap-1.5">
            <Label htmlFor="purpose">Purpose</Label>
            <select
              id="purpose"
              name="purpose"
              required
              defaultValue=""
              className={cn(SELECT_CLASS, fe.purpose && "border-destructive")}
            >
              <option value="" disabled>Select purpose…</option>
              {TRIP_PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {fe.purpose && <p className="text-xs text-destructive">{fe.purpose}</p>}
          </div>

          {/* Opportunity type */}
          <div className="grid gap-2">
            <Label>
              Opportunity Type
              <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {TRIP_OPPORTUNITY_TYPES.map((t) => {
                const selected = oppType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setOppType(selected ? null : t.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all",
                      selected
                        ? cn(t.badgeClass, "ring-1 ring-inset ring-current")
                        : "border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            {oppType && (
              <input type="hidden" name="opportunity_type" value={oppType} />
            )}
          </div>

          {/* Available for hire */}
          <Switch
            name="available_for_hire"
            label="Available for hire"
            description="Let others know you're open to paid work or collabs during this trip"
          />

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="description">
              Description
              <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              maxLength={500}
              placeholder="I will be in Miami for Art Basel, available for shoots or collaborations."
              className={cn(fe.description && "border-destructive")}
            />
            {fe.description && <p className="text-xs text-destructive">{fe.description}</p>}
          </div>

          {/* Cover image */}
          <div className="grid gap-1.5">
            <Label>
              Cover Image
              <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
            </Label>

            {coverUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <div className="relative aspect-[16/7]">
                  <Image src={coverUrl} alt="Trip cover" fill className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setCoverUrl(null)}
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
                  aria-label="Remove cover image"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "flex h-24 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border",
                  "text-sm text-muted-foreground transition-colors",
                  "hover:border-primary/50 hover:text-primary",
                  uploading && "cursor-not-allowed opacity-50",
                )}
              >
                {uploading
                  ? <><Loader2 className="size-4 animate-spin" /> Uploading…</>
                  : <><ImagePlus className="size-4" /> Add cover photo</>}
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {coverUrl && (
              <input type="hidden" name="cover_image_url" value={coverUrl} />
            )}
          </div>

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
