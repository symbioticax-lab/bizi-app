import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OpportunityCard } from "@/components/opportunity/card";
import { OwnerListingRow } from "@/components/opportunity/owner-listing-row";
import { ReviewCard } from "@/components/review/review-card";
import { ProfileItemsCard } from "@/components/profile/profile-items-card";
import { ProfileHero } from "@/components/profile/hero/profile-hero";
import { IdentityStrip } from "@/components/profile/hero/identity-strip";
import { ReputationStrip } from "@/components/profile/hero/reputation-strip";
import { HeroUploadButton } from "@/components/profile/hero/hero-upload-button";
import { AddTagsPopover } from "@/components/profile/hero/add-tags-popover";
import { BookmarkButton } from "@/components/saved/bookmark-button";
import { ShareButton } from "@/components/share-button";
import { TapButton } from "@/components/profile/tap-button";
import { StickyProfileBar } from "@/components/profile/sticky-profile-bar";
import { MobileMenu } from "@/components/nav/mobile-menu";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProfileTripsSection } from "@/components/travel/profile-trips-section";

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams: { section?: string };
}) {
  const supabase = createClient();
  const [{ data: profile }, { data: { user: viewer } }] = await Promise.all([
    supabase.from("profiles").select("*").eq("username", params.username).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (!profile) notFound();

  const isOwner = viewer?.id === profile.id;

  // Completed-trade count is a PUBLIC reputation stat, but `trades` RLS only
  // exposes rows to participants. Use the service-role client (server-only)
  // so the count is correct for every viewer, not just trade participants.
  const admin = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: opportunities },
    { data: drafts },
    { data: reviews },
    { data: offeringsData },
    { data: wantsData },
    { count: completedTrades },
  ] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id, title, category, offering_title, want_title, image_urls, status, created_at, owner_id, intent")
      .eq("owner_id", profile.id)
      // Owner sees both active + paused so they can manage from here.
      // Visitors only see active. Drafts are shown in the separate Drafts tab.
      .in("status", isOwner ? ["active", "paused"] : ["active"])
      .order("created_at", { ascending: false }),
    // Draft listings — owner-only, shown in the Drafts tab.
    isOwner
      ? supabase
          .from("opportunities")
          .select("id, title, category, offering_title, want_title, image_urls, status, created_at, owner_id, intent")
          .eq("owner_id", profile.id)
          .eq("status", "draft")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("reviews")
      .select("id, rating, comment, tags, created_at, reviewer:profiles!reviews_reviewer_id_fkey(username, display_name, avatar_url)")
      .eq("reviewee_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("offerings")
      .select("id, title, description, category, tags")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("wants")
      .select("id, title, description, category, tags")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    admin
      .from("trades")
      .select("id", { count: "exact", head: true })
      .or(`owner_id.eq.${profile.id},seeker_id.eq.${profile.id}`)
      .eq("status", "completed"),
  ]);

  // Connections — fetch all accepted connections for this profile, then look up
  // the other side's basic info (two queries; connections query can't join easily).
  const { data: connectionRows } = await supabase
    .from("connections")
    .select("requester_id, recipient_id")
    .or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
    .eq("status", "accepted");

  const connectedUserIds = (connectionRows ?? []).map(
    (c: { requester_id: string; recipient_id: string }) =>
      c.requester_id === profile.id ? c.recipient_id : c.requester_id,
  );
  const { data: connProfilesData } = connectedUserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", connectedUserIds)
        .limit(12)
    : { data: [] as Array<{ id: string; username: string; display_name: string; avatar_url: string | null }> };
  const connectedUsers = (connProfilesData ?? []) as Array<{ id: string; username: string; display_name: string; avatar_url: string | null }>;

  // Trips query uses a fallback so new optional columns don't break the profile
  // page if migrations haven't been applied to the DB yet.
  const TRIPS_FULL: string = "id, destination, title, begin_date, end_date, purpose, opportunity_type, available_for_hire, description, cover_image_url";
  const TRIPS_BASE: string = "id, destination, begin_date, end_date, purpose, available_for_hire, description";
  let tripsRes = await supabase.from("trips").select(TRIPS_FULL).eq("user_id", profile.id).gte("end_date", today).order("begin_date", { ascending: true }).limit(5);
  if (tripsRes.error?.code === "42703" || tripsRes.error?.code === "PGRST204") {
    tripsRes = await supabase.from("trips").select(TRIPS_BASE).eq("user_id", profile.id).gte("end_date", today).order("begin_date", { ascending: true }).limit(5);
  }
  const tripsData = tripsRes.data;

  const offeringList = (offeringsData ?? []) as Array<{ id: string; title: string; description: string | null; category: string | null; tags: string[] }>;
  const wantList = (wantsData ?? []) as Array<{ id: string; title: string; description: string | null; category: string | null; tags: string[] }>;
  const upcomingTrips = (tripsData ?? []) as unknown as Array<{ id: string; destination: string; title: string | null; begin_date: string; end_date: string; purpose: string; opportunity_type: string | null; available_for_hire: boolean; description: string | null; cover_image_url: string | null }>;

  // Viewer-specific social state: connection status + follow state
  let connectionStatus: "none" | "pending_sent" | "pending_received" | "connected" = "none";
  let isFollowing = false;
  if (viewer && !isOwner) {
    const [connResult, followResult] = await Promise.all([
      supabase
        .from("connections")
        .select("status, requester_id")
        .or(
          `and(requester_id.eq.${viewer.id},recipient_id.eq.${profile.id}),` +
          `and(requester_id.eq.${profile.id},recipient_id.eq.${viewer.id})`,
        )
        .maybeSingle(),
      supabase
        .from("follows")
        .select("id")
        .eq("follower_id", viewer.id)
        .eq("followee_id", profile.id)
        .maybeSingle(),
    ]);
    const conn = connResult.data as { status: string; requester_id: string } | null;
    if (conn) {
      if (conn.status === "accepted") connectionStatus = "connected";
      else if (conn.status === "pending") {
        connectionStatus = conn.requester_id === viewer.id ? "pending_sent" : "pending_received";
      }
    }
    isFollowing = Boolean(followResult.data);
  }

  // Record the profile view (deduped — one row per viewer, latest time).
  if (viewer && !isOwner) {
    await admin.from("content_views").upsert(
      {
        viewer_id: viewer.id,
        owner_id: profile.id,
        target_type: "profile",
        target_id: profile.id,
        viewed_at: new Date().toISOString(),
        seen: false,
      },
      { onConflict: "viewer_id,target_type,target_id" },
    );
  }

  const responseLabel = formatResponseTime(profile.response_time_minutes ?? null);
  // Owners always see the About card (it hosts the inline Add-tags control even
  // when they haven't added skills yet); visitors only see it when populated.
  const hasAbout = isOwner || Boolean(profile.bio) || (profile.skills ?? []).length > 0 || Boolean(profile.location) || Boolean(responseLabel);

  return (
    <div className="container pb-10 py-0 md:py-6">
      {/* Identity bar: static, sits between site header and hero image.
          Gives visitors instant access to Connect + Follow on page load. */}
      {viewer && !isOwner && (
        <StickyProfileBar
          profileId={profile.id}
          displayName={profile.display_name}
          username={profile.username}
          avatarUrl={profile.avatar_url}
          connectionStatus={connectionStatus}
          isFollowing={isFollowing}
        />
      )}

      <ProfileHero
        heroUrl={profile.hero_url}
        heroKind={profile.hero_kind}
        heroPosterUrl={profile.hero_poster_url}
        focalX={Number(profile.hero_focal_x ?? 0.5)}
        focalY={Number(profile.hero_focal_y ?? 0.5)}
        isOwner={isOwner}
        topRight={isOwner && viewer ? (
          <div className="flex items-center gap-2">
            <HeroUploadButton userId={viewer.id} hasHero={Boolean(profile.hero_url)} />
            <MobileMenu signedIn={true} username={profile.username} />
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {viewer && (
              <TapButton
                targetType="profile"
                targetId={profile.id}
                ownerId={profile.id}
                variant="compact"
              />
            )}
            <BookmarkButton
              itemType="profile"
              itemId={profile.id}
              variant="icon"
              className="bg-black/45 backdrop-blur-md hover:bg-black/65 text-white"
            />
            <ShareButton url={`/profile/${profile.username}`} />
          </div>
        )}
      >
        <IdentityStrip
          userId={viewer?.id}
          displayName={profile.display_name}
          username={profile.username}
          avatarUrl={profile.avatar_url}
          verified={profile.verified}
          status={profile.status ?? "online"}
          lastSeenAt={profile.last_seen_at ?? null}
          tier={profile.subscription_tier ?? "free"}
          isOwner={isOwner}
          onMedia={Boolean(profile.hero_url)}
        />
        <ReputationStrip
          ratingAvg={Number(profile.rating_avg ?? 0)}
          reviewCount={profile.review_count ?? 0}
          completedTrades={completedTrades ?? 0}
          isOwner={isOwner}
          signInHref={viewer ? "" : `/login?next=/profile/${profile.username}`}
          location={profile.location}
        />
      </ProfileHero>

      <div className="container mt-6 space-y-6">
        {/* About — bio, at-a-glance meta, and skills consolidated into one
            calm card (instead of three separate boxes) now that skills and
            response time no longer crowd the hero. */}
        {hasAbout && (
          <Card>
            <CardContent className="space-y-5 p-6">
              {profile.bio && (
                <p className="max-w-2xl text-sm leading-relaxed text-foreground/90">{profile.bio}</p>
              )}

              {(profile.location || responseLabel) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  {profile.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" /> {profile.location}
                    </span>
                  )}
                  {responseLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" /> Responds in {responseLabel}
                    </span>
                  )}
                </div>
              )}

              {((profile.skills ?? []).length > 0 || isOwner) && (
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Skills & Expertise
                    </p>
                    {isOwner && <AddTagsPopover initialTags={profile.skills ?? []} />}
                  </div>
                  {(profile.skills ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(profile.skills ?? []).map((skill: string) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12.5px] font-medium text-white/75 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary/90"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Add tags so people can find you by what you do.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {connectedUsers.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                Connections · {connectedUserIds.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {connectedUsers.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    title={u.display_name}
                    className="transition-opacity hover:opacity-80"
                  >
                    <Avatar className="h-10 w-10 ring-1 ring-white/10 transition-all hover:ring-white/30">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.display_name} />}
                      <AvatarFallback>
                        {u.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <ProfileTripsSection trips={upcomingTrips} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div id="offerings" className="scroll-mt-20">
          <ProfileItemsCard
            kind="offering"
            title={isOwner ? "Your offerings" : `What ${profile.display_name} offers`}
            items={offeringList}
            manageable={isOwner}
          />
        </div>
        <div id="wants" className="scroll-mt-20">
          <ProfileItemsCard
            kind="want"
            title={isOwner ? "Your wants" : `What ${profile.display_name} wants`}
            items={wantList}
            manageable={isOwner}
          />
        </div>
      </section>

      <section id="listings" className="scroll-mt-20">
        {isOwner ? (
          <>
            {/* Tab row — only shown to the owner */}
            <div className="mb-3 flex items-center gap-1">
              <Link
                href={`/profile/${profile.username}`}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  searchParams.section !== "drafts"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Your listings
                {(opportunities?.length ?? 0) > 0 && (
                  <span className="rounded-full bg-primary/20 px-1.5 py-px text-[10px] font-bold text-primary tabular-nums">
                    {opportunities!.length}
                  </span>
                )}
              </Link>
              <Link
                href={`/profile/${profile.username}?section=drafts`}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  searchParams.section === "drafts"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Drafts
                {(drafts?.length ?? 0) > 0 && (
                  <span className="rounded-full bg-primary/20 px-1.5 py-px text-[10px] font-bold text-primary tabular-nums">
                    {drafts!.length}
                  </span>
                )}
              </Link>
            </div>

            {/* Listings tab content */}
            {searchParams.section !== "drafts" && (
              opportunities && opportunities.length > 0 ? (
                <ul className="space-y-2">
                  {opportunities.map((o) => (
                    <OwnerListingRow key={o.id} listing={o as never} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No listings yet — post one to get started.</p>
              )
            )}

            {/* Drafts tab content */}
            {searchParams.section === "drafts" && (
              drafts && drafts.length > 0 ? (
                <ul className="space-y-2">
                  {drafts.map((o) => (
                    <OwnerListingRow key={o.id} listing={o as never} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No drafts yet — move a listing to drafts to save it for later.</p>
              )
            )}
          </>
        ) : (
          <>
            <h2 className="mb-3 text-base font-semibold">Active listings</h2>
            {opportunities && opportunities.length > 0 ? (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                {opportunities.map((o) => <OpportunityCard key={o.id} opportunity={o as never} />)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active listings.</p>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Reviews</h2>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r) => {
              const reviewer = r.reviewer as unknown as { username: string; display_name: string; avatar_url: string | null };
              return (
                <ReviewCard
                  key={r.id}
                  review={{ id: r.id, rating: r.rating, comment: r.comment, tags: r.tags ?? [], created_at: r.created_at }}
                  reviewer={reviewer}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}
      </section>
      </div>
    </div>
  );
}

/**
 * Renders avg response time as "30 min", "2 hr", "3 days". Returns null when
 * the value is missing or nonsensical. Used in the About card's meta row.
 */
function formatResponseTime(minutes: number | null): string | null {
  if (!minutes || minutes < 1) return null;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) {
    return Number.isInteger(hours) ? `${hours} hr` : `${hours.toFixed(1)} hr`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}
