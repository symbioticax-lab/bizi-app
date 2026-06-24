import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProposalForm } from "@/components/negotiation/proposal-form";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";

export default async function ProposeFromInterestPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/interests/${params.id}/propose`);

  const { data: interest } = await supabase
    .from("interests")
    .select(`
      id, message, offered_title, offered_desc, status,
      seeker:profiles!interests_seeker_id_fkey(id, username, display_name, avatar_url),
      opportunity:opportunities!inner(
        id, title, owner_id, offering_title, offering_desc, want_title, want_desc
      )
    `)
    .eq("id", params.id)
    .maybeSingle();

  if (!interest) notFound();

  const opp = interest.opportunity as unknown as {
    id: string; title: string; owner_id: string;
    offering_title: string; offering_desc: string;
    want_title: string; want_desc: string;
  };
  const seeker = interest.seeker as unknown as {
    id: string; username: string; display_name: string; avatar_url: string | null;
  };

  if (opp.owner_id !== user.id) redirect(`/opportunities/${opp.id}`);
  if (interest.status === "converted") {
    // Already has a negotiation — bounce them to it
    const { data: existing } = await supabase
      .from("negotiations")
      .select("id")
      .eq("interest_id", interest.id)
      .maybeSingle();
    if (existing) redirect(`/negotiations/${existing.id}`);
  }
  if (interest.status === "declined" || interest.status === "withdrawn") {
    redirect(`/opportunities/${opp.id}`);
  }

  // Fetch the owner's display name for the form
  const { data: owner } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const ownerName = owner?.display_name ?? "You";
  const seekerName = seeker.display_name;

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <BackButton fallbackHref={`/opportunities/${opp.id}`} label="Back to listing" />

      <Card>
        <CardHeader>
          <CardTitle>Send first proposal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border bg-card/50 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Listing
            </p>
            <p className="mt-1 font-medium">{opp.title}</p>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-4">
            <Avatar className="h-10 w-10">
              {seeker.avatar_url && <AvatarImage src={seeker.avatar_url} alt="" />}
              <AvatarFallback>{initials(seeker.display_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-sm">
              <p>
                <span className="font-medium">{seeker.display_name}</span>{" "}
                <span className="text-muted-foreground">said:</span>
              </p>
              <p className="mt-2 whitespace-pre-line">{interest.message}</p>
              <div className="mt-3 rounded-md bg-background/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">They're offering</p>
                <p className="mt-1 font-medium">{interest.offered_title}</p>
                <p className="mt-1 text-muted-foreground whitespace-pre-line">{interest.offered_desc}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Pre-filled with what each side already described. Adjust the terms as you'd like and send the proposal.
            They'll be able to Accept, Counter, or Decline.
          </p>

          <ProposalForm
            mode="first"
            interestId={interest.id}
            ownerName={ownerName}
            seekerName={seekerName}
            initial={{
              owner_gives: `${opp.offering_title}\n\n${opp.offering_desc}`,
              seeker_gives: `${interest.offered_title}\n\n${interest.offered_desc}`,
              timeline_days: 14,
              notes: null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
