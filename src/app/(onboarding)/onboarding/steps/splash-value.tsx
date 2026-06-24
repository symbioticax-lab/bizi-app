import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function SplashValue() {
  const supabase = createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const FLOOR = 1247;
  const total = Math.max(count ?? 0, FLOOR);

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-between gap-8 py-6">
      <Image
        src="/bizi-logo.png"
        alt="BIZI"
        width={64}
        height={80}
        priority
        className="h-[3rem] w-auto brightness-0 invert"
      />

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Welcome
        </p>
        <h1 className="mt-3 text-balance text-[34px] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
          You&apos;re more valuable than you think.
        </h1>
        <p className="mt-5 max-w-xs text-balance text-sm leading-relaxed text-muted-foreground">
          Join {total.toLocaleString()}+ photographers, designers, and makers
          trading skills — no money required.
        </p>

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur-md">
          <Users className="size-3 text-primary" />
          Already on BIZI
        </span>
      </div>

      <Link
        href="/onboarding?step=1"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-medium text-black shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] transition-colors hover:bg-white/90"
      >
        Set up my profile
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
