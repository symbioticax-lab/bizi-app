"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

/**
 * Right-anchored slide-in panel built directly on @radix-ui/react-dialog
 * (the centered DialogContent is unsuitable). Radix gives us the overlay,
 * focus trap, click-outside, Escape, and portal rendering for free; we add an
 * Instagram-style swipe-left-to-right gesture that drags the panel off the
 * right edge to dismiss it.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

type SheetContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /** Same setter passed to <Sheet open onOpenChange>; lets a swipe close the panel. */
  onOpenChange?: (open: boolean) => void;
};

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, onOpenChange, ...props }, ref) => {
  const [dragX, setDragX] = React.useState(0);
  const [releasing, setReleasing] = React.useState(false);
  const draggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const widthRef = React.useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
    widthRef.current = e.currentTarget.clientWidth || 1;
    draggingRef.current = true;
    setReleasing(false);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!draggingRef.current) return;
    // Only track rightward movement — the panel lives on the right edge.
    setDragX(Math.max(0, e.touches[0].clientX - startXRef.current));
  }

  function handleTouchEnd() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const dismissed = dragX > widthRef.current * 0.3;
    if (dismissed) {
      // Let Radix's slide-out animation finish the exit — drop the inline
      // transform so it isn't overridden, then close.
      setDragX(0);
      onOpenChange?.(false);
    } else {
      // Spring back to fully open.
      setReleasing(true);
      setDragX(0);
    }
  }

  // While the finger is down we follow it 1:1 (no transition); on release we
  // animate back. When idle we set no inline transform so Radix's open/close
  // slide animations remain in control.
  const transform = dragX !== 0 ? `translateX(${dragX}px)` : releasing ? "translateX(0px)" : undefined;

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={() => setReleasing(false)}
        style={{
          transform,
          transition: draggingRef.current ? "none" : "transform 0.25s ease-out",
        }}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-sm flex-col border-l glass",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          "data-[state=open]:duration-300 data-[state=closed]:duration-200",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = DialogPrimitive.Content.displayName;

export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;
