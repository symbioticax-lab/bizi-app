"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { ImagePlus, X, Loader2, Square, RectangleHorizontal, RectangleVertical, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const RATIOS = [
  { id: "16/10", label: "Wide", value: 16 / 10, Icon: RectangleHorizontal },
  { id: "1/1",   label: "Square", value: 1, Icon: Square },
  { id: "4/3",   label: "Classic", value: 4 / 3, Icon: RectangleHorizontal },
  { id: "3/4",   label: "Portrait", value: 3 / 4, Icon: RectangleVertical },
  { id: "free",  label: "Free", value: 0 /* sentinel: no constraint */, Icon: Maximize2 },
] as const;
type RatioId = (typeof RATIOS)[number]["id"];

type Props = {
  userId: string;
  initialUrl?: string | null;
  name?: string;
};

export function ImageUpload({ userId, initialUrl, name = "image_url" }: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Cropper state
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [rawType, setRawType] = useState<string>("image/jpeg");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratioId, setRatioId] = useState<RatioId>("16/10");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const aspect = RATIOS.find((r) => r.id === ratioId)!.value;

  function handlePickClick() {
    inputRef.current?.click();
  }

  function handlePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      setError("Use a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 20 MB or smaller.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setRawSrc(reader.result as string);
      setRawType(file.type);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRatioId("16/10");
    };
    reader.readAsDataURL(file);
  }

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleSaveCrop() {
    if (!rawSrc || !croppedAreaPixels) return;
    setBusy(true);
    setError(null);

    try {
      const blob = await renderCroppedBlob(rawSrc, croppedAreaPixels, rawType);
      const ext = rawType === "image/png" ? "png" : rawType === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage.from("listings").upload(path, blob, {
        cacheControl: "3600",
        upsert: false,
        contentType: rawType,
      });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("listings").getPublicUrl(path);
      setUrl(data.publicUrl);
      setRawSrc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!url) return;
    try {
      const path = url.split(`/listings/`)[1];
      if (path) await supabase.storage.from("listings").remove([path]);
    } catch {}
    setUrl(null);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        onChange={handlePicked}
        className="hidden"
      />

      {url ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-muted">
          <Image src={url} alt="Listing image" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button type="button" size="sm" variant="secondary" onClick={handlePickClick} className="h-8">
              Change
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={handleRemove}
              className="size-8"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePickClick}
          className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <ImagePlus className="size-6" />
          <span className="text-sm">Add a cover image</span>
          <span className="text-xs">JPG, PNG, or WEBP · up to 20 MB</span>
        </button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Dialog open={Boolean(rawSrc)} onOpenChange={(o) => !o && !busy && setRawSrc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop your image</DialogTitle>
            <DialogDescription>
              Drag to reposition, scroll to zoom, and pick a ratio that fits your listing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative h-[360px] w-full overflow-hidden rounded-lg bg-black">
              {rawSrc && (
                <Cropper
                  image={rawSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect === 0 ? undefined : aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  restrictPosition={false}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {RATIOS.map((r) => {
                const Icon = r.Icon;
                const active = r.id === ratioId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRatioId(r.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {r.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Zoom</label>
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setRawSrc(null)} disabled={busy}>Cancel</Button>
            <Button type="button" onClick={handleSaveCrop} disabled={busy || !croppedAreaPixels}>
              {busy ? <><Loader2 className="size-4 animate-spin" /> Uploading…</> : "Save crop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Render the cropped region of `dataUrl` to a Blob, preserving the source mime
 * type. Runs entirely in the browser via canvas.
 */
async function renderCroppedBlob(dataUrl: string, area: Area, mimeType: string): Promise<Blob> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't open a 2D canvas for cropping.");

  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, canvas.width, canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob returned null."))),
      mimeType,
      mimeType === "image/jpeg" ? 0.92 : undefined,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image."));
    img.src = src;
  });
}
