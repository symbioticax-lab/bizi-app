"use client";

import { useEffect, useRef } from "react";
import { formatRelative, cn } from "@/lib/utils";

type Sender = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  type: "text" | "system" | "proposal_ref";
  created_at: string;
  sender?: Sender | null;
};

type Props = {
  currentUserId: string;
  messages: Message[];
  ownerProfile: Sender;
  seekerProfile: Sender;
};

export function MessageThread({ currentUserId, messages, ownerProfile, seekerProfile }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function senderFor(message: Message): Sender {
    if (message.sender) return message.sender;
    return message.sender_id === ownerProfile.id ? ownerProfile : seekerProfile;
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <p className="text-center text-sm text-muted-foreground/60">
          No messages yet — break the ice.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      {messages.map((m, i) => {
        if (m.type === "system") {
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground/50">
              <span className="h-px flex-1 bg-white/[0.05]" />
              <span className="shrink-0">{m.content}</span>
              <span className="h-px flex-1 bg-white/[0.05]" />
            </div>
          );
        }

        const sender = senderFor(m);
        const mine = m.sender_id === currentUserId;

        // Group consecutive messages from the same sender — hide timestamp on non-last
        const next = messages[i + 1];
        const isLastInGroup =
          !next || next.type === "system" || next.sender_id !== m.sender_id;

        return (
          <div
            key={m.id}
            className={cn("flex px-4", mine ? "justify-end" : "justify-start")}
          >
            <div className={cn("max-w-[78%] space-y-0.5", mine ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "inline-block whitespace-pre-line px-4 py-2.5 text-[14.5px] leading-relaxed",
                  mine
                    ? "rounded-[20px] rounded-br-[6px] bg-primary text-primary-foreground"
                    : "rounded-[20px] rounded-bl-[6px] bg-white/[0.09] text-foreground",
                )}
              >
                {m.content}
              </div>
              {isLastInGroup && (
                <p className={cn("px-1 text-[10.5px] text-muted-foreground/50", mine ? "text-right" : "text-left")}>
                  {formatRelative(m.created_at)}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <div ref={endRef} />
    </div>
  );
}
