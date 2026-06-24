import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { createClient } from "@/lib/supabase/server";
import { SecurityForms } from "./security-forms";

/**
 * Password & security. Shows the account email (read-only), a working change-
 * password form (Supabase updateUser), and a "log out of all devices" action.
 */
export default async function SecurityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings/security");

  return (
    <div className="container max-w-2xl space-y-4 py-8">
      <BackButton fallbackHref="/settings/account" label="Back to Accounts Center" />
      <Card>
        <CardHeader>
          <CardTitle>Password and security</CardTitle>
          <CardDescription>Update your password and manage where you&apos;re signed in.</CardDescription>
        </CardHeader>
        <CardContent>
          <SecurityForms email={user.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
