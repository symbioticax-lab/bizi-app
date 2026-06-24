import Link from "next/link";
import Image from "next/image";
import { Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCityBySlug, getTripOpportunityType } from "@/lib/travel/cities";

type ProfileTrip = {
  id: string;
  destination: string;
  title: string | null;
  begin_date: string;
  end_date: string;
  purpose: string;
  opportunity_type: string | null;
  available_for_hire: boolean;
  description: string | null;
  cover_image_url: string | null;
};

function formatDateRange(begin: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const b = new Date(begin + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  if (begin === end) return fmt(begin);
  if (b.getFullYear() !== e.getFullYear())
    return `${fmt(begin)}, ${b.getFullYear()} – ${fmt(end)}, ${e.getFullYear()}`;
  return `${fmt(begin)} – ${fmt(end)}`;
}

export function ProfileTripsSection({ trips }: { trips: ProfileTrip[] }) {
  if (trips.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plane className="size-4 text-primary" />
          Upcoming Travel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {trips.map((trip) => {
          const city = getCityBySlug(trip.destination);
          const oppType = trip.opportunity_type ? getTripOpportunityType(trip.opportunity_type) : null;
          const purposeLabel = trip.purpose.charAt(0).toUpperCase() + trip.purpose.slice(1);

          return (
            <Link
              key={trip.id}
              href={`/travel/${trip.destination}`}
              className="group -mx-2 flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              {/* City gradient tile or cover thumbnail */}
              <div className="relative mt-0.5 size-10 shrink-0 overflow-hidden rounded-lg">
                {trip.cover_image_url ? (
                  <Image
                    src={trip.cover_image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div
                    className="size-full"
                    style={
                      city
                        ? { background: `linear-gradient(135deg, ${city.from}, ${city.to})` }
                        : { background: "#374151" }
                    }
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                {trip.title && (
                  <p className="text-sm font-semibold leading-snug group-hover:underline">
                    {trip.title}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-sm font-medium ${trip.title ? "text-muted-foreground" : "group-hover:underline"}`}>
                    {city?.name ?? trip.destination}
                  </span>
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
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {trip.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
