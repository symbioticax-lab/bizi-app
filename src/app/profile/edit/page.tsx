import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./edit-form";

export default async function EditProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/edit");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/dashboard");

  return (
    <div className="container max-w-2xl space-y-4 py-8">
      <BackButton fallbackHref={`/profile/${profile.username}`} label="Back to profile" />
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>
            Your name, handle, bio, and skills. Hero cover and profile photo are edited inline on your{" "}
            <a href={`/profile/${profile.username}`} className="text-primary underline">profile page</a>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditProfileForm
            initial={{
              username: profile.username,
              display_name: profile.display_name,
              bio: profile.bio,
              location: profile.location,
              location_lat: profile.location_lat ?? null,
              location_lng: profile.location_lng ?? null,
              skills: profile.skills ?? [],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
