import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, KeyRound, UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { createClient } from "@/lib/supabase/server";

/**
 * Accounts Center hub — the destination behind the settings panel's top tile.
 * Groups the identity + security surfaces Instagram bundles together. Personal
 * details reuse the existing Edit Profile page rather than duplicating a form.
 */
export default async function AccountCenterPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const rows = [
    {
      href: "/profile/edit",
      icon: UserCog,
      title: "Personal details",
      desc: "Name, handle, bio, location, and skills",
    },
    {
      href: "/settings/security",
      icon: KeyRound,
      title: "Password and security",
      desc: "Change your password and manage sessions",
    },
  ];

  return (
    <div className="container max-w-2xl space-y-4 py-8">
      <BackButton
        fallbackHref={profile?.username ? `/profile/${profile.username}` : "/dashboard"}
        label="Back to profile"
      />
      <Card>
        <CardHeader>
          <CardTitle>Accounts Center</CardTitle>
          <CardDescription>Manage your personal details, password, and security.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row) => (
            <Link
              key={row.href}
              href={row.href}
              className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3 hover:bg-secondary/60"
            >
              <row.icon className="size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{row.title}</p>
                <p className="truncate text-xs text-muted-foreground">{row.desc}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
