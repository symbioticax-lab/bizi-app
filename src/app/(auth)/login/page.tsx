import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { cookies } from "next/headers";
import { LoginForm } from "./login-form";

type SearchParams = {
  next?: string;
  check_email?: string;
  error?: string;
};

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const next = searchParams.next ?? "/dashboard";
  const showCheckEmail = Boolean(searchParams.check_email);
  const displayName = cookies().get("bizi_last_user")?.value ?? null;

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
            {displayName ? (
              <>Welcome back,<br />{displayName}</>
            ) : (
              "Welcome back"
            )}
          </h1>
          <p className="mt-2.5 text-base font-medium text-foreground/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            how will you get bizi today?
          </p>
        </div>
      </div>

      {/* BOTTOM — form fields only, no card container */}
      <div className="flex w-full flex-col gap-4 pb-2">
        {showCheckEmail && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-primary/40 bg-primary/10 px-3 py-2.5 text-xs backdrop-blur-sm">
            <Mail className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Check your email</p>
              <p className="mt-0.5 text-muted-foreground">
                We sent a verification link. Open it, then come back here to sign in.
              </p>
            </div>
          </div>
        )}
        {searchParams.error && (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive backdrop-blur-sm">
            {searchParams.error}
          </p>
        )}

        <LoginForm next={next} />

        <p className="text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            Create an account
          </Link>
        </p>
      </div>
    </>
  );
}
