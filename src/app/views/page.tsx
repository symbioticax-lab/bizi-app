import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, User, FileText, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertsTabsServer } from "@/components/nav/alerts-tabs-server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTier } from "@/lib/subscription/server";
import { initials, formatRelative, cn } from "@/lib/utils";

export const metadata = { title: "Views · BIZI" };

type ViewRow = {
  id: string;
  viewer_id: string;
  target_type: "profile" | "listing";
  target_id: string;
  viewed_at: string;
  seen: boolean;
};
type Viewer = { id: string; username: string; display_name: string; avatar_url: string | null };

export default async function ViewsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/views");

  const tier = await getUserTier();
  const canSeeViewers = tier === 'pro';

  // content_views is service-role only.
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("content_views")
    .select("id, viewer_id, target_type, target_id, viewed_at, seen")
    .eq("owner_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(100);

  const views = (rows ?? []) as ViewRow[];

  const viewerIds = [...new Set(views.map((v) => v.viewer_id))];
  const listingIds = [
    ...new Set(views.filter((v) => v.target_type === "listing").map((v) => v.target_id)),
  ];

  const [viewersRes, listingsRes] = await Promise.all([
    viewerIds.length
      ? supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", viewerIds)
      : Promise.resolve({ data: [] as Viewer[] }),
    listingIds.length
      ? supabase.from("opportunities").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const viewerById = new Map<string, Viewer>();
  for (const v of (viewersRes.data ?? []) as Viewer[]) viewerById.set(v.id, v);
  const listingTitleById = new Map<string, string>();
  for (const l of (listingsRes.data ?? []) as { id: string; title: string }[]) {
    listingTitleById.set(l.id, l.title);
  }

  // Now that the tab is open, clear the "new" flag on these views.
  await admin.from("content_views").update({ seen: true }).eq("owner_id", user.id).eq("seen", false);

  return (
    <>
      <AlertsTabsServer />
      <div className="container max-w-2xl space-y-4 py-6">
        <p className="text-sm text-muted-foreground">
          People who checked out your profile and listings.
        </p>

        {!canSeeViewers && views.length > 0 && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex gap-4 items-start">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Zap className="size-5" />
            </span>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm font-semibold">
                {views.length} {views.length === 1 ? 'person' : 'people'} viewed your profile
              </p>
              <p className="text-sm text-muted-foreground">
                Upgrade to Bizi Plus to see exactly who's checking you out.
              </p>
              <Button asChild size="sm">
                <Link href="/upgrade?tier=pro&billing=annual">See who viewed you →</Link>
              </Button>
            </div>
          </div>
        )}

        {views.length === 0 ? (
          <EmptyViews />
        ) : canSeeViewers ? (
          <ul className="space-y-2">
            {views.map((v) => {
              const viewer = viewerById.get(v.viewer_id);
              if (!viewer) return null;
              const listingTitle =
                v.target_type === "listing"
                  ? listingTitleById.get(v.target_id) ?? "a listing"
                  : null;
              return (
                <ViewRowItem key={v.id} view={v} viewer={viewer} listingTitle={listingTitle} />
              );
            })}
          </ul>
        ) : (
          // Free users see blurred placeholder rows
          <ul className="space-y-2 pointer-events-none select-none" aria-hidden>
            {views.slice(0, 5).map((v) => (
              <li key={v.id}>
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] glass p-4 blur-[3px]">
                  <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 rounded bg-muted" />
                    <div className="h-2.5 w-20 rounded bg-muted" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function ViewRowItem({
  view,
  viewer,
  listingTitle,
}: {
  view: ViewRow;
  viewer: Viewer;
  listingTitle: string | null;
}) {
  const isListing = view.target_type === "listing";

  return (
    <li>
      <Link
        href={`/profile/${viewer.username}`}
        className={cn(
          "flex items-center gap-3 rounded-xl border glass p-4 transition-colors hover:border-primary/40",
          view.seen ? "border-white/[0.06]" : "border-primary/40",
        )}
      >
        <Avatar className="h-10 w-10 shrink-0">
          {viewer.avatar_url && <AvatarImage src={viewer.avatar_url} alt="" />}
          <AvatarFallback>{initials(viewer.display_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-medium">{viewer.display_name}</span>{" "}
            <span className="text-foreground/90">
              {isListing ? "viewed your listing" : "viewed your profile"}
            </span>
            {isListing && listingTitle && (
              <> <span className="font-medium">{listingTitle}</span></>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            @{viewer.username} · {formatRelative(view.viewed_at)}
          </p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          {isListing ? <FileText className="size-4" /> : <User className="size-4" />}
        </span>
      </Link>
    </li>
  );
}

function EmptyViews() {
  return (
    <Card>
      <CardContent className="space-y-3 p-10 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Eye className="size-5" />
        </span>
        <p className="text-base font-medium">No views yet</p>
        <p className="text-sm text-muted-foreground">
          When someone opens your profile or one of your listings, you&apos;ll see them here.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Browse listings</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
