import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { ListingForm } from "@/components/opportunity/listing-form";
import { createClient } from "@/lib/supabase/server";

export default async function EditOpportunityPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/opportunities/${params.id}/edit`);

  const { data: opp } = await supabase.from("opportunities").select("*").eq("id", params.id).maybeSingle();
  if (!opp) notFound();
  if (opp.owner_id !== user.id) redirect(`/opportunities/${params.id}`);

  return (
    <div className="container max-w-3xl space-y-4 py-8">
      <BackButton fallbackHref={`/opportunities/${opp.id}`} label="Back to listing" />
      <Card>
        <CardHeader>
          <CardTitle>Edit listing</CardTitle>
          <CardDescription>Changes lock once an active negotiation begins.</CardDescription>
        </CardHeader>
        <CardContent>
          <ListingForm
            userId={user.id}
            mode="edit"
            opportunityId={opp.id}
            cancelHref={`/opportunities/${opp.id}`}
            currentStatus={opp.status}
            initial={{
              title: opp.title,
              description: opp.description,
              category: opp.category,
              offering_title: opp.offering_title,
              offering_desc: opp.offering_desc,
              offering_tags: opp.offering_tags ?? [],
              want_title: opp.want_title,
              want_desc: opp.want_desc,
              want_tags: opp.want_tags ?? [],
              image_url: opp.image_urls?.[0] ?? null,
              negotiable: opp.negotiable ?? true,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
