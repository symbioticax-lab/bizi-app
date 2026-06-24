// Geographic helpers for approximate distance display.

/**
 * Great-circle distance between two lat/lng points, in miles (haversine).
 */
export function distanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3958.8; // Earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Human-friendly approximate distance label.
 * `compact` trims the wording for tight spots (e.g. next to a date).
 */
export function formatDistance(miles: number, compact = false): string {
  if (miles < 0.2) return "Nearby";
  if (miles < 1)   return compact ? "< 1 mi" : "< 1 mi away";
  if (miles < 1000) return compact ? `~${Math.round(miles)} mi` : `~${Math.round(miles)} mi away`;
  const rounded = Math.round(miles / 100) * 100;
  return compact ? `${rounded}+ mi` : `${rounded}+ mi away`;
}

type Coords = { lat?: number | null; lng?: number | null };

/**
 * Returns an approximate distance label when both points have coordinates,
 * otherwise null (caller should fall back to showing the location text).
 */
export function distanceLabel(viewer: Coords, target: Coords, compact = false): string | null {
  if (
    viewer.lat == null || viewer.lng == null ||
    target.lat == null || target.lng == null
  ) {
    return null;
  }
  return formatDistance(distanceMiles(viewer.lat, viewer.lng, target.lat, target.lng), compact);
}
