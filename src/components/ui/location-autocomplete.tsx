"use client";

import {
  useState, useRef, useEffect, useLayoutEffect, useCallback,
  type KeyboardEvent, type ChangeEvent,
} from "react";
import { createPortal } from "react-dom";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Photon API types ───────────────────────────────────────────────────────────

type PhotonProps = {
  name?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
};

type PhotonFeature = {
  properties: PhotonProps;
  geometry?: { coordinates?: [number, number] }; // [lng, lat]
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

export type LocationSelection = {
  label: string;
  lat: number | null;
  lng: number | null;
};

// ── Formatter ──────────────────────────────────────────────────────────────────

function formatSuggestion(p: PhotonProps): string {
  const parts: string[] = [];

  if (p.name) parts.push(p.name);
  if (p.city && p.city !== p.name) parts.push(p.city);

  if (p.countrycode === "US") {
    if (p.state) parts.push(p.state);
  } else if (p.countrycode === "GB") {
    parts.push("UK");
  } else if (p.country) {
    const short =
      p.country === "United States of America" ? "US" :
      p.country === "United Kingdom" ? "UK" :
      p.country;
    parts.push(short);
  }

  return parts.filter(Boolean).join(", ");
}

// ── Component ──────────────────────────────────────────────────────────────────

type Props = {
  // Controlled mode (wizard screens)
  value?: string;
  onChange?: (v: string) => void;
  onSelect?: (sel: LocationSelection) => void;
  // Form mode (profile edit — input carries name/defaultValue for FormData)
  name?: string;
  defaultValue?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  id?: string;
  // Common
  placeholder?: string;
  hint?: string;
  inputClassName?: string;
};

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  name,
  defaultValue,
  defaultLat,
  defaultLng,
  id,
  placeholder,
  hint,
  inputClassName,
}: Props) {
  const isControlled = value !== undefined;
  const [inputValue, setInputValue] = useState(value ?? defaultValue ?? "");
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: defaultLat ?? null,
    lng: defaultLng ?? null,
  });
  const [suggestions, setSuggestions] = useState<LocationSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  // Sync when controlled value changes externally
  useEffect(() => {
    if (isControlled) setInputValue(value!);
  }, [value, isControlled]);

  // Calculate dropdown position relative to viewport (avoids overflow-clip issues)
  useLayoutEffect(() => {
    if (!open || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, [open]);

  // Close on any scroll (position would shift)
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!inputRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const fetchSuggestions = useCallback(async (query: string) => {
    const q = query.trim();
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }

    // Immediate "Remote" suggestion (no coordinates)
    if (/^remote/i.test(q)) {
      setSuggestions([{ label: "Remote", lat: null, lng: null }]);
      setOpen(true);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`,
        { signal: controller.signal },
      );
      if (!res.ok) { setSuggestions([]); setOpen(false); return; }

      const data: PhotonResponse = await res.json();
      const seen = new Set<string>();
      const results: LocationSelection[] = [];

      for (const f of data.features ?? []) {
        const label = formatSuggestion(f.properties);
        if (!label || seen.has(label)) continue;
        seen.add(label);
        const c = f.geometry?.coordinates;
        results.push({
          label,
          lat: c ? c[1] : null,
          lng: c ? c[0] : null,
        });
      }

      setSuggestions(results);
      setOpen(results.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputValue(v);
    // Typed text no longer matches a confirmed pin → clear coordinates.
    setCoords({ lat: null, lng: null });
    onChange?.(v);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 300);
  }

  function handleSelect(s: LocationSelection) {
    setInputValue(s.label);
    setCoords({ lat: s.lat, lng: s.lng });
    onChange?.(s.label);
    onSelect?.(s);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder ?? "e.g. New York, NY · Los Angeles · Remote"}
          autoComplete="off"
          className={inputClassName ?? cn(
            "w-full rounded-xl border border-white/[0.09] bg-white/[0.04]",
            "px-4 py-3.5 text-[14px] text-white/90 placeholder:text-white/22",
            "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
            "transition-all duration-150",
          )}
        />
        {loading && (
          <Loader2 className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/30" />
        )}
      </div>

      {/* Hidden coordinate inputs — only relevant in form (name) mode */}
      {name && (
        <>
          <input type="hidden" name={`${name}_lat`} value={coords.lat ?? ""} />
          <input type="hidden" name={`${name}_lng`} value={coords.lng ?? ""} />
        </>
      )}

      {/* Portal dropdown — renders outside any overflow container */}
      {mounted && open && suggestions.length > 0 && createPortal(
        <div
          style={dropdownStyle}
          className="overflow-hidden rounded-xl border border-white/[0.09] bg-[hsl(248,22%,9%)] shadow-[0_8px_32px_-4px_rgb(0_0_0/0.7)]"
        >
          {suggestions.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              className={cn(
                "flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13.5px]",
                "transition-colors duration-100",
                i > 0 && "border-t border-white/[0.05]",
                i === activeIndex
                  ? "bg-primary/20 text-white"
                  : "text-white/70 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <MapPin className="size-3.5 shrink-0 text-white/30" />
              {s.label}
            </button>
          ))}
        </div>,
        document.body,
      )}

      {hint && <p className="mt-1.5 text-[11.5px] text-white/25">{hint}</p>}
    </div>
  );
}
