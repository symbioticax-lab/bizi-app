"use client";

import { cn } from "@/lib/utils";

/**
 * Selectable card used in single-choice onboarding steps. Renders a radio
 * input under the hood so the parent <form> submits cleanly without any
 * client-side state. Two cards in the same form group (same `name`) become
 * mutually exclusive automatically.
 */
export function OptionCard({
  name,
  value,
  title,
  description,
  icon,
  defaultChecked,
}: {
  name: string;
  value: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  defaultChecked?: boolean;
}) {
  const id = `${name}-${value}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.04] p-4 backdrop-blur-md transition-all",
        "hover:border-white/20 hover:bg-white/[0.07]",
        "has-[:checked]:border-primary/60 has-[:checked]:bg-primary/[0.12] has-[:checked]:shadow-[0_0_30px_-12px_hsl(var(--primary)/0.55)]",
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      {icon && (
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-foreground">{title}</p>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      <span
        className={cn(
          "mt-1 size-4 shrink-0 rounded-full border-2 border-white/30 transition-colors",
          "peer-checked:border-primary peer-checked:bg-primary",
        )}
      />
    </label>
  );
}
