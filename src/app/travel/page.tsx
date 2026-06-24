import Link from "next/link";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CityCard } from "@/components/travel/city-card";
import { CITIES } from "@/lib/travel/cities";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Travel · BIZI" };

export default async function TravelPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Count trips per city for the "N travelers" metadata
  const { data: counts } = await supabase
    .from("trips")
    .select("destination")
    .gte("end_date", new Date().toISOString().slice(0, 10));

  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    countMap[row.destination] = (countMap[row.destination] ?? 0) + 1;
  }

  return (
    <div className="container max-w-2xl py-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Travel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover who&apos;s traveling and where
          </p>
        </div>

        <Button asChild variant="secondary" className="gap-2 rounded-full px-4">
          <Link href="/travel/travelogue">
            <Plane className="size-4" />
            Travelogue
          </Link>
        </Button>
      </div>

      {/* City grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CITIES.map((city) => (
          <CityCard
            key={city.slug}
            city={city}
            count={countMap[city.slug] ?? 0}
          />
        ))}

        {/* Coming soon — non-interactive placeholder after the last city */}
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center"
          style={{ minHeight: 200 }}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Plane className="size-5" />
          </span>
          <p className="mt-3 text-base font-semibold">More cities coming soon</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;re expanding fast — check back for new destinations.
          </p>
        </div>
      </div>
    </div>
  );
}
