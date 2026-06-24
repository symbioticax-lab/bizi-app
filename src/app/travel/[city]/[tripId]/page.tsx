import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { OpportunityCard } from "@/components/opportunity/card";
import { TapButton } from "@/components/profile/tap-button";
import { BookmarkButton } from "@/components/saved/bookmark-button";
import { ConnectTripDialog } from "@/components/travel/connect-trip-dialog";
import { RequestSessionForm } from "@/components/travel/request-session-form";
import { RequestSessionDialog } from "@/components/travel/request-session-dialog";
import { getCityBySlug, getTripOpportunityType, getTripProximity } from "@/lib/travel/cities";
import { createClient } from "@/lib/supabase/server";
import { cn, initials } from "@/lib/utils";
import type { Opportunity } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { city: string; tripId: string } }) {
  const city = getCityBySlug(params.city);
  return { title: city ? `Trip · ${city.name} · BIZI` : "Trip · BIZI" };
}

type ListOpportunity = Pick<
  Opportunity,
  "id" | "title" | "category" | "offering_title" | "want_title" | "image_urls" | "created_at" | "owner_id" | "intent"
> & { view_count?: number };

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export default async function TripDetailPage({
  params,
}: {
  params: { city: string; tripId: string };
}) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch trip with schema fallback
  const TRIP_FULL = "id, user_id, destination, title, begin_date, end_date, available_for_hire, purpose, opportunity_type, description, cover_image_url";
  const TRIP_BASE = "id, user_id, destination, begin_date, end_date, available_for_hire, purpose, description";
  let tripRes = await supabase.from("trips").select(TRIP_FULL).eq("id", params.tripId).maybeSingle();
  if (tripRes.error?.code === "42703" || tripRes.error?.code === "PGRST204") {
    tripRes = await supabase.from("trips").select(TRIP_BASE).eq("id", params.tripId).maybeSingle();
  }
  if (!tripRes.data) notFound();

  const trip = tripRes.data as {
    id: string; user_id: string; destination: string;
    begin_date: string; end_date: string; available_for_hire: boolean;
    purpose: string; title?: string | null; opportunity_type?: string | null;
    description?: string | null; cover_image_url?: string | null;
  };

  // Fetch traveler profile + listings in parallel
  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, skills")
      .eq("id", trip.user_id)
      .maybeSingle(),
    supabase
      .from("opportunities")
      .select("id, title, category, offering_title, want_title, image_urls, created_at, owner_id, intent, view_count")
      .eq("owner_id", trip.user_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const isOwn   = user?.id === trip.user_id;
  const today   = new Date().toISOString().slice(0, 10);
  const isPast  = trip.end_date < today;
  const proximity = getTripProximity(trip.begin_date, trip.end_date);
  const oppType   = trip.opportunity_type ? getTripOpportunityType(trip.opportunity_type) : null;
  const purposeLabel = trip.purpose.charAt(0).toUpperCase() + trip.purpose.slice(1);

  return (
    // Extra bottom padding on mobile to clear sticky CTA bar
    <div className="pb-32 lg:pb-16">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative h-56 w-full sm:h-72">
        {trip.cover_image_url ? (
          <Image
            src={trip.cover_image_url}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(135deg, ${city.from}, ${city.to})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="absolute left-4 top-4">
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="bg-black/40 text-white backdrop-blur-md hover:bg-black/60"
          >
            <Link href={`/travel/${params.city}`} aria-label="Back">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Responsive 2-col layout ────────────────────────────────────── */}
      <div className="container max-w-5xl pt-4">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 lg:items-start">

          {/* ── LEFT column: trip info + traveler + description + listings ── */}
          <div className="space-y-6 min-w-0">
            {/* Title + badges */}
            <div className="space-y-2">
              {trip.title && (
                <h1 className="text-2xl font-bold tracking-tight leading-tight">{trip.title}</h1>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/travel/${params.city}`}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted/50"
                >
                  <div
                    className="size-3 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${city.from}, ${city.to})` }}
                  />
                  {city.name}
                </Link>
                <Badge variant="secondary" className="text-xs capitalize">{purposeLabel}</Badge>
                {trip.available_for_hire && <Badge className="text-xs">Available for hire</Badge>}
                {oppType && (
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    oppType.badgeClass,
                  )}>
                    {oppType.label}
                  </span>
                )}
              </div>
              <p className={cn("text-sm", proximity ? "font-medium text-primary" : "text-muted-foreground")}>
                {proximity ?? `${formatDate(trip.begin_date)} – ${formatDate(trip.end_date)}`}
              </p>
            </div>

            {/* Traveler row */}
            {profile && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <Link href={`/profile/${profile.username}`}>
                  <Avatar className="size-12">
                    {profile.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                    )}
                    <AvatarFallback>{initials(profile.display_name)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${profile.username}`} className="font-semibold hover:underline">
                    {profile.display_name}
                  </Link>
                  {(profile.skills as string[])?.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {(profile.skills as string[]).slice(0, 3).join(" · ")}
                    </p>
                  )}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/profile/${profile.username}`}>View profile</Link>
                </Button>
              </div>
            )}

            {/* Description */}
            {trip.description && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed">{trip.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Inline session form — mobile/tablet only (hidden on desktop where sidebar handles it) */}
            {!isOwn && !isPast && user && (
              <div className="lg:hidden">
                <RequestSessionForm
                  tripId={trip.id}
                  beginDate={trip.begin_date}
                  endDate={trip.end_date}
                />
              </div>
            )}
            {!isOwn && !isPast && !user && (
              <div className="lg:hidden rounded-xl border border-dashed border-border p-5 text-center">
                <p className="text-sm font-medium">Want to request a session?</p>
                <Button asChild size="sm" className="mt-3">
                  <Link href={`/login?next=/travel/${params.city}/${params.tripId}`}>Sign in to schedule</Link>
                </Button>
              </div>
            )}

            {/* Traveler's active listings */}
            {listings && listings.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Their Listings
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {listings.map((o) => (
                    <OpportunityCard key={o.id} opportunity={o as ListOpportunity} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT column (sticky on desktop): scheduling + actions ─── */}
          <div className="mt-8 space-y-4 lg:mt-0 lg:sticky lg:top-20">

            {/* Request a Session */}
            {!isOwn && !isPast && user && (
              <RequestSessionForm
                tripId={trip.id}
                beginDate={trip.begin_date}
                endDate={trip.end_date}
              />
            )}

            {/* Login prompt */}
            {!isOwn && !isPast && !user && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm font-medium">Want to request a session?</p>
                <Button asChild size="sm" className="mt-3">
                  <Link href={`/login?next=/travel/${params.city}/${params.tripId}`}>
                    Sign in to request
                  </Link>
                </Button>
              </div>
            )}

            {/* Action bar */}
            {!isOwn && profile && user && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Actions
                </p>
                <div className="flex flex-wrap gap-2">
                  <ConnectTripDialog
                    tripId={trip.id}
                    travelerName={profile.display_name}
                    tripTitle={trip.title ?? null}
                    cityName={city.name}
                    variant="full"
                  />
                  <TapButton
                    targetType="profile"
                    targetId={profile.id}
                    ownerId={profile.id}
                    variant="pill"
                  />
                  <BookmarkButton itemType="profile" itemId={profile.id} />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Sticky mobile CTA — fixed above bottom nav, hidden on desktop ── */}
      {!isOwn && !isPast && (
        <div className="fixed bottom-[5rem] inset-x-0 z-30 px-4 lg:hidden">
          <RequestSessionDialog
            tripId={trip.id}
            beginDate={trip.begin_date}
            endDate={trip.end_date}
            travelerName={profile?.display_name ?? "this traveler"}
            cityName={city.name}
            variant="full"
          />
        </div>
      )}
    </div>
  );
}
