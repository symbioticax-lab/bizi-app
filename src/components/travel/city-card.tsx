import Link from "next/link";
import Image from "next/image";
import type { CITIES } from "@/lib/travel/cities";

type City = (typeof CITIES)[number];

export function CityCard({ city, count }: { city: City; count?: number }) {
  return (
    <Link
      href={`/travel/${city.slug}`}
      className="group relative block overflow-hidden rounded-2xl"
      style={{ minHeight: 200 }}
    >
      {/* Real city photo */}
      <Image
        src={city.photo}
        alt={city.name}
        fill
        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, 50vw"
        priority={false}
      />

      {/* Subtle brand-colour tint — keeps each city feeling distinct */}
      <div
        className="absolute inset-0 opacity-30 transition-opacity duration-500 group-hover:opacity-20"
        style={{ background: `linear-gradient(145deg, ${city.from} 0%, ${city.to} 100%)` }}
      />

      {/* Strong bottom scrim for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-end p-5" style={{ minHeight: 200 }}>
        <h2 className="text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-md">
          {city.name}
        </h2>
        {count !== undefined && (
          <p className="mt-1 text-sm font-medium text-white/70 drop-shadow-sm">
            {count === 0 ? "Be the first" : `${count} traveler${count === 1 ? "" : "s"}`}
          </p>
        )}
      </div>

      {/* Hover ring */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-inset ring-white/0 transition-colors duration-300 group-hover:ring-white/20" />
    </Link>
  );
}
