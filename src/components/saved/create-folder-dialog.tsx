"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { createFolderAction } from "@/app/saved/actions";
import { cn } from "@/lib/utils";

const COVER_COLORS = ["#D4FF3D", "#FF6A1A", "#7C4DFF", "#22D3EE", "#F472B6", "#A3E635", "#FBBF24"] as const;

export function CreateFolderDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(COVER_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createFolderAction({
        name: name.trim(),
        description: description.trim() || null,
        coverColor: color,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setName("");
      setDescription("");
      setColor(COVER_COLORS[0]);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> New folder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create folder</DialogTitle>
          <DialogDescription>
            Folders help you organize saved profiles and listings. Make them shareable later if you'd like.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Graphic designers"
              maxLength={60}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="folder-description">Description (optional)</Label>
            <Textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection for?"
              rows={2}
              maxLength={500}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cover color</Label>
            <div className="flex flex-wrap gap-1.5">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Pick color ${c}`}
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform",
                    color === c
                      ? "border-foreground scale-110 shadow-[0_0_14px_-2px_rgba(255,255,255,0.4)]"
                      : "border-white/15",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || name.trim().length === 0}>
              {pending ? "Creating…" : "Create folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
