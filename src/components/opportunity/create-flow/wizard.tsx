"use client";

import { useState, type ComponentType } from "react";
import { X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Step1Intent } from "./step-1-intent";
import { Step4Preview } from "./step-4-preview";
import { Step5Success } from "./step-5-success";
import { createFromWizard } from "@/app/opportunities/wizard-action";
import type { Screen2Props, Screen3Props } from "./intents/wizard-shared";
import { NeedHelpScreen2 }        from "./intents/need-help-screen2";
import { NeedHelpScreen3 }        from "./intents/need-help-screen3";
import { OfferServicesScreen2 }   from "./intents/offer-services-screen2";
import { OfferServicesScreen3 }   from "./intents/offer-services-screen3";
import { TradeSkillsScreen2 }     from "./intents/trade-skills-screen2";
import { TradeSkillsScreen3 }     from "./intents/trade-skills-screen3";
import { PostOpportunityScreen2 } from "./intents/post-opportunity-screen2";
import { PostOpportunityScreen3 } from "./intents/post-opportunity-screen3";
import { ShareResourcesScreen2 }  from "./intents/share-resources-screen2";
import { ShareResourcesScreen3 }  from "./intents/share-resources-screen3";

export type WizardData = {
  intent: string;
  offeringTags: string[];
  offeringDesc: string;
  wantTags: string[];
  wantDesc: string;
  isPaid: boolean;
  budget: string;
  description: string;
  imageUrls: string[];
  timeline: string;
  location: string;
  locationLat: number | null;
  locationLng: number | null;
};

const INITIAL: WizardData = {
  intent: "",
  offeringTags: [],
  offeringDesc: "",
  wantTags: [],
  wantDesc: "",
  isPaid: false,
  budget: "",
  description: "",
  imageUrls: [],
  timeline: "",
  location: "",
  locationLat: null,
  locationLng: null,
};

// ── Intent dispatch maps ───────────────────────────────────────────────────────

const SCREEN2_MAP: Record<string, ComponentType<Screen2Props>> = {
  "need-help":        NeedHelpScreen2,
  "offer-services":   OfferServicesScreen2,
  "trade-skills":     TradeSkillsScreen2,
  "post-opportunity": PostOpportunityScreen2,
  "share-resources":  ShareResourcesScreen2,
};

const SCREEN3_MAP: Record<string, ComponentType<Screen3Props>> = {
  "need-help":        NeedHelpScreen3,
  "offer-services":   OfferServicesScreen3,
  "trade-skills":     TradeSkillsScreen3,
  "post-opportunity": PostOpportunityScreen3,
  "share-resources":  ShareResourcesScreen3,
};

// ── Wizard ─────────────────────────────────────────────────────────────────────

type Props = { userId: string; cancelHref?: string };

export function CreateWizard({ userId, cancelHref = "/" }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [createdId, setCreatedId] = useState<string | null>(null);

  function patch(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function goBack() {
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(undefined);
    const result = await createFromWizard(data);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setCreatedId(result.id);
      setStep(5);
    }
  }

  const PROGRESS_STEPS = 4;
  const btnClass =
    "flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-all duration-150 hover:bg-white/10 hover:text-white";

  const Screen2 = SCREEN2_MAP[data.intent] ?? NeedHelpScreen2;
  const Screen3 = SCREEN3_MAP[data.intent] ?? NeedHelpScreen3;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(230,22%,4%)]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
        {step < 5 ? (
          step === 1 ? (
            <a href={cancelHref} aria-label="Close" className={btnClass}>
              <ChevronLeft className="size-5" />
            </a>
          ) : (
            <button onClick={goBack} aria-label="Go back" className={btnClass}>
              <ChevronLeft className="size-5" />
            </button>
          )
        ) : (
          <div className="size-9" />
        )}

        {step < 5 && (
          <div className="flex flex-1 items-center gap-1.5 px-4">
            {Array.from({ length: PROGRESS_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-[3px] flex-1 rounded-full transition-all duration-300",
                  i < step ? "bg-primary" : "bg-white/[0.10]",
                )}
              />
            ))}
          </div>
        )}

        <a
          href={cancelHref}
          aria-label="Close"
          className="flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-all duration-150 hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </a>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg">
          {step === 1 && (
            <Step1Intent
              onSelect={(intent) => {
                patch({ intent });
                setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <Screen2
              userId={userId}
              data={data}
              patch={patch}
              onContinue={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <Screen3
              data={data}
              patch={patch}
              onContinue={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <Step4Preview
              data={data}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
            />
          )}

          {step === 5 && createdId && (
            <Step5Success opportunityId={createdId} intent={data.intent} />
          )}
        </div>
      </div>
    </div>
  );
}
