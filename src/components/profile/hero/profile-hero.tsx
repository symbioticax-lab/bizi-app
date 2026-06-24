import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  heroUrl: string | null;
  heroKind: "image" | "gif" | "video" | null;
  heroPosterUrl: string | null;
  focalX: number;
  focalY: number;
  /** When true, render owner-specific affordances (no placeholder text — the
      upload button in the topRight slot is the only CTA we show). */
  isOwner?: boolean;
  className?: string;
  /** Children render on top of the hero (identity strip, avatar, etc.). */
  children?: React.ReactNode;
  /** Optional element rendered top-right (e.g., owner-only HeroUploadButton). */
  topRight?: React.ReactNode;
};

/**
 * Editorial-style profile hero. Full-bleed media with a soft bottom fade so
 * the image dissolves into the page background — gives the hero a polished,
 * "photo embedded in the canvas" feel rather than a hard rectangle.
 *
 * Aspect ratio: 4:5 on mobile (tall, magazine cover feel), 21:9 on desktop.
 */
export function ProfileHero({
  heroUrl,
  heroKind,
  heroPosterUrl,
  focalX,
  focalY,
  isOwner,
  className,
  children,
  topRight,
}: Props) {
  const objectPosition = `${(focalX * 100).toFixed(2)}% ${(focalY * 100).toFixed(2)}%`;

  return (
    <div
      id="profile-hero"
      className={cn(
        "relative isolate overflow-hidden",
        // Magazine cover on mobile, banner on desktop
        "aspect-[4/5] w-full md:aspect-[21/9] md:rounded-2xl",
        // Match the listing upload placeholder when no hero is set
        !heroUrl && "border border-dashed border-border bg-muted/30",
        className,
      )}
      style={heroUrl ? { backgroundColor: "transparent" } : undefined}
    >
      {/* Media layer — masked so the bottom edge fades into the page background */}
      {heroUrl && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0",
            // Vertical alpha mask: fully opaque up top, fading to transparent
            // at the bottom edge so the image bleeds into the cosmic backdrop.
            "[mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)]",
            "[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)]",
          )}
        >
          {heroKind === "video" ? (
            <video
              src={heroUrl}
              poster={heroPosterUrl ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition }}
            />
          ) : (
            <Image
              src={heroUrl}
              alt=""
              fill
              priority
              quality={90}
              sizes="(max-width: 768px) 100vw, 1200px"
              unoptimized={heroKind === "gif"}
              className="object-cover"
              style={{ objectPosition }}
            />
          )}
        </div>
      )}

      {/* Gradient scrim — darkens the lower hero for overlay-text legibility,
         then fades all the way back to transparent at the very bottom edge so
         the hero dissolves into the page background by opacity instead of
         ending on a coloured band. */}
      {heroUrl && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 32%, rgba(0,0,0,0.42) 72%, rgba(0,0,0,0.62) 92%, rgba(0,0,0,0) 100%)",
          }}
        />
      )}

      {/* Top-right slot — owner edit affordances */}
      {topRight && (
        <div className="absolute right-3 top-3 z-20 md:right-5 md:top-5">
          {topRight}
        </div>
      )}

      {/* Overlay slot for identity strip, avatar, reputation strip */}
      {children && (
        <div className="absolute inset-0 z-10 flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
}
