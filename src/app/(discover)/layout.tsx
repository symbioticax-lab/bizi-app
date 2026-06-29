import { Suspense } from "react";
import { DiscoverTabs } from "@/components/discover/discover-tabs";
import { SecondaryFilterBar } from "@/components/feed/secondary-filter-bar";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <PullToRefresh>
      {/* Single sticky wrapper locks both bars together — neither drifts on scroll */}
      <div className="sticky top-0 z-30">
        {/* Suspense needed because DiscoverTabs + SecondaryFilterBar use useSearchParams() */}
        <Suspense fallback={<div className="h-[3rem] border-b border-border/40 bg-background/80" />}>
          <DiscoverTabs />
        </Suspense>
        <Suspense fallback={<div className="h-[2.75rem] border-b border-border/30 bg-background/75" />}>
          <SecondaryFilterBar />
        </Suspense>
      </div>
      {children}
    </PullToRefresh>
  );
}
