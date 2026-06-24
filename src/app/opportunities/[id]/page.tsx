import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerControls } from "@/components/opportunity/owner-controls";
import { ExpressInterestDialog } from "@/components/interest/express-interest-dialog";
import { InterestRow } from "@/components/interest/interest-row";
import { BackButton } from "@/components/ui/back-button";
import { BookmarkButton } from "@/components/saved/bookmark-button";
import { ShareButton } from "@/components/share-button";
import { withdrawInterestAction } from "@/app/interests/actions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initials, formatRelative } from "@/lib/utils";

function formatBudget(value: string): string {
  if (!value.startsWith("$")) return value;
  const stripped = value.slice(1);
  return /^\d/.test(stripped) ? value : stripped;
}

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("*, owner:profiles!opportunities_owner_id_fkey(id, username, display_name, avatar_url, rating_avg, review_count)")
    .eq("id", params.id)
    .maybeSingle();

  if (!opportunity || opportunity.status === "deleted") notFound();

  const owner = opportunity.owner as unknown as {
    id: string; username: string; display_name: string;
    avatar_url: string | null; rating_avg: number; review_count: number;
  };

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === owner.id;
  const imageUrls: string[] = opportunity.image_urls ?? [];
  const cover = imageUrls[0];

  // Record the listing view (deduped — one row per viewer, latest time).
  if (user && !isOwner) {
    const admin = createAdminClient();
    await admin.from("content_views").upsert(
      {
        viewer_id: user.id,
        owner_id: owner.id,
        target_type: "listing",
        target_id: opportunity.id,
        viewed_at: new Date().toISOString(),
        seen: false,
      },
      { onConflict: "viewer_id,target_type,target_id" },
    );
  }

  // Owner: mark pending interests as seen, then load all interests for this listing
  let interests: Array<{
    id: string; message: string; offered_title: string; offered_desc: string;
    status: string; created_at: string;
    seeker: { id: string; username: string; display_name: string; avatar_url: string | null; rating_avg: number; review_count: number };
  }> = [];
  let hasActiveNegotiation = false;
  if (isOwner) {
    await supabase
      .from("interests")
      .update({ status: "seen", seen_at: new Date().toISOString() })
      .eq("opportunity_id", opportunity.id)
      .eq("status", "pending");

    const [{ data: rows }, { count }] = await Promise.all([
      supabase
        .from("interests")
        .select("id, message, offered_title, offered_desc, status, created_at, seeker:profiles!interests_seeker_id_fkey(id, username, display_name, avatar_url, rating_avg, review_count)")
        .eq("opportunity_id", opportunity.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("negotiations")
        .select("id", { count: "exact", head: true })
        .eq("opportunity_id", opportunity.id)
        .in("status", ["proposal_sent", "counter_sent", "in_progress", "completed_by_owner", "completed_by_seeker"]),
    ]);
    interests = (rows ?? []) as never;
    hasActiveNegotiation = (count ?? 0) > 0;
  }

  // Seeker: do I already have an interest on this listing?
  let myInterest: { id: string; status: string; created_at: string } | null = null;
  if (user && !isOwner) {
    const { data } = await supabase
      .from("interests")
      .select("id, status, created_at")
      .eq("opportunity_id", opportunity.id)
      .eq("seeker_id", user.id)
      .maybeSingle();
    myInterest = data as never;
  }

  return (
    <div className="container space-y-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <BackButton fallbackHref="/" />
        <div className="flex items-center gap-2">
          {!isOwner && user && (
            <BookmarkButton itemType="listing" itemId={opportunity.id} variant="pill" />
          )}
          <ShareButton url={`/opportunities/${opportunity.id}`} />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        {/* Cover image */}
        <div className="overflow-hidden rounded-xl border border-border bg-muted">
          <div className="relative aspect-[16/9]">
            {cover ? (
              <Image src={cover} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground/30">
                <ArrowRight className="size-12" />
              </div>
            )}
          </div>
        </div>

        {/* Additional photos strip (shown when more than one image was uploaded) */}
        {imageUrls.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {imageUrls.map((url, i) => (
              <div key={url} className="relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted" style={{ width: 96, aspectRatio: "4/5" }}>
                <Image
                  src={url}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{opportunity.category}</Badge>
            {opportunity.negotiable
              ? <Badge variant="outline">Negotiable</Badge>
              : <Badge variant="muted">Fixed terms</Badge>}
            {opportunity.status === "paused" && <Badge variant="muted">Paused</Badge>}
            {opportunity.status === "closed" && <Badge variant="muted">Closed</Badge>}
            {opportunity.status === "completed" && <Badge variant="muted">Completed</Badge>}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{opportunity.title}</h1>
          <p className="text-sm text-muted-foreground">{formatRelative(opportunity.created_at)}</p>
          <p className="whitespace-pre-line text-sm leading-6">{opportunity.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Offering — warm emerald tint: energy, generosity, action */}
          <Card className="border-l-[3px] border-l-emerald-500/60 bg-emerald-950/20">
            <CardHeader><CardTitle className="text-base text-emerald-300/90">{owner.display_name} offers</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{opportunity.offering_title}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{opportunity.offering_desc}</p>
              {opportunity.offering_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {opportunity.offering_tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Wants — cool violet tint: receptive, aspirational, seeking */}
          <Card className="border-l-[3px] border-l-violet-500/60 bg-violet-950/20">
            <CardHeader><CardTitle className="text-base text-violet-300/90">In return, wants</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{formatBudget(opportunity.want_title ?? "")}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{opportunity.want_desc}</p>
              {opportunity.want_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {opportunity.want_tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isOwner && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Interest received</CardTitle>
              <span className="text-sm text-muted-foreground">{interests.length} total</span>
            </CardHeader>
            <CardContent>
              {interests.length > 0 ? (
                <ul className="space-y-3">
                  {interests.map((i) => (
                    <InterestRow
                      key={i.id}
                      interest={i}
                      seeker={i.seeker}
                      onSendProposalDisabledReason={
                        hasActiveNegotiation
                          ? "An active negotiation already exists on this listing"
                          : undefined
                      }
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nobody has expressed interest yet.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <aside className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-6">
            <Link href={`/profile/${owner.username}`} className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {owner.avatar_url && <AvatarImage src={owner.avatar_url} alt="" />}
                <AvatarFallback>{initials(owner.display_name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{owner.display_name}</div>
                <div className="text-xs text-muted-foreground">
                  {owner.review_count > 0 ? `${Number(owner.rating_avg).toFixed(2)} · ${owner.review_count} reviews` : "no reviews yet"}
                </div>
              </div>
            </Link>

            {isOwner ? (
              <OwnerControls id={opportunity.id} status={opportunity.status} hasActiveNegotiation={hasActiveNegotiation} />
            ) : !user ? (
              <Button asChild className="w-full">
                <Link href={`/login?next=/opportunities/${opportunity.id}`}>Sign in to express interest</Link>
              </Button>
            ) : myInterest ? (
              <SeekerInterestState interest={myInterest} />
            ) : opportunity.status !== "active" ? (
              <Button className="w-full" disabled>Not accepting interest</Button>
            ) : (
              <ExpressInterestDialog
                opportunityId={opportunity.id}
                ownerName={owner.display_name}
                wantTitle={opportunity.want_title}
              />
            )}
          </CardContent>
        </Card>
      </aside>
      </div>
    </div>
  );
}

function SeekerInterestState({ interest }: { interest: { id: string; status: string; created_at: string } }) {
  if (interest.status === "converted") {
    return (
      <div className="space-y-2">
        <Badge>Negotiation in progress</Badge>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/negotiations`}>Open negotiation</Link>
        </Button>
      </div>
    );
  }
  if (interest.status === "declined") {
    return (
      <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
        Not a match this time. Try another listing.
      </div>
    );
  }
  if (interest.status === "withdrawn") {
    return (
      <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
        You withdrew your interest.
      </div>
    );
  }
  // pending or seen
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Interest sent {formatRelative(interest.created_at)} — {interest.status === "seen" ? "owner has seen it" : "waiting on the owner"}.
      </div>
      <form action={withdrawInterestAction}>
        <input type="hidden" name="interest_id" value={interest.id} />
        <Button type="submit" variant="outline" className="w-full">Withdraw interest</Button>
      </form>
    </div>
  );
}
