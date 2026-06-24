"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
};

export const Switch = React.forwardRef<HTMLInputElement, Props>(
  ({ className, label, description, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card/50 p-3 text-sm transition-colors hover:bg-card has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
          className,
        )}
      >
        <span className="relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary"
          />
          <span
            aria-hidden
            className="absolute left-0.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-foreground shadow transition-all peer-checked:left-[calc(100%-1.375rem)] peer-checked:bg-primary-foreground"
          />
        </span>
        {(label || description) && (
          <span className="flex-1">
            {label && <span className="block font-medium leading-tight">{label}</span>}
            {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
          </span>
        )}
      </label>
    );
  },
);
Switch.displayName = "Switch";
