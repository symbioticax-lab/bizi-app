"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendDMAction, type DMMessageState } from "@/app/messages/actions";

export function DMComposer({ threadId }: { threadId: string }) {
  const action = sendDMAction.bind(null, threadId);
  const [state, formAction] = useFormState<DMMessageState, FormData>(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state && "ok" in state) {
      formRef.current?.reset();
      textareaRef.current?.focus();
    }
  }, [state]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <div className="space-y-1.5 px-4 pb-4 pt-2">
      <form ref={formRef} action={formAction}>
        <div className="flex items-end gap-3 rounded-[22px] border border-white/[0.09] bg-white/[0.05] px-4 py-3 transition-colors focus-within:border-white/[0.16] focus-within:bg-white/[0.07]">
          <textarea
            ref={textareaRef}
            name="content"
            rows={1}
            placeholder="Message…"
            onKeyDown={onKeyDown}
            className={cn(
              "flex-1 resize-none bg-transparent text-sm text-foreground/90 placeholder:text-muted-foreground/40",
              "max-h-32 overflow-y-auto focus:outline-none",
            )}
          />
          <SubmitButton />
        </div>
      </form>
      {state && "error" in state && (
        <p className="pl-1 text-xs text-destructive">{state.error}</p>
      )}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Send"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary transition-opacity hover:opacity-85 disabled:opacity-40"
    >
      <ArrowUp className="size-4 text-primary-foreground" strokeWidth={2.5} />
    </button>
  );
}
