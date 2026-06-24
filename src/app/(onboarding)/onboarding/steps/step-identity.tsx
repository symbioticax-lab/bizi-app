import { StepShell } from "@/components/onboarding/step-shell";
import { ContinuePill } from "@/components/onboarding/step-cta";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { Textarea } from "@/components/ui/textarea";
import { saveIdentityAction } from "../actions";

export function StepIdentity({
  defaultBio,
  defaultLocation,
}: {
  defaultBio: string | null;
  defaultLocation: string | null;
}) {
  return (
    <form action={saveIdentityAction} className="flex flex-1 flex-col">
      <StepShell
        step={0}
        total={4}
        backHref="/onboarding?step=0"
        eyebrow="Your creative identity"
        title="Tell people who you are."
        subtitle="A line about your craft goes a long way. Location helps with local matches."
        skipHref="/onboarding?step=2"
        footer={<ContinuePill>Looks good — next</ContinuePill>}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Your bio{" "}
              <span className="text-white/25">(optional)</span>
            </label>
            <Textarea
              name="bio"
              defaultValue={defaultBio ?? ""}
              rows={3}
              maxLength={500}
              placeholder="I shoot editorial portraits in Brooklyn. Open to trading for web design, styling, or motion work."
              className="resize-none rounded-xl border border-white/[0.09] bg-white/[0.04] text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Your city{" "}
              <span className="text-white/25">(optional)</span>
            </label>
            <LocationAutocomplete
              name="location"
              defaultValue={defaultLocation ?? ""}
              placeholder="Brooklyn, NY · London · Remote"
            />
          </div>
        </div>
      </StepShell>
    </form>
  );
}
