// Plain HTML email templates. Kept inline (no MJML / React Email) for MVP
// simplicity — readable in any client and easy to tweak. Render to a
// { subject, html, text } shape which the email helper passes to Resend.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const BRAND_LIME = "#D4FF3D";
const BRAND_INK = "#0A0A0A";

function shell({ preheader, heading, body, ctaLabel, ctaUrl }: {
  preheader: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${BRAND_INK};">
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:0;">${escapeHtml(preheader)}</span>
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="text-align:left;padding:8px 0 24px;font-weight:700;font-size:18px;letter-spacing:-0.02em;">bizi</div>
    <div style="background:#ffffff;border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">${escapeHtml(heading)}</h1>
      <div style="font-size:14px;line-height:1.55;color:#3f3f46;">${body}</div>
      <p style="margin:24px 0 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:${BRAND_LIME};color:${BRAND_INK};text-decoration:none;font-weight:600;padding:11px 18px;border-radius:10px;font-size:14px;">
          ${escapeHtml(ctaLabel)}
        </a>
      </p>
    </div>
    <p style="font-size:11px;color:#71717a;margin:20px 6px 0;line-height:1.5;">
      Sent by BIZI — the trust-based barter marketplace. You're receiving this because of activity on your account.
    </p>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}

export type EmailOut = { subject: string; html: string; text: string };

export function interestReceivedEmail(opts: { actorName: string; listingTitle: string; opportunityId: string }): EmailOut {
  const url = `${SITE}/opportunities/${opts.opportunityId}`;
  return {
    subject: `${opts.actorName} is interested in your listing`,
    html: shell({
      preheader: `${opts.actorName} expressed interest in ${opts.listingTitle}`,
      heading: `${opts.actorName} expressed interest`,
      body: `<p>They want to trade for <strong>${escapeHtml(opts.listingTitle)}</strong>. Open the listing to see what they're offering and send them a proposal.</p>`,
      ctaLabel: "View interest",
      ctaUrl: url,
    }),
    text: `${opts.actorName} is interested in your listing "${opts.listingTitle}". View it: ${url}`,
  };
}

export function proposalReceivedEmail(opts: { actorName: string; listingTitle: string; negotiationId: string }): EmailOut {
  const url = `${SITE}/negotiations/${opts.negotiationId}`;
  return {
    subject: `${opts.actorName} sent you a proposal`,
    html: shell({
      preheader: `New proposal on ${opts.listingTitle}`,
      heading: `${opts.actorName} sent a proposal`,
      body: `<p>They've laid out the terms for <strong>${escapeHtml(opts.listingTitle)}</strong>. You can Accept the deal, Counter with adjusted terms, or Decline.</p>`,
      ctaLabel: "Open negotiation",
      ctaUrl: url,
    }),
    text: `${opts.actorName} sent you a proposal for "${opts.listingTitle}". Open: ${url}`,
  };
}

export function counterReceivedEmail(opts: { actorName: string; listingTitle: string; negotiationId: string }): EmailOut {
  const url = `${SITE}/negotiations/${opts.negotiationId}`;
  return {
    subject: `${opts.actorName} sent a counter-offer`,
    html: shell({
      preheader: `Counter-offer on ${opts.listingTitle}`,
      heading: `${opts.actorName} sent a counter-offer`,
      body: `<p>They adjusted the terms on <strong>${escapeHtml(opts.listingTitle)}</strong>. Have a look and decide.</p>`,
      ctaLabel: "Review counter-offer",
      ctaUrl: url,
    }),
    text: `${opts.actorName} sent a counter-offer on "${opts.listingTitle}". Review: ${url}`,
  };
}

export function tradeAcceptedEmail(opts: { actorName: string; listingTitle: string; tradeId: string }): EmailOut {
  const url = `${SITE}/trades/${opts.tradeId}`;
  return {
    subject: `Trade accepted — work begins on "${opts.listingTitle}"`,
    html: shell({
      preheader: `${opts.actorName} accepted the deal`,
      heading: `It's a deal!`,
      body: `<p>${escapeHtml(opts.actorName)} accepted the proposal on <strong>${escapeHtml(opts.listingTitle)}</strong>. The trade is officially in progress — when you've held up your end, mark your side complete.</p>`,
      ctaLabel: "Open trade",
      ctaUrl: url,
    }),
    text: `${opts.actorName} accepted the deal on "${opts.listingTitle}". Open: ${url}`,
  };
}

export function tradeCompletedEmail(opts: { actorName: string; listingTitle: string; tradeId: string }): EmailOut {
  const url = `${SITE}/trades/${opts.tradeId}`;
  return {
    subject: `${opts.actorName} marked the trade complete`,
    html: shell({
      preheader: `Trade update on ${opts.listingTitle}`,
      heading: `${opts.actorName} marked complete`,
      body: `<p>They confirmed their side of the trade on <strong>${escapeHtml(opts.listingTitle)}</strong>. When you're done with your end, confirm completion to wrap things up — then both sides can leave a review.</p>`,
      ctaLabel: "Open trade",
      ctaUrl: url,
    }),
    text: `${opts.actorName} marked the trade complete on "${opts.listingTitle}". Open: ${url}`,
  };
}
