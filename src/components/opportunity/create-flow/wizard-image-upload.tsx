"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { ImagePlus, X, Plus, Loader2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// 4:5 portrait — matches the feed card image slot at all breakpoints.
// The feed card uses w-[38%] left column; at any screen width the inset
// is always taller than wide, so portrait cropping never wastes real estate.
const FEED_ASPECT  = 4 / 5;
const MAX_IMAGES   = 5;
const MAX_BYTES    = 20 * 1024 * 1024;
const ALLOWED      = ["image/jpeg", "image/png", "image/webp"];

type QueueItem = { src: string; type: string };

type Props = {
  userId: string;
  images: string[];
  onChange: (urls: string[]) => void;
};

export function WizardImageUpload({ userId, images, onChange }: Props) {
  const supabase  = createClient();
  const fileRef   = useRef<HTMLInputElement>(null);

  // ── Crop queue ──────────────────────────────────────────────────────────────
  const [queue,    setQueue]    = useState<QueueItem[]>([]);
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [crop,     setCrop]     = useState({ x: 0, y: 0 });
  const [zoom,     setZoom]     = useState(1);
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState<string | null>(null);

  const current  = queue[0] ?? null;
  const canAdd   = images.length + queue.length < MAX_IMAGES;

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCropArea(pixels);
  }, []);

  // ── File picker ─────────────────────────────────────────────────────────────
  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    const incoming: QueueItem[] = [];
    let slots = MAX_IMAGES - images.length - queue.length;

    for (const f of files) {
      if (slots <= 0) break;
      if (!ALLOWED.includes(f.type) || f.size > MAX_BYTES) continue;
      incoming.push({ src: URL.createObjectURL(f), type: f.type });
      slots--;
    }

    if (incoming.length) {
      setQueue((q) => [...q, ...incoming]);
      resetCrop();
    }
  }

  function resetCrop() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropArea(null);
    setErr(null);
  }

  function skipCurrent() {
    if (current) URL.revokeObjectURL(current.src);
    setQueue((q) => q.slice(1));
    resetCrop();
  }

  // ── Upload cropped blob ─────────────────────────────────────────────────────
  async function saveCrop() {
    if (!current || !cropArea) return;
    setBusy(true);
    setErr(null);
    try {
      const blob = await renderCroppedBlob(current.src, cropArea, current.type);
      const ext  = current.type === "image/png" ? "png"
                 : current.type === "image/webp" ? "webp"
                 : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("listings")
        .upload(path, blob, { cacheControl: "3600", upsert: false, contentType: current.type });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("listings").getPublicUrl(path);
      onChange([...images, data.publicUrl]);
      URL.revokeObjectURL(current.src);
      setQueue((q) => q.slice(1));
      resetCrop();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  // ── Remove uploaded image ───────────────────────────────────────────────────
  async function remove(url: string) {
    onChange(images.filter((u) => u !== url));
    try {
      const path = url.split("/listings/")[1];
      if (path) await supabase.storage.from("listings").remove([path]);
    } catch {}
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* ── Crop dialog ─────────────────────────────────────────────────── */}
      {current && (
        <div className="space-y-3 rounded-2xl border border-white/[0.10] bg-white/[0.035] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-white/90">Crop photo</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-white/32">
                {queue.length > 1
                  ? `Photo 1 of ${queue.length} — crop each to fit the feed card`
                  : "Drag & pinch to frame — portrait crop matches the feed"}
              </p>
            </div>
            <button
              type="button"
              onClick={skipCurrent}
              className="shrink-0 text-[12px] text-white/30 hover:text-white/60 transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Cropper — fixed 300px height, 4:5 aspect forced */}
          <div className="relative h-[300px] overflow-hidden rounded-xl bg-black">
            <Cropper
              image={current.src}
              crop={crop}
              zoom={zoom}
              aspect={FEED_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition={false}
              style={{ containerStyle: { borderRadius: "12px" } }}
            />
          </div>

          {/* Zoom */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <p className="text-[11px] text-white/25">Zoom</p>
              <p className="text-[11px] text-white/25">{Math.round((zoom - 1) * 100)}%</p>
            </div>
            <input
              type="range"
              min={1} max={3} step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {err && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
              {err}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={skipCurrent}
              disabled={busy}
              className="flex-1 rounded-xl border border-white/[0.09] py-2.5 text-[13px] text-white/45 hover:text-white/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveCrop}
              disabled={busy || !cropArea}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5",
                "text-[13px] font-semibold text-white",
                "bg-gradient-to-r from-violet-600 via-primary to-violet-500",
                "transition-all hover:opacity-90 active:scale-[0.98]",
                (busy || !cropArea) && "opacity-40 cursor-not-allowed",
              )}
            >
              {busy
                ? <><Loader2 className="size-4 animate-spin" /> Uploading…</>
                : "Use photo"}
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state (no images, no active crop) ─────────────────────── */}
      {images.length === 0 && !current && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-2xl py-9",
            "border border-dashed border-white/[0.10] bg-white/[0.02]",
            "transition-all duration-150 hover:border-white/[0.20] hover:bg-white/[0.04]",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-white/[0.07]">
            <ImagePlus className="size-5 text-white/45" />
          </div>
          <div className="text-center">
            <p className="text-[13.5px] font-medium text-white/65">Add photos</p>
            <p className="mt-0.5 text-[11.5px] text-white/28">
              Up to {MAX_IMAGES} · JPG, PNG or WEBP · cropped to feed size
            </p>
          </div>
        </button>
      )}

      {/* ── Photo strip ─────────────────────────────────────────────────── */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {images.map((url, i) => (
              <div
                key={url}
                className="relative shrink-0"
                style={{ width: 80, aspectRatio: "4/5" }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[10px] border border-white/[0.08]">
                  <Image
                    src={url}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  {/* Cover badge on first image */}
                  {i === 0 && (
                    <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold text-white/80">
                      COVER
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(url)}
                  aria-label="Remove photo"
                  className={cn(
                    "absolute -right-1.5 -top-1.5 flex size-[18px] items-center justify-center",
                    "rounded-full border border-white/[0.12] bg-[hsl(248,35%,8%)]",
                    "text-white/50 hover:text-white transition-colors",
                  )}
                >
                  <X className="size-2.5" />
                </button>
              </div>
            ))}

            {/* Add more tile */}
            {canAdd && !current && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "flex shrink-0 flex-col items-center justify-center gap-1 rounded-[10px]",
                  "border border-dashed border-white/[0.10] bg-white/[0.02]",
                  "text-white/30 transition-all hover:border-white/[0.20] hover:bg-white/[0.05] hover:text-white/55",
                )}
                style={{ width: 80, aspectRatio: "4/5" }}
              >
                <Plus className="size-4" />
                <span className="text-[10px] leading-none">Add</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-white/22">
            {images.length}/{MAX_IMAGES} photos ·{" "}
            {images.length > 1 ? "first photo is the cover" : "add up to " + (MAX_IMAGES - images.length) + " more"}
          </p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ALLOWED.join(",")}
        multiple
        onChange={handlePick}
        className="hidden"
      />
    </div>
  );
}

// ── Canvas utilities ──────────────────────────────────────────────────────────

async function renderCroppedBlob(src: string, area: Area, mime: string): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("toBlob returned null."))),
      mime,
      mime === "image/jpeg" ? 0.92 : undefined,
    ),
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => res(img);
    img.onerror = () => rej(new Error("Image load failed."));
    img.src = src;
  });
}
