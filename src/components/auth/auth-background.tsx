import Image from "next/image";

/**
 * Full-bleed photographic background for the auth pages — a frosted handshake
 * over a blue/violet wash. Layered legibility scrims keep the foreground logo
 * and form readable while the photo stays the focal point. Sits in an
 * absolutely-positioned, pointer-events-none container so it never blocks input.
 */
export function AuthBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/auth-bg.png"
        alt=""
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Vertical legibility scrim — darker at the top (logo) and bottom (form)
         where text sits, lighter through the middle so the handshake reads. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)/0.80)_0%,hsl(var(--background)/0.30)_28%,hsl(var(--background)/0.32)_54%,hsl(var(--background)/0.82)_100%)]" />

      {/* Edge vignette to focus the centre column. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_45%,transparent_55%,hsl(var(--background)/0.55)_100%)]" />

      {/* Faint lime glow at the very bottom to tie the photo into BIZI's accent. */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[radial-gradient(ellipse_55%_70%_at_50%_100%,hsl(var(--primary)/0.10),transparent_70%)]" />
    </div>
  );
}
