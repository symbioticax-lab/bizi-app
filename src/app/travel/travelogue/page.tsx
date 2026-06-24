import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateTripDialog } from "@/components/travel/create-trip-dialog";
import { DeleteTripButton } from "@/components/travel/travelogue-client";
import { SessionRequestsList } from "@/components/travel/session-requests-list";
import { getCityBySlug, getTripOpportunityType } from "@/lib/travel/cities";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Travelogue · BIZI" };

function formatDateRange(begin: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (begin === end) return fmt(begin);
  return `${fmt(begin)} – ${fmt(end)}`;
}

export default async function TraveloguePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/travel/travelogue");

  const FULL: string = "id, destination, title, begin_date, end_date, available_for_hire, purpose, opportunity_type, description, cover_image_url";
  const BASE: string = "id, destination, begin_date, end_date, available_for_hire, purpose, description";

  let tRes = await supabase.from("trips").select(FULL).eq("user_id", user.id).order("begin_date", { ascending: true });
  if (tRes.error?.code === "42703" || tRes.error?.code === "PGRST204") {
    tRes = await supabase.from("trips").select(BASE).eq("user_id", user.id).order("begin_date", { ascending: true });
  }
  type TripRow = {
    id: string; destination: string; title: string | null;
    begin_date: string; end_date: string; available_for_hire: boolean;
    purpose: string; opportunity_type: string | null;
    description: string | null; cover_image_url: string | null;
  };
  const trips = (tRes.data ?? []) as unknown as TripRow[];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter((t) => t.end_date >= today);
  const past = trips.filter((t) => t.end_date < today);

  // Fetch incoming session/connect requests for all the user's trips
  const tripIds = trips.map((t) => t.id);
  let sessionRequests: Array<{
    id: string; trip_id: string; type: string; proposed_date: string | null;
    message: string | null; status: string; created_at: string;
    requester: { display_name: string; username: string; avatar_url: string | null } | null;
  }> = [];

  if (tripIds.length > 0) {
    const { data: reqRows } = await supabase
      .from("trip_session_requests")
      .select("id, trip_id, type, proposed_date, message, status, created_at, requester_id")
      .eq("traveler_id", user.id)
      .in("trip_id", tripIds)
      .order("created_at", { ascending: false });

    if (reqRows?.length) {
      const requesterIds = [...new Set(reqRows.map((r) => r.requester_id))];
      const { data: reqProfiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", requesterIds);
      const pMap = new Map((reqProfiles ?? []).map((p) => [p.id, p]));
      sessionRequests = reqRows.map((r) => ({
        ...r,
        requester: pMap.get(r.requester_id) ?? null,
      }));
    }
  }

  return (
    <div className="container max-w-2xl space-y-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost" className="-ml-1 shrink-0">
            <Link href="/travel" aria-label="Back to Travel">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Travelogue</h1>
            <p className="text-xs text-muted-foreground">Your upcoming trips</p>
          </div>
        </div>

        <CreateTripDialog />
      </div>

      {/* Content */}
      {upcoming.length === 0 && past.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <MapPin className="mb-3 size-8 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No trips added</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Hit + to broadcast where you&apos;re headed.
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Upcoming
              </h2>
              {upcoming.map((trip) => {
                const requests = sessionRequests.filter((r) => r.trip_id === trip.id);
                return (
                  <div key={trip.id} className="space-y-2">
                    <TripRow trip={trip} requestCount={requests.filter(r => r.status === "pending").length} />
                    {requests.length > 0 && <SessionRequestsList requests={requests} />}
                  </div>
                );
              })}
            </section>
          )}

          {/* Pending requests banner */}
          {sessionRequests.filter(r => r.status === "pending").length > 0 && upcoming.length === 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Requests
              </h2>
              <SessionRequestsList requests={sessionRequests.filter(r => r.status === "pending")} />
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Past
              </h2>
              {past.map((trip) => (
                <TripRow key={trip.id} trip={trip} requestCount={0} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TripRow({
  trip,
  requestCount = 0,
}: {
  trip: {
    id: string;
    destination: string;
    title: string | null;
    begin_date: string;
    end_date: string;
    available_for_hire: boolean;
    purpose: string;
    opportunity_type: string | null;
    description: string | null;
    cover_image_url: string | null;
  };
  requestCount?: number;
}) {
  const city = getCityBySlug(trip.destination);
  const oppType = trip.opportunity_type ? getTripOpportunityType(trip.opportunity_type) : null;
  const purposeLabel = trip.purpose.charAt(0).toUpperCase() + trip.purpose.slice(1);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Cover image thumbnail strip */}
      {trip.cover_image_url && (
        <div className="relative h-24 w-full">
          <Image
            src={trip.cover_image_url}
            alt=""
            fill
            className="object-cover"
            sizes="640px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <div className="flex items-start gap-3 p-4">
        {/* City color dot */}
        <div
          className="mt-0.5 size-9 shrink-0 rounded-lg"
          style={
            city
              ? { background: `linear-gradient(135deg, ${city.from}, ${city.to})` }
              : { background: "#374151" }
          }
          aria-hidden
        />

        <div className="min-w-0 flex-1 space-y-1">
          {trip.title && (
            <p className="text-sm font-semibold leading-snug">{trip.title}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/travel/${trip.destination}`}
              className="text-sm font-medium hover:underline"
            >
              {city?.name ?? trip.destination}
            </Link>
            <Badge variant="secondary" className="text-xs capitalize">{purposeLabel}</Badge>
            {trip.available_for_hire && (
              <Badge className="text-xs">Available</Badge>
            )}
          </div>
          {oppType && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${oppType.badgeClass}`}>
              {oppType.label}
            </span>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDateRange(trip.begin_date, trip.end_date)}
          </p>
          {trip.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{trip.description}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {requestCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground tabular-nums">
              {requestCount}
            </span>
          )}
          <DeleteTripButton tripId={trip.id} />
        </div>
      </div>
    </div>
  );
}
