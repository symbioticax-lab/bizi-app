"use client";

import { useFormStatus } from "react-dom";
import { CalendarDays, MessageSquare, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { acceptSessionRequestAction, declineSessionRequestAction } from "@/app/travel/actions";
import { initials } from "@/lib/utils";

type Request = {
  id: string;
  type: string;
  proposed_date: string | null;
  message: string | null;
  status: string;
  created_at: string;
  requester: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
};

function AcceptBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="default" disabled={pending} className="gap-1 h-7 px-2 text-xs">
      <Check className="size-3" />
      Accept
    </Button>
  );
}

function DeclineBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="ghost" disabled={pending} className="gap-1 h-7 px-2 text-xs text-muted-foreground hover:text-destructive">
      <X className="size-3" />
      Decline
    </Button>
  );
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SessionRequestsList({ requests }: { requests: Request[] }) {
  if (requests.length === 0) return null;

  return (
    <div className="space-y-2">
      {requests.map((req) => {
        const r = req.requester;
        const isSession = req.type === "session";
        const acceptAction = acceptSessionRequestAction.bind(null, req.id);
        const declineAction = declineSessionRequestAction.bind(null, req.id);

        return (
          <div key={req.id} className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3">
            {/* Icon */}
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {isSession
                ? <CalendarDays className="size-3.5" />
                : <MessageSquare className="size-3.5" />}
            </span>

            <div className="min-w-0 flex-1 space-y-1">
              {/* Who + date */}
              <div className="flex items-center gap-2">
                {r && (
                  <Avatar className="size-5">
                    <AvatarImage src={r.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="text-[9px]">{initials(r.display_name)}</AvatarFallback>
                  </Avatar>
                )}
                <span className="text-xs font-medium">{r?.display_name ?? "Someone"}</span>
                {isSession && req.proposed_date && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {formatDate(req.proposed_date)}
                  </Badge>
                )}
                {!isSession && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Connect</Badge>
                )}
                {req.status !== "pending" && (
                  <Badge
                    className={`text-[10px] px-1.5 py-0 ml-auto ${req.status === "accepted" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground"}`}
                  >
                    {req.status}
                  </Badge>
                )}
              </div>
              {req.message && (
                <p className="text-xs text-muted-foreground leading-relaxed">{req.message}</p>
              )}
            </div>

            {/* Accept / Decline — only for pending */}
            {req.status === "pending" && (
              <div className="flex shrink-0 items-center gap-1">
                <form action={acceptAction}>
                  <AcceptBtn />
                </form>
                <form action={declineAction}>
                  <DeclineBtn />
                </form>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
