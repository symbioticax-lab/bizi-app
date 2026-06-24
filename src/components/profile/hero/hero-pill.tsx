/**
 * Glass pill used throughout the hero overlay. Translucent, hairline border,
 * backdrop-blurred so text stays legible over any underlying media.
 */
export function HeroPill({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
      {icon}
      {children}
    </span>
  );
}
