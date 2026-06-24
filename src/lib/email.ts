import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailOut } from "./emails/templates";

/**
 * Sends a transactional email to a user (resolved by Supabase user id).
 *
 * No-ops silently when:
 *   - RESEND_API_KEY isn't set (local dev without email yet)
 *   - SUPABASE_SERVICE_ROLE_KEY isn't set (can't look up the email address)
 *   - The user has no email (shouldn't happen, but defensive)
 *
 * Failures are logged, never thrown — a broken email pipeline must never
 * break the user-facing action that triggered it.
 */
export async function sendTransactionalEmail(userId: string, message: EmailOut): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const admin = createAdminClient();
    const { data, error: lookupErr } = await admin.auth.admin.getUserById(userId);
    if (lookupErr || !data?.user?.email) return;
    const to = data.user.email;

    const from = process.env.RESEND_FROM ?? "BIZI <onboarding@resend.dev>";

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      console.warn("[email] Resend rejected:", error.message);
    }
  } catch (err) {
    console.warn("[email] send failed:", err instanceof Error ? err.message : String(err));
  }
}
