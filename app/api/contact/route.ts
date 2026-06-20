import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_EVENT_TYPES = new Set([
  "Wedding",
  "Birthday Party",
  "Corporate Event",
  "Market or Festival",
  "Other",
]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = String(body.name || "").trim().slice(0, 200);
  const email = String(body.email || "").trim().slice(0, 200);
  const phone = String(body.phone || "").trim().slice(0, 50);
  const eventType = String(body.eventType || "").trim().slice(0, 50);
  const message = String(body.message || "").trim().slice(0, 5000);

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });
  if (eventType && !VALID_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO inquiries (id, name, email, phone, eventType, message)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, name, email, phone, eventType, message);

  const sgKey = process.env.SENDGRID_API_KEY;
  const sgFrom = process.env.SENDGRID_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL || "hello@themagnetparlor.com";
  let emailStatus: "sent" | "skipped" | "failed" = "skipped";
  let emailError: string | null = null;

  if (sgKey && sgFrom) {
    const text =
      `New inquiry from the website.\n\n` +
      `Name:       ${name}\n` +
      `Email:      ${email}\n` +
      `Phone:      ${phone || "—"}\n` +
      `Event Type: ${eventType || "—"}\n\n` +
      `Message:\n${message}\n`;
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sgKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: sgFrom, name: "The Magnet Parlor" },
          reply_to: { email, name },
          subject: `New Inquiry — ${eventType || "General"}: ${name}`,
          content: [{ type: "text/plain", value: text }],
        }),
      });
      if (res.ok) {
        emailStatus = "sent";
      } else {
        emailStatus = "failed";
        emailError = `SendGrid ${res.status}: ${(await res.text()).slice(0, 200)}`;
        console.error("[contact] SendGrid send failed:", emailError);
      }
    } catch (e: any) {
      emailStatus = "failed";
      emailError = e?.message || "fetch failed";
      console.error("[contact] SendGrid send threw:", emailError);
    }
  }

  return NextResponse.json({ ok: true, id, email: { status: emailStatus, error: emailError } });
}
