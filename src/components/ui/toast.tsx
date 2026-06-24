"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastItem = { id: number; message: string };

const ToastContext = createContext<(message: string) => void>(() => {});

/** Fire a transient toast message. No-ops if rendered outside ToastProvider. */
export function useToast() {
  return useContext(ToastContext);
}

/**
 * Minimal app-wide toast. A single bottom-centered stack of pill messages
 * that auto-dismiss. Used for lightweight feedback that doesn't fit inline
 * (e.g. the tap 24h-cooldown message).
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-8"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto max-w-sm rounded-full border border-white/15 bg-card/95 px-4 py-2.5 text-center text-sm font-medium text-foreground shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
