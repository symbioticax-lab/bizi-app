"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, Upload, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { setHeroAction, setHeroFocalAction, removeHeroAction } from "@/app/profile/hero/actions";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_VIDEO_SECONDS = 5;

type Props = {
  userId: string;
  initial: {
    url: string | null;
    kind: "image" | "gif" | "video" | null;
    posterUrl: string | null;
    focalX: number;
    focalY: number;
  };
};

/**
 * Owner-only hero editor. Two states:
 *   1. No hero: shows an upload affordance.
 *   2. Hero set: shows the media at the same aspect ratio used on the profile,
 *      with a draggable focal point dot for live re-positioning.
 *
 * Uploads go directly to Supabase Storage from the browser; the resulting
 * public URL + media metadata is then persisted via setHeroAction.
 */
export function HeroUploader({ userId, initial }: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const [url, setUrl] = useState(initial.url);
  const [kind, setKind] = useState(initial.kind);
  const [posterUrl, setPosterUrl] = useState(initial.posterUrl);
  const [focal, setFocal] = useState({ x: initial.focalX, y: initial.focalY });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [pendingFocalSave, setPendingFocalSave] = useState(false);

  function pick() { inputRef.current?.click(); }

  async function onPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isImage = ALLOWED_IMAGE.includes(file.type);
    const isVideo = ALLOWED_VIDEO.includes(file.type);

    if (!isImage && !isVideo) {
      setError("Use a JPG, PNG, WEBP, GIF, or short MP4/MOV/WebM.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File must be 20 MB or smaller.");
      return;
    }
    if (isVideo) {
      const seconds = await readVideoDuration(file).catch(() => Infinity);
      if (seconds > MAX_VIDEO_SECONDS + 0.25) {
        setError(`Video must be ${MAX_VIDEO_SECONDS} seconds or shorter (yours is ${seconds.toFixed(1)}s).`);
        return;
      }
    }

    setError(null);
    setBusy(true);

    try {
      const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("profile-hero").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("profile-hero").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      let nextKind: "image" | "gif" | "video" =
        file.type === "image/gif" ? "gif" : isVideo ? "video" : "image";
      let posterPublicUrl: string | null = null;

      // For videos, capture a poster frame as a JPEG and upload it too.
      if (isVideo) {
        try {
          const poster = await captureVideoPoster(file);
          if (poster) {
            const posterPath = `${userId}/${crypto.randomUUID()}.jpg`;
            const { error: posterErr } = await supabase.storage
              .from("profile-hero")
              .upload(posterPath, poster, { contentType: "image/jpeg", upsert: false });
            if (!posterErr) {
              posterPublicUrl = supabase.storage.from("profile-hero").getPublicUrl(posterPath).data.publicUrl;
            }
          }
        } catch {
          // poster is optional — continue without it
        }
      }

      const result = await setHeroAction({
        url: publicUrl,
        kind: nextKind,
        poster_url: posterPublicUrl,
        focal_x: 0.5,
        focal_y: 0.5,
      });
      if (result?.error) throw new Error(result.error);

      setUrl(publicUrl);
      setKind(nextKind);
      setPosterUrl(posterPublicUrl);
      setFocal({ x: 0.5, y: 0.5 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!url) return;
    if (!window.confirm("Remove your hero media?")) return;
    setBusy(true);
    setError(null);
    try {
      const result = await removeHeroAction();
      if (result?.error) throw new Error(result.error);
      setUrl(null);
      setKind(null);
      setPosterUrl(null);
      setFocal({ x: 0.5, y: 0.5 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove hero.");
    } finally {
      setBusy(false);
    }
  }

  function commitFocal(next: { x: number; y: number }) {
    setFocal(next);
    setPendingFocalSave(true);
    // Debounce-on-release; called from pointer up only, so just fire.
    startTransition(async () => {
      await setHeroFocalAction(next.x, next.y);
      setPendingFocalSave(false);
    });
  }

  function startDrag(downEvt: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    downEvt.currentTarget.setPointerCapture(downEvt.pointerId);
    const rect = dragRef.current.getBoundingClientRect();

    let nextX = focal.x;
    let nextY = focal.y;

    function move(moveEvt: PointerEvent) {
      nextX = clamp01((moveEvt.clientX - rect.left) / rect.width);
      nextY = clamp01((moveEvt.clientY - rect.top) / rect.height);
      setFocal({ x: nextX, y: nextY });
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      commitFocal({ x: nextX, y: nextY });
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={[...ALLOWED_IMAGE, ...ALLOWED_VIDEO].join(",")}
        onChange={onPicked}
        className="hidden"
      />

      {url ? (
        <div className="space-y-2">
          <div
            ref={dragRef}
            onPointerDown={startDrag}
            className={cn(
              "relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-white/10 bg-black",
              "cursor-grab active:cursor-grabbing select-none touch-none",
            )}
          >
            {kind === "video" ? (
              <video
                src={url}
                poster={posterUrl ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: `${(focal.x * 100).toFixed(2)}% ${(focal.y * 100).toFixed(2)}%` }}
              />
            ) : (
              <Image
                src={url}
                alt="Hero"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                unoptimized={kind === "gif"}
                className="object-cover pointer-events-none"
                style={{ objectPosition: `${(focal.x * 100).toFixed(2)}% ${(focal.y * 100).toFixed(2)}%` }}
              />
            )}

            {/* Focal-point indicator */}
            <div
              aria-hidden
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 bg-white/10 backdrop-blur-sm shadow-lg"
              style={{
                left: `${focal.x * 100}%`,
                top: `${focal.y * 100}%`,
                width: "32px",
                height: "32px",
              }}
            >
              <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            </div>

            {/* Drag hint */}
            <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur">
              <Move className="size-3" /> Drag to position
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={pick} disabled={busy}>
              <Upload className="size-4" /> Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={busy} className="text-destructive hover:text-destructive">
              <Trash2 className="size-4" /> Remove
            </Button>
            <p className="ml-auto self-center text-xs text-muted-foreground">
              {pendingFocalSave ? "Saving position…" : "Click and drag the dot to set what stays in frame."}
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="flex aspect-[21/9] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-muted-foreground transition-colors hover:bg-white/[0.04] disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="size-7 animate-spin" />
              <span className="text-sm">Uploading…</span>
            </>
          ) : (
            <>
              <ImagePlus className="size-7" />
              <span className="text-sm font-medium text-foreground">Add a hero photo, GIF, or video</span>
              <span className="text-xs">JPG / PNG / WEBP / GIF · or MP4 / MOV / WebM up to {MAX_VIDEO_SECONDS}s · 20 MB max</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Label className="text-xs text-muted-foreground">
        Tip — vertical 4:5 photos look the best on mobile, since profiles render the hero as a tall magazine cover there.
      </Label>
    </div>
  );
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Couldn't read video metadata."));
    };
    video.src = objectUrl;
  });
}

async function captureVideoPoster(file: File): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);

    function cleanup() { URL.revokeObjectURL(objectUrl); }

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (!ctx) { cleanup(); resolve(null); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => { cleanup(); resolve(blob); }, "image/jpeg", 0.85);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    video.onerror = () => { cleanup(); resolve(null); };
    video.src = objectUrl;
  });
}
