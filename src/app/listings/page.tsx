import { redirect } from "next/navigation";

/**
 * Listings discovery now lives at "/" (the default Discover surface).
 * Preserve the old /listings URL by forwarding the query string through.
 */
export default function ListingsRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
  }
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
