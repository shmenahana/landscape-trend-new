// Thin SendGrid wrapper (raw REST — no SDK dependency). When SendGrid isn't
// configured the send is a no-op that reports "skipped", so callers can fall
// back gracefully (e.g. "copy this link manually").

export type EmailStatus = "sent" | "skipped" | "failed";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ status: EmailStatus; error: string | null }> {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  const to = (opts.to || "").trim();
  if (!key || !from || !to) {
    return { status: "skipped", error: null };
  }

  const content: { type: string; value: string }[] = [
    { type: "text/plain", value: opts.text },
  ];
  // SendGrid requires content ordered text/plain before text/html.
  if (opts.html) content.push({ type: "text/html", value: opts.html });

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: "The Magnet Parlor" },
        subject: opts.subject,
        content,
      }),
    });
    if (res.ok) return { status: "sent", error: null };
    const error = `SendGrid ${res.status}: ${(await res.text()).slice(0, 200)}`;
    console.error("[email] send failed:", error);
    return { status: "failed", error };
  } catch (e: any) {
    const error = e?.message || "fetch failed";
    console.error("[email] send threw:", error);
    return { status: "failed", error };
  }
}
