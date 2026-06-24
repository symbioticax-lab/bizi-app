"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Square, RectangleHorizontal, RectangleVertical, Maximize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type AspectOption = {
  id: string;
  label: string;
  value: number; // 0 → free / unconstrained
  Icon: React.ComponentType<{ className?: string }>;
};

export const HERO_ASPECTS: AspectOption[] = [
  { id: "21/9",  label: "Banner",   value: 21 / 9, Icon: RectangleHorizontal },
  { id: "16/10", label: "Wide",     value: 16 / 10, Icon: RectangleHorizontal },
  { id: "4/5",   label: "Cover",    value: 4 / 5, Icon: RectangleVertical },
  { id: "1/1",   label: "Square",   value: 1, Icon: Square },
  { id: "free",  label: "Free",     value: 0, Icon: Maximize2 },
];

export const AVATAR_ASPECTS: AspectOption[] = [
  { id: "1/1", label: "Square", value: 1, Icon: Square },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The currently picked file. Read into a data URL when the dialog opens. */
  file: File | null;
  aspectRatios: AspectOption[];
  defaultRatioId?: string;
  title: string;
  description?: string;
  /** "round" shows a circular crop overlay (used for avatars). */
  cropShape?: "rect" | "round";
  saving: boolean;
  error?: string | null;
  /** JPEG encode quality for the cropped blob (0–1). Defaults to 0.92. Hero
      covers pass a higher value so the authored image starts crisper. */
  outputQuality?: number;
  /** Called with the cropped Blob + original mimeType. Consumer handles upload. */
  onSave: (blob: Blob, mimeType: string) => Promise<void> | void;
};

/**
 * Shared crop dialog used for the listing cover, hero, and avatar uploads.
 * Same UX everywhere: pick file → crop with aspect chips + zoom → save.
 */
export function ImageCropDialog({
  open, onOpenChange, file, aspectRatios, defaultRatioId,
  title, description, cropShape = "rect", saving, error, outputQuality = 0.92, onSave,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratioId, setRatioId] = useState(defaultRatioId ?? aspectRatios[0]?.id ?? "1/1");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");

  useEffect(() => {
    if (!file || !open) {
      setSrc(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as string);
      setMimeType(file.type);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRatioId(defaultRatioId ?? aspectRatios[0]?.id ?? "1/1");
    };
    reader.readAsDataURL(file);
  }, [file, open, defaultRatioId, aspectRatios]);

  const aspect = aspectRatios.find((r) => r.id === ratioId)?.value ?? 0;

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleSave() {
    if (!src || !croppedAreaPixels) return;
    const blob = await renderCroppedBlob(src, croppedAreaPixels, mimeType, outputQuality);
    await onSave(blob, mimeType);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {src && (
          <div className="space-y-4">
            <div className="relative h-[360px] w-full overflow-hidden rounded-lg bg-black">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspect === 0 ? undefined : aspect}
                cropShape={cropShape}
                showGrid={cropShape !== "round"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={false}
              />
            </div>

            {aspectRatios.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {aspectRatios.map((r) => {
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
            )}

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
        )}

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !croppedAreaPixels}>
            {saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function renderCroppedBlob(
  dataUrl: string,
  area: Area,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't open canvas for cropping.");
  // Higher-quality resampling when the browser scales the source into the crop.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob returned null."))),
      mimeType,
      mimeType === "image/jpeg" ? quality : undefined,
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
