import Link from "next/link";
import { redirect } from "next/navigation";
import { Hand, User, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertsTabsServer } from "@/components/nav/alerts-tabs-server";
import { createClient } from "@/lib/supabase/server";
import { tapCutoffIso } from "@/lib/taps";
import { initials, formatRelative, cn } from "@/lib/utils";

export const metadata = { title: "Taps · BIZI" };

type Tapper = { id: string; username: string; display_name: string; avatar_url: string | null };
type TapRow = {
  id: string;
  created_at: string;
  seen: boolean;
  target_type: "profile" | "listing";
  target_id: string;
  tapper: Tapper | null;
};

export default async function TapsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/taps");

  // Only taps from the last 24h — older ones have expired.
  const { data: rows } = await supabase
    .from("taps")
    .select(
      "id, created_at, seen, target_type, target_id, tapper:profiles!taps_tapper_id_fkey(id, username, display_name, avatar_url)",
    )
    .eq("owner_id", user.id)
    .gte("created_at", tapCutoffIso())
    .order("created_at", { ascending: false });

  const taps = (rows ?? []) as unknown as TapRow[];

  // Resolve titles for any listing taps.
  const listingIds = [
    ...new Set(taps.filter((t) => t.target_type === "listing").map((t) => t.target_id)),
  ];
  const listingTitle = new Map<string, string>();
  if (listingIds.length > 0) {
    const { data } = await supabase
      .from("opportunities")
      .select("id, title")
      .in("id", listingIds);
    for (const l of (data ?? []) as { id: string; title: string }[]) {
      listingTitle.set(l.id, l.title);
    }
  }

  // Now that the tab is open, clear the "new" flag on these taps.
  await supabase.from("taps").update({ seen: true }).eq("owner_id", user.id).eq("seen", false);

  return (
    <>
      <AlertsTabsServer />
      <div className="container max-w-2xl space-y-4 py-6">
        <p className="text-sm text-muted-foreground">
          People showing interest in your profile and listings.
        </p>

        {taps.length === 0 ? (
          <EmptyTaps />
        ) : (
          <ul className="space-y-2">
            {taps.map((t) =>
              t.tapper ? (
                <TapRowItem
                  key={t.id}
                  tap={t}
                  tapper={t.tapper}
                  listingName={
                    t.target_type === "listing"
                      ? listingTitle.get(t.target_id) ?? "a listing"
                      : null
                  }
                />
              ) : null,
            )}
          </ul>
        )}
      </div>
    </>
  );
}

function TapRowItem({
  tap,
  tapper,
  listingName,
}: {
  tap: TapRow;
  tapper: Tapper;
  listingName: string | null;
}) {
  const isListing = tap.target_type === "listing";

  return (
    <li>
      <Link
        href={`/profile/${tapper.username}`}
        className={cn(
          "flex items-center gap-3 rounded-xl border glass p-4 transition-colors hover:border-primary/40",
          tap.seen ? "border-white/[0.06]" : "border-primary/40",
        )}
      >
        <Avatar className="h-10 w-10 shrink-0">
          {tapper.avatar_url && <AvatarImage src={tapper.avatar_url} alt="" />}
          <AvatarFallback>{initials(tapper.display_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-medium">{tapper.display_name}</span>{" "}
            <span className="text-foreground/90">
              {isListing ? "tapped your listing" : "tapped your profile"}
            </span>
            {isListing && listingName && (
              <> <span className="font-medium">{listingName}</span></>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            @{tapper.username} · {formatRelative(tap.created_at)}
          </p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          {isListing ? <FileText className="size-4" /> : <User className="size-4" />}
        </span>
      </Link>
    </li>
  );
}

function EmptyTaps() {
  return (
    <Card>
      <CardContent className="space-y-3 p-10 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Hand className="size-5" />
        </span>
        <p className="text-base font-medium">No taps yet</p>
        <p className="text-sm text-muted-foreground">
          When someone taps your profile or a listing to show interest, they&apos;ll show up here.
        </p>
        <Button asChild variant="outline">
          <Link href="/people">Discover people</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
