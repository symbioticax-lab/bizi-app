"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { updateProfileAction, type ProfileFormState } from "./actions";

type Props = {
  initial: {
    username: string;
    display_name: string;
    bio: string | null;
    location: string | null;
    location_lat: number | null;
    location_lng: number | null;
    skills: string[];
  };
};

export function EditProfileForm({ initial }: Props) {
  const [state, action] = useFormState<ProfileFormState, FormData>(updateProfileAction, undefined);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={initial.username} required />
        <p className="text-xs text-muted-foreground">Your public handle, e.g. /profile/{initial.username}</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" defaultValue={initial.display_name} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="location">Location</Label>
        <LocationAutocomplete
          id="location"
          name="location"
          defaultValue={initial.location ?? ""}
          defaultLat={initial.location_lat}
          defaultLng={initial.location_lng}
          placeholder="e.g. Brooklyn, NY"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={initial.bio ?? ""} rows={4} placeholder="What you do, what you're known for…" />
      </div>
      <div id="tags" className="grid gap-1.5 scroll-mt-20">
        <Label htmlFor="skills">Tags</Label>
        <TagInput
          id="skills"
          name="skills"
          defaultValue={initial.skills}
          placeholder="ecom, graphic design, motion…"
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>;
}
