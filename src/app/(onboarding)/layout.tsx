import { GlobeBackground } from "@/components/auth/globe-background";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <GlobeBackground />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[35%] bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,hsl(var(--primary)/0.18),transparent_70%)]"
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 py-8 sm:py-12">
        {children}
      </div>
    </div>
  );
}
