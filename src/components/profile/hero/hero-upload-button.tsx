"use client";

import { useRef, useState } from "react";
import { Camera, RectangleVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropDialog, type AspectOption } from "@/components/media/image-crop-dialog";
import { createClient } from "@/lib/supabase/client";
import { setHeroAction } from "@/app/profile/hero/actions";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Lock the hero crop to the canonical mobile cover aspect (4:5). On desktop
// the hero renders at 21:9 and object-cover handles the center-fit — but
// authoring against 4:5 keeps the framing consistent across screens.
const HERO_LOCKED_ASPECT: AspectOption[] = [
  { id: "4/5", label: "Cover", value: 4 / 5, Icon: RectangleVertical },
];

/**
 * Floating "Change cover" button rendered on the profile hero for the owner.
 * Clicking opens the file picker; once a file is chosen, the shared crop
 * dialog opens. On save we upload to the profile-hero bucket and persist via
 * setHeroAction. Same UX as the listing cover upload.
 */
export function HeroUploadButton({ userId, hasHero }: { userId: string; hasHero: boolean }) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick() { inputRef.current?.click(); }

  function onPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    setError(null);
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError("Use a JPG, PNG, WEBP, or GIF.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Image must be 20 MB or smaller.");
      return;
    }
    setFile(f);
    setOpen(true);
  }

  async function onSave(blob: Blob, mimeType: string) {
    setSaving(true);
    setError(null);
    try {
      const ext = mimeType === "image/png" ? "png"
        : mimeType === "image/webp" ? "webp"
        : mimeType === "image/gif" ? "gif"
        : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("profile-hero").upload(path, blob, {
        cacheControl: "3600",
        upsert: false,
        contentType: mimeType,
      });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("profile-hero").getPublicUrl(path);
      const result = await setHeroAction({
        url: data.publicUrl,
        kind: mimeType === "image/gif" ? "gif" : "image",
        focal_x: 0.5,
        focal_y: 0.5,
      });
      if (result?.error) throw new Error(result.error);

      setOpen(false);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={onPicked}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={pick}
        className="gap-1.5 rounded-full border-white/25 bg-black/45 text-white backdrop-blur-md hover:bg-black/65 hover:text-white"
      >
        <Camera className="size-4" />
        {hasHero ? "Change cover" : "Add cover"}
      </Button>
      <ImageCropDialog
        open={open}
        onOpenChange={(next) => { if (!saving) setOpen(next); if (!next) setFile(null); }}
        file={file}
        aspectRatios={HERO_LOCKED_ASPECT}
        defaultRatioId="4/5"
        title={hasHero ? "Change cover" : "Add cover"}
        description="Crop your image to fit the cover. Drag the frame and zoom to taste."
        saving={saving}
        error={error}
        outputQuality={0.95}
        onSave={onSave}
      />
    </>
  );
}
