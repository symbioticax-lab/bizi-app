import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BackButton } from "@/components/ui/back-button";
import { MessageThread } from "@/components/negotiation/message-thread";
import { DMComposer } from "@/components/messages/dm-composer";
import { DMRealtime } from "@/components/realtime/dm-realtime";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";

export default async function DMThreadPage({ params }: { params: { threadId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/messages/dm/${params.threadId}`);

  const { data: thread } = await supabase
    .from("dm_threads")
    .select(`
      id, user1_id, user2_id,
      user1:profiles!dm_threads_user1_id_fkey(id, username, display_name, avatar_url),
      user2:profiles!dm_threads_user2_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("id", params.threadId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();

  if (!thread) notFound();

  const t = thread as unknown as {
    id: string;
    user1_id: string;
    user2_id: string;
    user1: { id: string; username: string; display_name: string; avatar_url: string | null };
    user2: { id: string; username: string; display_name: string; avatar_url: string | null };
  };

  const me = user.id === t.user1_id ? t.user1 : t.user2;
  const counterpart = user.id === t.user1_id ? t.user2 : t.user1;

  const { data: rawMessages } = await supabase
    .from("dm_messages")
    .select("id, sender_id, content, created_at")
    .eq("thread_id", t.id)
    .order("created_at", { ascending: true });

  // Mark unread messages from the other party as read (fire-and-forget)
  await supabase
    .from("dm_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", t.id)
    .neq("sender_id", user.id)
    .is("read_at", null);

  const messages = (rawMessages ?? []).map((m) => ({
    ...m,
    type: "text" as const,
  }));

  return (
    <div className="container max-w-4xl space-y-4 py-4">
      <DMRealtime threadId={t.id} />

      {/* Header */}
      <header className="flex items-center gap-3 px-1">
        <BackButton fallbackHref="/messages" />

        <Link href={`/profile/${counterpart.username}`} className="shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-white/[0.07]">
            {counterpart.avatar_url && <AvatarImage src={counterpart.avatar_url} alt="" />}
            <AvatarFallback>{initials(counterpart.display_name)}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${counterpart.username}`}
            className="block truncate text-[15px] font-semibold leading-tight text-foreground hover:underline"
          >
            {counterpart.display_name}
          </Link>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <MessageCircle className="size-3" />
            Direct message
          </span>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="h-[65dvh] min-h-[22rem] overflow-y-auto">
          <MessageThread
            currentUserId={user.id}
            messages={messages}
            ownerProfile={me}
            seekerProfile={counterpart}
          />
        </div>
        <div className="border-t border-white/[0.06]">
          <DMComposer threadId={t.id} />
        </div>
      </div>
    </div>
  );
}
