import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/travel/trip-card";
import { getCityBySlug } from "@/lib/travel/cities";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { city: string } }) {
  const city = getCityBySlug(params.city);
  return { title: city ? `${city.name} · Travel · BIZI` : "City · Travel · BIZI" };
}

export default async function CityFeedPage({ params }: { params: { city: string } }) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // NOTE: trips.user_id references auth.users (not public.profiles), so PostgREST
  // can't embed `profiles(...)` here — doing so errors the whole query. We fetch
  // trips first, then their authors' profiles separately, and merge in code.
  // Typed as plain string (not string-literal) so the FULL and BASE queries
  // share one generic result type — lets the fallback reassignment type-check.
  const FULL: string = "id, user_id, destination, title, begin_date, end_date, available_for_hire, purpose, opportunity_type, description, cover_image_url";
  const BASE: string = "id, user_id, destination, begin_date, end_date, available_for_hire, purpose, description";

  let res = await supabase.from("trips").select(FULL).eq("destination", city.slug).order("begin_date", { ascending: true });
  if (res.error?.code === "42703" || res.error?.code === "PGRST204") {
    res = await supabase.from("trips").select(BASE).eq("destination", city.slug).order("begin_date", { ascending: true });
  }
  type TripRow = {
    id: string; user_id: string; destination: string; title: string | null;
    begin_date: string; end_date: string; available_for_hire: boolean;
    purpose: string; opportunity_type: string | null; description: string | null;
    cover_image_url: string | null;
  };
  const rawTrips = (res.data ?? []) as unknown as TripRow[];

  // Fetch author profiles in a single query and attach them to each trip.
  const authorIds = [...new Set(rawTrips.map((t) => t.user_id))];
  const { data: authorProfiles } = authorIds.length
    ? await supabase.from("profiles").select("id, username, display_name, avatar_url, skills").in("id", authorIds)
    : { data: [] as Array<{ id: string; username: string; display_name: string; avatar_url: string | null; skills?: string[] }> };
  const profileMap = new Map((authorProfiles ?? []).map((p) => [p.id, p as { id: string; username: string; display_name: string; avatar_url: string | null }]));

  const trips = rawTrips.map((t) => {
    const p = profileMap.get(t.user_id);
    return {
      ...t,
      profiles: p
        ? { id: p.id, username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }
        : null,
    };
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter((t) => t.end_date >= today);
  const past = trips.filter((t) => t.end_date < today);

  return (
    <div className="container max-w-2xl py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild size="icon" variant="ghost" className="-ml-1 shrink-0">
          <Link href="/travel" aria-label="Back to Travel">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>

        {/* City gradient badge */}
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(135deg, ${city.from}, ${city.to})` }}
          aria-hidden
        >
          <Plane className="size-4 text-white" />
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{city.name}</h1>
          <p className="text-xs text-muted-foreground">
            {upcoming.length === 0
              ? "No upcoming travelers yet"
              : `${upcoming.length} upcoming traveler${upcoming.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {/* Upcoming trips */}
      {upcoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Upcoming
          </h2>
          {upcoming.map((t) => (
            <TripCard key={t.id} trip={t as never} viewerId={user?.id ?? null} />
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-base font-medium">No upcoming travelers</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to add a trip to {city.name}.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/travel/travelogue">Add a trip</Link>
          </Button>
        </div>
      )}

      {/* Past trips */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Past
          </h2>
          {past.map((t) => (
            <TripCard key={t.id} trip={t as never} viewerId={user?.id ?? null} />
          ))}
        </section>
      )}
    </div>
  );
}
