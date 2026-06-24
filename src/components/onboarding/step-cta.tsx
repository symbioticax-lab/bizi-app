"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ContinuePill({
  children = "Continue",
  variant = "primary",
}: {
  children?: React.ReactNode;
  variant?: "primary" | "white";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(
        "h-12 w-full gap-2 rounded-full text-base font-medium",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-white text-black shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] hover:bg-white/90",
      )}
    >
      {pending ? "…" : children}
      {!pending && <ArrowRight className="size-4" />}
    </Button>
  );
}
