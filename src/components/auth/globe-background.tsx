/**
 * Background ornament for the auth pages: a slow-rotating wireframe globe
 * with arcs of lime light "trading" between points around it. Pure SVG +
 * CSS keyframes, no canvas / WebGL — keeps the bundle and battery footprint
 * minimal while still feeling alive.
 *
 * Two layers:
 *   1. A static-positioned globe (animated via `animate-globe-spin`) that
 *      rotates as a single 2D unit. The wireframe is dense enough that a
 *      pure 2D spin reads as a planet turning at a glance.
 *   2. Six predefined trade arcs drawn in viewBox coords, each tracing
 *      itself along the path on a staggered timer. They sit *in front* of
 *      the globe so the lime swooshes are the visual focus.
 *
 * Everything renders inside an absolutely-positioned, pointer-events-none
 * container so it never interferes with form input.
 */

const ARCS: Array<{ d: string; dur: number; delay: number }> = [
  // Each `d` is a quadratic curve: M startX startY Q controlX controlY endX endY
  // Coordinate space is a 100×100 viewBox the SVG stretches to fill.
  { d: "M 18 32 Q 50 4   82 26", dur: 6.5, delay: 0 },
  { d: "M 78 22 Q 60 60  22 70", dur: 7.5, delay: 1.4 },
  { d: "M 12 70 Q 40 92  72 76", dur: 6,   delay: 3 },
  { d: "M 86 58 Q 60 20  30 40", dur: 8,   delay: 2.2 },
  { d: "M 25 18 Q 55 50  88 72", dur: 7,   delay: 4.5 },
  { d: "M 40 86 Q 70 60  90 36", dur: 6.8, delay: 5.5 },
];

export function GlobeBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Wireframe globe — a single SVG that spins as a unit. Sized in
         viewport-min units so the proportions feel similar on phone and
         desktop. Anchored slightly above center so the arcs read like an
         orbital trade network around it. */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%]">
        <svg
          className="size-[110vmin] animate-globe-spin opacity-[0.22]"
          viewBox="-100 -100 200 200"
        >
          <defs>
            <radialGradient id="globe-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
              <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Soft inner glow disc */}
          <circle cx="0" cy="0" r="95" fill="url(#globe-glow)" />

          {/* Outer rim */}
          <circle
            cx="0"
            cy="0"
            r="95"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            strokeOpacity="0.65"
          />

          {/* Equator + parallels (latitudes) — flattened ellipses */}
          {[
            { ry: 4, op: 0.65 },
            { ry: 18, op: 0.5 },
            { ry: 34, op: 0.4 },
            { ry: 52, op: 0.32 },
            { ry: 72, op: 0.25 },
          ].map((lat, i) => {
            const r = Math.sqrt(95 * 95 - lat.ry * lat.ry);
            return (
              <g key={`lat-${i}`}>
                <ellipse
                  cx="0"
                  cy={-lat.ry}
                  rx={r}
                  ry={r * 0.18}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.35"
                  strokeOpacity={lat.op}
                />
                {lat.ry !== 4 && (
                  <ellipse
                    cx="0"
                    cy={lat.ry}
                    rx={r}
                    ry={r * 0.18}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="0.35"
                    strokeOpacity={lat.op}
                  />
                )}
              </g>
            );
          })}

          {/* Meridians — tall thin ellipses rotated around center */}
          {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map((angle) => (
            <ellipse
              key={`mer-${angle}`}
              cx="0"
              cy="0"
              rx="28"
              ry="95"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.35"
              strokeOpacity="0.4"
              transform={`rotate(${angle})`}
            />
          ))}
        </svg>
      </div>

      {/* Trade arcs — drawn on a non-rotating layer so the swooshes appear
         to travel through space, not around the globe. preserveAspectRatio
         is "none" so the arcs stretch to fill the viewport. */}
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ARCS.map((arc, i) => (
          <g key={i} filter="url(#arc-glow)">
            {/* Faint guide line — the "route" sitting behind the comet */}
            <path
              d={arc.d}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.15"
              strokeOpacity="0.12"
              strokeLinecap="round"
              pathLength={100}
              vectorEffect="non-scaling-stroke"
            />
            {/* Animated comet head tracing the path */}
            <path
              d={arc.d}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="14 100"
              vectorEffect="non-scaling-stroke"
              style={{
                animation: `trade-trace ${arc.dur}s ease-in-out ${arc.delay}s infinite`,
              }}
            />
          </g>
        ))}

        {/* Origin/destination markers — soft pulsing dots at each arc end. */}
        {ARCS.map((arc, i) => {
          const m = arc.d.match(/M\s*([\d.]+)\s+([\d.]+)\s+Q[^]*?\s([\d.]+)\s+([\d.]+)$/);
          if (!m) return null;
          const [sx, sy, ex, ey] = [m[1], m[2], m[3], m[4]];
          return (
            <g key={`pin-${i}`} style={{ transformOrigin: "center" }}>
              <circle
                cx={sx}
                cy={sy}
                r="0.6"
                fill="hsl(var(--primary))"
                style={{
                  transformOrigin: `${sx}px ${sy}px`,
                  animation: `trade-pulse 3s ease-in-out ${arc.delay}s infinite`,
                }}
              />
              <circle
                cx={ex}
                cy={ey}
                r="0.6"
                fill="hsl(var(--primary))"
                style={{
                  transformOrigin: `${ex}px ${ey}px`,
                  animation: `trade-pulse 3s ease-in-out ${arc.delay + 1.5}s infinite`,
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Glass wash — pulls the saturation back so the headline reads
         cleanly over the animation. Heavier toward the center, lighter
         at the edges where the arcs need to remain visible. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,hsl(var(--background)/0.55),transparent_75%)] backdrop-blur-[2px]" />
    </div>
  );
}
