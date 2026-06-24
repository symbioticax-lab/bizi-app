import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftRight, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { initials, formatRelative, cn } from "@/lib/utils";
import {
  categorizeConversation,
  CATEGORY_ORDER,
  type MessageCategory,
} from "@/lib/message-status";
import { AddDMButton } from "@/components/messages/add-dm-button";

export const metadata = { title: "Messages · BIZI" };

type Person = { id: string; username: string; display_name: string; avatar_url: string | null };

// ─── Negotiation rows from DB ────────────────────────────────────────────────

type NegRow = {
  id: string;
  status: string;
  last_action_at: string;
  last_action_by: string | null;
  owner_id: string;
  seeker_id: string;
  opportunity: { id: string; title: string };
  owner: Person;
  seeker: Person;
};

type NegMsg = {
  negotiation_id: string;
  content: string;
  type: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
};

// ─── Unified conversation type ────────────────────────────────────────────────

type Conversation = {
  id: string;
  kind: "negotiation" | "dm";
  href: string;
  /** Opportunity title — negotiations only */
  tradeTitle: string | null;
  counterpart: Person;
  preview: string;
  time: string;
  unread: boolean;
  /** Used to bucket negotiations; DMs are always treated as "active" */
  category: MessageCategory;
};

export default async function MessagesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  // ── Fetch negotiations + DM threads + accepted connections (for picker) ──
  const [negRes, dmRes, connRes] = await Promise.all([
    supabase
      .from("negotiations")
      .select(`
        id, status, last_action_at, last_action_by, owner_id, seeker_id,
        opportunity:opportunities!inner(id, title),
        owner:profiles!negotiations_owner_id_fkey(id, username, display_name, avatar_url),
        seeker:profiles!negotiations_seeker_id_fkey(id, username, display_name, avatar_url)
      `)
      .or(`owner_id.eq.${user.id},seeker_id.eq.${user.id}`)
      .order("last_action_at", { ascending: false }),

    supabase
      .from("dm_threads")
      .select(`
        id, last_msg_at, user1_id, user2_id,
        user1:profiles!dm_threads_user1_id_fkey(id, username, display_name, avatar_url),
        user2:profiles!dm_threads_user2_id_fkey(id, username, display_name, avatar_url)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_msg_at", { ascending: false }),

    supabase
      .from("connections")
      .select(`
        requester_id,
        requester:profiles!connections_requester_id_fkey(id, username, display_name, avatar_url),
        recipient:profiles!connections_recipient_id_fkey(id, username, display_name, avatar_url)
      `)
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .eq("status", "accepted"),
  ]);

  const negotiations = (negRes.data ?? []) as unknown as NegRow[];
  const dmThreads = (dmRes.data ?? []) as unknown as Array<{
    id: string;
    last_msg_at: string;
    user1_id: string;
    user2_id: string;
    user1: Person;
    user2: Person;
  }>;

  // Normalize connections to just the "other person"
  const connections: Person[] = (connRes.data ?? []).map((c: unknown) => {
    const row = c as { requester_id: string; requester: Person; recipient: Person };
    return row.requester_id === user.id ? row.recipient : row.requester;
  }).filter(Boolean);

  // ── Resolve negotiation messages + trade completion ───────────────────────
  const negIds = negotiations.map((n) => n.id);
  const dmIds = dmThreads.map((t) => t.id);

  const [tradesRes, negMsgsRes, dmLastMsgRes, dmUnreadRes] = await Promise.all([
    negIds.length
      ? supabase.from("trades").select("negotiation_id, completed_at").in("negotiation_id", negIds)
      : Promise.resolve({ data: [] as { negotiation_id: string; completed_at: string | null }[] }),
    negIds.length
      ? supabase
          .from("messages")
          .select("negotiation_id, content, type, sender_id, created_at, read_at")
          .in("negotiation_id", negIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as NegMsg[] }),
    dmIds.length
      ? supabase
          .from("dm_messages")
          .select("thread_id, content, sender_id, created_at, read_at")
          .in("thread_id", dmIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { thread_id: string; content: string; sender_id: string; created_at: string; read_at: string | null }[] }),
    // Unread DM count per thread
    dmIds.length
      ? supabase
          .from("dm_messages")
          .select("thread_id")
          .in("thread_id", dmIds)
          .neq("sender_id", user.id)
          .is("read_at", null)
      : Promise.resolve({ data: [] as { thread_id: string }[] }),
  ]);

  const tradeCompletedAt = new Map<string, string | null>();
  for (const t of (tradesRes.data ?? []) as { negotiation_id: string; completed_at: string | null }[]) {
    tradeCompletedAt.set(t.negotiation_id, t.completed_at);
  }

  const lastNegMsg = new Map<string, NegMsg>();
  const negHasUnread = new Map<string, boolean>();
  for (const m of (negMsgsRes.data ?? []) as NegMsg[]) {
    if (!lastNegMsg.has(m.negotiation_id)) lastNegMsg.set(m.negotiation_id, m);
    if (m.sender_id !== user.id && !m.read_at) negHasUnread.set(m.negotiation_id, true);
  }

  const lastDMMsg = new Map<string, { content: string; sender_id: string; created_at: string }>();
  for (const m of (dmLastMsgRes.data ?? []) as { thread_id: string; content: string; sender_id: string; created_at: string; read_at: string | null }[]) {
    if (!lastDMMsg.has(m.thread_id)) lastDMMsg.set(m.thread_id, m);
  }

  const dmHasUnread = new Set<string>();
  for (const m of (dmUnreadRes.data ?? []) as { thread_id: string }[]) {
    dmHasUnread.add(m.thread_id);
  }

  // ── Build unified conversation list ──────────────────────────────────────
  const conversations: Conversation[] = [];

  for (const n of negotiations) {
    const counterpart = n.owner_id === user.id ? n.seeker : n.owner;
    const msg = lastNegMsg.get(n.id) ?? null;
    conversations.push({
      id: n.id,
      kind: "negotiation",
      href: `/negotiations/${n.id}`,
      tradeTitle: n.opportunity.title,
      counterpart,
      category: categorizeConversation({
        status: n.status,
        lastActionBy: n.last_action_by,
        viewerId: user.id,
        tradeCompletedAt: tradeCompletedAt.get(n.id) ?? null,
      }),
      preview: msg
        ? msg.type === "system"
          ? `· ${msg.content}`
          : msg.content
        : "No messages yet — say hi.",
      time: msg?.created_at ?? n.last_action_at,
      unread: negHasUnread.get(n.id) ?? false,
    });
  }

  for (const t of dmThreads) {
    const counterpart = t.user1_id === user.id ? t.user2 : t.user1;
    const msg = lastDMMsg.get(t.id) ?? null;
    conversations.push({
      id: t.id,
      kind: "dm",
      href: `/messages/dm/${t.id}`,
      tradeTitle: null,
      counterpart,
      category: "active",
      preview: msg ? msg.content : "No messages yet — say hello.",
      time: msg?.created_at ?? t.last_msg_at,
      unread: dmHasUnread.has(t.id),
    });
  }

  const sorted = [...conversations].sort((a, b) => {
    const catPriority = (c: Conversation) => CATEGORY_ORDER.indexOf(c.category);
    if (catPriority(a) !== catPriority(b)) return catPriority(a) - catPriority(b);
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  const active = sorted.filter((c) => c.category !== "expired");
  const expired = sorted.filter((c) => c.category === "expired");

  const recentContacts = conversations.slice(0, 10);
  const hasAnyContent = conversations.length > 0 || connections.length > 0;

  return (
    <div className="flex w-full flex-col">

      {/* ── Hero header ─────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-7">
        <h1 className="text-[2.6rem] font-bold leading-[1.05] tracking-tight text-white/60 mix-blend-luminosity">
          Let&apos;s Stay<br />Connected
        </h1>
      </div>

      {!hasAnyContent ? (
        <EmptyInbox />
      ) : (
        <>
          {/* ── Recent contacts + Add button ────────────────────── */}
          <div className="flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar">
            <AddDMButton connections={connections} />

            {recentContacts.map((c) => (
              <Link
                key={c.id}
                href={c.href}
                className="flex shrink-0 flex-col items-center gap-2"
              >
                <div className="relative">
                  <Avatar className="h-14 w-14 ring-2 ring-background">
                    {c.counterpart.avatar_url && (
                      <AvatarImage src={c.counterpart.avatar_url} alt="" />
                    )}
                    <AvatarFallback className="text-base">
                      {initials(c.counterpart.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  {c.unread && (
                    <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-bizi-online ring-2 ring-background" />
                  )}
                  {/* Kind badge on avatar */}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -left-0.5 flex size-4 items-center justify-center rounded-full ring-2 ring-background",
                      c.kind === "dm" ? "bg-teal-500" : "bg-primary/80",
                    )}
                  >
                    {c.kind === "dm"
                      ? <MessageCircle className="size-2.5 text-white" />
                      : <ArrowLeftRight className="size-2 text-white" />
                    }
                  </span>
                </div>
                <p className="max-w-[56px] truncate text-[11px] text-muted-foreground/70">
                  {c.counterpart.display_name.split(" ")[0]}
                </p>
              </Link>
            ))}
          </div>

          {/* ── Conversation list ───────────────────────────────── */}
          {active.length > 0 && (
            <ul className="flex flex-col">
              {active.map((c) => (
                <ConversationRow key={`${c.kind}-${c.id}`} conversation={c} />
              ))}
            </ul>
          )}

          {conversations.length === 0 && connections.length > 0 && (
            <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
              <p className="text-sm font-medium text-foreground/70">No conversations yet</p>
              <p className="text-sm text-muted-foreground/60">
                Tap <span className="font-medium text-foreground/80">New DM</span> above to message a connection.
              </p>
            </div>
          )}

          {/* ── Archived ────────────────────────────────────────── */}
          {expired.length > 0 && (
            <div className="mt-6 pb-6">
              <p className="mb-1 px-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/35">
                Archived
              </p>
              <ul className="flex flex-col opacity-50">
                {expired.map((c) => (
                  <ConversationRow key={`${c.kind}-${c.id}`} conversation={c} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const { counterpart, preview, time, unread, category, kind, tradeTitle } = conversation;
  const isActive = category === "awaiting" || unread;
  const isDM = kind === "dm";

  return (
    <li>
      <Link
        href={conversation.href}
        className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-white/[0.03] active:bg-white/[0.05]"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className="h-[52px] w-[52px]">
            {counterpart.avatar_url && <AvatarImage src={counterpart.avatar_url} alt="" />}
            <AvatarFallback className="text-sm font-semibold">
              {initials(counterpart.display_name)}
            </AvatarFallback>
          </Avatar>
          {isActive && (
            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-bizi-online ring-2 ring-background" />
          )}
        </div>

        {/* Text content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className={cn(
                "truncate text-[15px] leading-snug",
                unread ? "font-bold text-white" : "font-semibold text-foreground/90",
              )}>
                {counterpart.display_name}
              </p>
              {isDM && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-teal-500/15 px-1.5 py-px text-[10px] font-semibold text-teal-400">
                  <MessageCircle className="size-2.5" />
                  DM
                </span>
              )}
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground/55">
              {formatRelative(time)}
            </span>
          </div>

          {/* Preview */}
          <p className={cn(
            "mt-0.5 truncate text-[13px] leading-snug",
            unread ? "text-foreground/75" : "text-muted-foreground/55",
          )}>
            {preview}
          </p>

          {/* Trade context line — negotiations only */}
          {!isDM && tradeTitle && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground/35">
              <ArrowLeftRight className="size-3 shrink-0" />
              <span className="truncate">{tradeTitle}</span>
            </p>
          )}
        </div>

        {/* Unread dot */}
        {unread && (
          <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-primary" />
        )}
      </Link>
    </li>
  );
}

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04]">
        <span className="text-3xl">💬</span>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground">
          Express interest in a listing to start a trade, or connect with someone to DM them.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full border border-white/[0.09] bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/[0.08]"
      >
        Browse listings
      </Link>
    </div>
  );
}
