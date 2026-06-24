import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { cn, initials, formatRelative } from "@/lib/utils";
import { BookOpen, ArrowRight } from "lucide-react";

export const metadata = { title: "Connections · BIZI" };

type ConnectionRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  note: string | null;
  created_at: string;
  other: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    skills: string[];
    location: string | null;
  };
};

export default async function ConnectionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/connections");

  const { data: connRows } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id, note, created_at")
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  const rows = connRows ?? [];
  const otherIds = rows.map((c: { requester_id: string; recipient_id: string }) =>
    c.requester_id === user.id ? c.recipient_id : c.requester_id,
  );

  const profileMap = new Map<string, { id: string; username: string; display_name: string; avatar_url: string | null; skills: string[]; location: string | null }>();
  if (otherIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, skills, location")
      .in("id", otherIds);
    for (const p of profiles ?? []) profileMap.set(p.id, p as typeof profileMap extends Map<string, infer V> ? V : never);
  }

  const connections: ConnectionRow[] = rows
    .map((c: { id: string; requester_id: string; recipient_id: string; note: string | null; created_at: string }) => {
      const otherId = c.requester_id === user.id ? c.recipient_id : c.requester_id;
      const other = profileMap.get(otherId);
      if (!other) return null;
      return { ...c, other };
    })
    .filter(Boolean) as ConnectionRow[];

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <header className="flex items-center gap-3">
        <BookOpen className="size-5 text-primary/70" />
        <div>
          <h1 className="text-lg font-semibold">Connections</h1>
          <p className="text-sm text-muted-foreground">
            People you've worked with or exchanged with — your real-world phonebook.
          </p>
        </div>
      </header>

      {connections.length > 0 ? (
        <ul className="space-y-3">
          {connections.map((c) => (
            <li key={c.id}>
              <Link
                href={`/profile/${c.other.username}`}
                className={cn(
                  "group flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4",
                  "transition-colors hover:border-white/[0.12] hover:bg-white/[0.045]",
                )}
              >
                <Avatar className="size-12 shrink-0">
                  {c.other.avatar_url && <AvatarImage src={c.other.avatar_url} alt="" />}
                  <AvatarFallback>{initials(c.other.display_name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white/90">{c.other.display_name}</p>
                      <p className="text-xs text-white/35">@{c.other.username}</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-white/20 transition-colors group-hover:text-white/50" />
                  </div>

                  {c.other.skills?.length > 0 && (
                    <p className="mt-1 truncate text-[12px] text-white/40">
                      {c.other.skills.slice(0, 3).join(" · ")}
                    </p>
                  )}

                  {c.note && (
                    <p className="mt-2 line-clamp-2 text-[12.5px] italic text-white/50">
                      &ldquo;{c.note}&rdquo;
                    </p>
                  )}

                  <p className="mt-2 text-[11px] text-white/25">
                    Connected {formatRelative(c.created_at)}
                    {c.other.location && ` · ${c.other.location}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/[0.08] p-12 text-center">
          <BookOpen className="mx-auto size-8 text-white/15" />
          <p className="mt-3 font-medium text-white/60">No connections yet</p>
          <p className="mt-1 text-sm text-white/30">
            When someone accepts your connection request, they'll appear here.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/30"
          >
            Discover people
          </Link>
        </div>
      )}
    </div>
  );
}
