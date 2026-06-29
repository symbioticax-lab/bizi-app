"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bizi-feed-view";
const EVENT_NAME = "bizi-feed-view-change";

export function FeedGrid({ children }: { children: React.ReactNode }) {
  const [isGrid, setIsGrid] = useState(true);

  useEffect(() => {
    // Sync initial state from localStorage
    setIsGrid(localStorage.getItem(STORAGE_KEY) !== "list");

    // React to toggle clicks in the same tab
    const handler = (e: Event) => {
      setIsGrid((e as CustomEvent<string>).detail !== "list");
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return (
    <div
      className={cn(
        "space-y-3",
        isGrid && "lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0",
      )}
    >
      {children}
    </div>
  );
}

/** Called by LocationModule to broadcast a view change. */
export function dispatchFeedView(view: "grid" | "list") {
  localStorage.setItem(STORAGE_KEY, view);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: view }));
}

export function readFeedView(): "grid" | "list" {
  if (typeof window === "undefined") return "grid";
  return localStorage.getItem(STORAGE_KEY) === "list" ? "list" : "grid";
}
