"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";
import { saveLocationPrefAndCompleteAction } from "../actions";

type LocationPref = "local" | "both" | "remote";

function EnterButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
    >
      {pending ? "Entering BIZI…" : "Enter BIZI"}
      {!pending && <ArrowRight className="size-4" />}
    </button>
  );
}

export function ResultsFooter() {
  const [pref, setPref] = useState<LocationPref>("both");

  const options: { value: LocationPref; label: string }[] = [
    { value: "local", label: "Local" },
    { value: "both", label: "Both" },
    { value: "remote", label: "Remote" },
  ];

  return (
    <div className="pt-4 space-y-3">
      <div className="flex items-center justify-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Show me:</span>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setPref(o.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              pref === o.value
                ? "bg-primary text-primary-foreground"
                : "border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <form action={saveLocationPrefAndCompleteAction}>
        <input type="hidden" name="trade_location_pref" value={pref} />
        <EnterButton />
      </form>
    </div>
  );
}
