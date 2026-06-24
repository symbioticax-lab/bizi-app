"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { loginAction, googleLoginAction, type AuthActionState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useFormState<AuthActionState, FormData>(loginAction, undefined);

  return (
    <div className="flex w-full flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Password" name="password" type="password" required autoComplete="current-password" />
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <SubmitPill>Login</SubmitPill>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-white/10" />
        <span>Or continue with</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form action={googleLoginAction}>
        <input type="hidden" name="next" value={next} />
        <GoogleButton />
      </form>
    </div>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 w-full gap-2 rounded-full bg-white text-base font-medium text-black shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] hover:bg-white/90"
    >
      <GoogleIcon className="size-5" />
      {pending ? "Continuing…" : "Continue with Google"}
    </Button>
  );
}

function SubmitPill({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(
        "h-11 w-full rounded-full bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      {pending ? "…" : children}
    </Button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.42 3.46 1.18 4.95l3.66-2.84Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.46 2.06 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" fill="#EA4335"/>
    </svg>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={rest.name}>{label}</Label>
      <Input id={rest.name} className="rounded-full bg-input/70 backdrop-blur-sm" {...rest} />
    </div>
  );
}
