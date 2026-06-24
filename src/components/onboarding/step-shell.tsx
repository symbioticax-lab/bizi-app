import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProgressDots } from "./progress-dots";

/**
 * Common chrome for an onboarding step.
 * - Top: optional back chevron + progress dots
 * - Middle: heading + subheading
 * - Body: children (the actual question content)
 * - Bottom: caller-provided CTA row (passed as `footer`)
 */
export function StepShell({
  step,
  total,
  backHref,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  skipHref,
}: {
  step: number;
  total: number;
  backHref?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  skipHref?: string;
}) {
  return (
    <div className="flex w-full flex-1 flex-col">
      <header className="flex items-center justify-between pb-6">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Back"
            className="-ml-2 inline-flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </Link>
        ) : (
          <span className="size-9" />
        )}
        <ProgressDots current={step} total={total} />
        {skipHref ? (
          <Link
            href={skipHref}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </Link>
        ) : (
          <span className="size-9" />
        )}
      </header>

      <div className="flex flex-1 flex-col">
        <div className="space-y-2 pb-6">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col">{children}</div>

        {footer && <div className="pt-4">{footer}</div>}
      </div>
    </div>
  );
}
