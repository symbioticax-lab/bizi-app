import Image from "next/image";
import Link from "next/link";
import { Gift } from "lucide-react";
import { SignupForm } from "./signup-form";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { ref?: string; next?: string };
}) {
  const refRaw = (searchParams.ref ?? "").trim().toUpperCase();
  const ref = /^[A-Z0-9]{6}$/.test(refRaw) ? refRaw : null;
  const next = searchParams.next ?? "/dashboard";

  let referrer: { display_name: string; username: string } | null = null;
  if (ref) {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("referral_code", ref)
      .maybeSingle();
    referrer = data;
  }

  return (
    <>
      {/* TOP — logo + heading, so the handshake background shows through the middle */}
      <div className="flex w-full flex-col items-center gap-5 pt-2 sm:pt-4">
        <Image
          src="/bizi-logo.png"
          alt="BIZI"
          width={78}
          height={99}
          priority
          className="h-[3.75rem] w-auto brightness-0 invert"
        />
        <div className="px-2 text-center">
          <h1 className="text-[2rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-[2.25rem]">
            Trade What You Have.<br />Get What You Need.
          </h1>
          <p className="mt-2.5 text-base font-medium text-foreground/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            match with creatives, build trust, earn rewards
          </p>
        </div>
      </div>

      {/* BOTTOM — form fields only, no card container */}
      <div className="flex w-full flex-col gap-4 pb-2">
        {referrer && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/[0.08] px-3 py-2.5 text-xs backdrop-blur-sm">
            <Gift className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p>
              <span className="font-medium">{referrer.display_name}</span>
              <span className="text-muted-foreground"> sent you a BIZI invite.</span>
            </p>
          </div>
        )}

        <SignupForm refCode={ref} next={next} />

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}${ref ? `&ref=${ref}` : ""}`}
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
