"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { ImageCropDialog, AVATAR_ASPECTS } from "@/components/media/image-crop-dialog";
import { createClient } from "@/lib/supabase/client";
import { setAvatarAction } from "@/app/profile/avatar/actions";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  userId: string;
  /** The avatar visual itself — rendered inside the click target. */
  children: React.ReactNode;
  className?: string;
};

/**
 * Wraps the avatar in a click target with a small camera-icon badge at the
 * bottom-right. Clicking opens the file picker → 1:1 crop dialog → uploads
 * to the avatars bucket → persists via setAvatarAction.
 */
export function AvatarUploadButton({ userId, children, className }: Props) {
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
      setError("Use JPG, PNG, or WEBP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Image must be 10 MB or smaller.");
      return;
    }
    setFile(f);
    setOpen(true);
  }

  async function onSave(blob: Blob, mimeType: string) {
    setSaving(true);
    setError(null);
    try {
      const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, {
        cacheControl: "3600",
        upsert: false,
        contentType: mimeType,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const result = await setAvatarAction(data.publicUrl);
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
      <button
        type="button"
        onClick={pick}
        aria-label="Change profile photo"
        className={cn(
          "group relative inline-flex shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
      >
        {children}
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 inline-flex size-7 items-center justify-center rounded-full border-[3px] border-background bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-110 group-active:scale-95"
        >
          <Camera className="size-3.5" />
        </span>
      </button>
      <ImageCropDialog
        open={open}
        onOpenChange={(next) => { if (!saving) setOpen(next); if (!next) setFile(null); }}
        file={file}
        aspectRatios={AVATAR_ASPECTS}
        defaultRatioId="1/1"
        cropShape="round"
        title="Update profile photo"
        description="Center yourself in the frame and zoom to taste."
        saving={saving}
        error={error}
        onSave={onSave}
      />
    </>
  );
}
