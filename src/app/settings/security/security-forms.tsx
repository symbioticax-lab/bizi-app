"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

/**
 * Client security controls. Password change goes through the Supabase browser
 * client (the user already has an active session, so updateUser is allowed).
 * "Log out of all devices" uses a global sign-out, which revokes every session
 * including this one — so we send the user to login afterward.
 */
export function SecurityForms({ email }: { email: string }) {
  const supabase = React.useMemo(() => createClient(), []);
  const toast = useToast();
  const router = useRouter();

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = React.useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword("");
    setConfirm("");
    toast("Password updated");
  }

  async function handleSignOutEverywhere() {
    setSigningOutAll(true);
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">Contact support to change the email on your account.</p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Change password</h3>
          <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Update password"}
        </Button>
      </form>

      <div className="space-y-2 border-t border-border pt-6">
        <h3 className="text-sm font-semibold">Sessions</h3>
        <p className="text-xs text-muted-foreground">
          Sign out of every device. You&apos;ll need to sign in again here.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOutEverywhere}
          disabled={signingOutAll}
        >
          {signingOutAll ? "Signing out…" : "Log out of all devices"}
        </Button>
      </div>
    </div>
  );
}
