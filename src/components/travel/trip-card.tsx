import Link from "next/link";
import Image from "next/image";
import { Briefcase, Camera, Calendar, PartyPopper, Plane, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TapButton } from "@/components/profile/tap-button";
import { RequestSessionDialog } from "@/components/travel/request-session-dialog";
import { getTripOpportunityType, getTripProximity, getCityBySlug } from "@/lib/travel/cities";
import { initials, cn } from "@/lib/utils";

type TripCardTrip = {
  id: string;
  user_id: string;
  destination: string;
  title: string | null;
  begin_date: string;
  end_date: string;
  available_for_hire: boolean;
  purpose: string;
  opportunity_type: string | null;
  description: string | null;
  cover_image_url?: string | null;
  profiles: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

const PURPOSE_ICONS: Record<string, React.ReactNode> = {
  travel:  <Plane       className="size-3" />,
  work:    <Briefcase   className="size-3" />,
  shoot:   <Camera      className="size-3" />,
  event:   <PartyPopper className="size-3" />,
  leisure: <Calendar    className="size-3" />,
};

function formatDateRange(begin: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const b = new Date(begin + "T12:00:00");
  const e = new Date(end   + "T12:00:00");
  if (begin === end) return fmt(begin);
  if (b.getFullYear() !== e.getFullYear())
    return `${fmt(begin)}, ${b.getFullYear()} – ${fmt(end)}, ${e.getFullYear()}`;
  return `${fmt(begin)} – ${fmt(end)}`;
}

export function TripCard({ trip, viewerId }: { trip: TripCardTrip; viewerId?: string | null }) {
  const profile  = trip.profiles;
  const oppType  = trip.opportunity_type ? getTripOpportunityType(trip.opportunity_type) : null;
  const city     = getCityBySlug(trip.destination);
  const isOwn    = Boolean(viewerId && viewerId === trip.user_id);
  const today    = new Date().toISOString().slice(0, 10);
  const isPast   = trip.end_date < today;
  const proximity = getTripProximity(trip.begin_date, trip.end_date);
  const purposeLabel = trip.purpose.charAt(0).toUpperCase() + trip.purpose.slice(1);
  const detailHref = `/travel/${trip.destination}/${trip.id}`;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Cover image */}
      {trip.cover_image_url && (
        <Link href={detailHref} className="block relative aspect-[16/7] w-full">
          <Image
            src={trip.cover_image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 640px"
          />
          {/* Opportunity type tag overlaid on cover */}
          {oppType && (
            <div className="absolute bottom-2 left-3">
              <span className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                oppType.badgeClass,
              )}>
                {oppType.label}
              </span>
            </div>
          )}
        </Link>
      )}

      <div className="space-y-3 p-4">
        {/* Title */}
        {trip.title && (
          <Link href={detailHref} className="block">
            <p className="text-sm font-semibold leading-snug hover:underline">{trip.title}</p>
          </Link>
        )}

        {/* Profile row */}
        <div className="flex items-center gap-3">
          {profile ? (
            <Link href={`/profile/${profile.username}`} className="shrink-0">
              <Avatar className="size-8">
                <AvatarImage src={profile.avatar_url ?? undefined} alt="" />
                <AvatarFallback className="text-xs">{initials(profile.display_name)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-xs">?</AvatarFallback>
            </Avatar>
          )}

          <div className="min-w-0 flex-1">
            {profile ? (
              <Link href={`/profile/${profile.username}`} className="block truncate text-sm font-medium hover:underline">
                {profile.display_name}
              </Link>
            ) : (
              <span className="block truncate text-sm font-medium text-muted-foreground">Unknown</span>
            )}

            {/* Proximity label when imminent, date range otherwise */}
            {proximity ? (
              <p className="text-xs font-medium text-primary">{proximity}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {formatDateRange(trip.begin_date, trip.end_date)}
              </p>
            )}
          </div>

          {/* Badges */}
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <Badge variant="secondary" className="gap-1 text-xs capitalize">
              {PURPOSE_ICONS[trip.purpose] ?? null}
              {purposeLabel}
            </Badge>
            {trip.available_for_hire && (
              <Badge className="text-xs">Available</Badge>
            )}
          </div>
        </div>

        {/* Opportunity type badge (no cover image) */}
        {oppType && !trip.cover_image_url && (
          <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            oppType.badgeClass,
          )}>
            {oppType.label}
          </span>
        )}

        {/* Description */}
        {trip.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {trip.description}
          </p>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
          <div className="flex items-center gap-2">
            {/* Tap — hidden for own trips */}
            {profile && !isOwn && (
              <TapButton
                targetType="profile"
                targetId={profile.id}
                ownerId={profile.id}
                variant="compact"
              />
            )}
            {/* Request a Session — hidden only for own trips and past trips */}
            {!isOwn && !isPast && (
              <RequestSessionDialog
                tripId={trip.id}
                beginDate={trip.begin_date}
                endDate={trip.end_date}
                travelerName={profile?.display_name ?? "this traveler"}
                cityName={city?.name ?? trip.destination}
                variant="compact"
              />
            )}
          </div>

          {/* View details */}
          <Link
            href={detailHref}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View details
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export type { TripCardTrip };
