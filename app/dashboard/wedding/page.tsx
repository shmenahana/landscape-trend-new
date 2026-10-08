"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CoupleHeader } from "../../wedding/CoupleHeader";

export default function WeddingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [coupleText, setCoupleText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [coupleEmail, setCoupleEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tips summary (from wedding orders).
  const [tipTotal, setTipTotal] = useState(0);
  const [tipCount, setTipCount] = useState(0);
  const [weddingOrderCount, setWeddingOrderCount] = useState(0);

  // Export / gallery.
  const [photoCount, setPhotoCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ url: string; emailStatus: string; configured: boolean } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        setActive(Boolean(j.weddingModeActive));
        setCoupleText(j.coupleDisplayText || "");
        setEventDate(j.eventDate || "");
        setSubtitle(j.customSubtitle || "");
        setCoupleEmail(j.coupleEmail || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    refreshTips();
    refreshPhotoCount();
  }, []);

  async function refreshPhotoCount() {
    try {
      const res = await fetch("/api/wedding/export?meta=1", { cache: "no-store" });
      if (!res.ok) return;
      const j = await res.json();
      setPhotoCount(typeof j.photoCount === "number" ? j.photoCount : null);
    } catch { /* ignore */ }
  }

  async function sendGallery() {
    setSending(true);
    setSendError(null);
    setSendResult(null);
    try {
      const res = await fetch("/api/wedding/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupleEmail: coupleEmail.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not create the gallery.");
      setSendResult({ url: j.url, emailStatus: j.email?.status || "skipped", configured: Boolean(j.email?.configured) });
    } catch (e: any) {
      setSendError(e.message || "Could not create the gallery.");
    } finally {
      setSending(false);
    }
  }

  async function closeEvent() {
    if (!confirm(
      "Close this event?\n\nThis turns wedding mode OFF and clears the couple's text, date, and subtitle. " +
      "Wedding orders stay in history, and any gallery you've sent stays live for 30 days."
    )) return;
    setClosing(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingModeActive: false,
          coupleDisplayText: "",
          eventDate: "",
          customSubtitle: "",
          coupleEmail: "",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Could not close the event");
      }
      setActive(false);
      setCoupleText("");
      setEventDate("");
      setSubtitle("");
      setCoupleEmail("");
      setSavedAt(Date.now());
    } catch (e: any) {
      setError(e.message || "Could not close the event");
    } finally {
      setClosing(false);
    }
  }

  async function refreshTips() {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) return;
      const j = await res.json();
      const wedding = (j.orders || []).filter((o: any) => o.orderType === "wedding");
      const tips = wedding.filter((o: any) => typeof o.tipAmount === "number" && o.tipAmount > 0);
      setWeddingOrderCount(wedding.length);
      setTipCount(tips.length);
      setTipTotal(tips.reduce((sum: number, o: any) => sum + o.tipAmount, 0));
    } catch { /* ignore */ }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingModeActive: active,
          coupleDisplayText: coupleText,
          eventDate,
          customSubtitle: subtitle,
          coupleEmail,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Could not save settings");
      }
      setSavedAt(Date.now());
    } catch (e: any) {
      setError(e.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="awning" aria-hidden />
      <header className="px-6 py-4 border-b border-bordercream bg-warmwhite flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl text-navy">The Magnet Parlor</h1>
          <p className="text-xs text-warmgray uppercase tracking-widest">Wedding Settings</p>
        </div>
        <div className="flex items-baseline gap-5">
          <Link href="/dashboard" className="text-xs text-gold uppercase tracking-widest hover:text-navy">
            ← Dashboard
          </Link>
          <a
            href="/wedding"
            target="_blank"
            rel="noopener"
            className="text-xs text-gold uppercase tracking-widest hover:text-navy"
          >
            View Wedding Page ↗
          </a>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        {/* Editor */}
        <section className="overflow-y-auto p-6 bg-cream">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Wedding day checklist */}
            <WeddingChecklist />

            {/* Mode toggle */}
            <div className="parlor-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-lg text-navy">Wedding Mode</h2>
                  <p className="text-xs text-warmgray mt-1 leading-snug">
                    When on, <code className="text-charcoal">/wedding</code> is live for guests.
                    When off, guests see a &ldquo;no active event&rdquo; message.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={active}
                  onClick={() => setActive((v) => !v)}
                  className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
                    active ? "bg-navy" : "bg-bordercream"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 rounded-full bg-warmwhite shadow transition-transform ${
                      active ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className={`mt-3 text-sm font-serif ${active ? "text-navy" : "text-warmgray"}`}>
                {active ? "● Live — guests can upload now" : "○ Off — page shows no active event"}
              </p>
            </div>

            {/* Text fields */}
            <div className="parlor-card p-5 space-y-4">
              <div>
                <label className="label">Couple Display Text</label>
                <input
                  className="input"
                  value={coupleText}
                  onChange={(e) => setCoupleText(e.target.value)}
                  placeholder="Congratulations Mr. & Mrs. Smith!"
                  maxLength={200}
                />
                <p className="text-xs text-warmgray mt-1">Shown large in script on the wedding page.</p>
              </div>
              <div>
                <label className="label">Event Date</label>
                <input
                  className="input"
                  type="date"
                  value={/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ? eventDate : ""}
                  onChange={(e) => setEventDate(e.target.value)}
                />
                <p className="text-xs text-warmgray mt-1">Displayed under the couple&apos;s name.</p>
              </div>
              <div>
                <label className="label">Custom Subtitle <span className="normal-case tracking-normal text-warmgray">(optional)</span></label>
                <input
                  className="input"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Brookside Gardens ♥ Cleveland, Ohio"
                  maxLength={200}
                />
              </div>

              {error && <p className="text-sm text-red-700">{error}</p>}
              <div className="flex items-center gap-3">
                <button className="btn-primary" onClick={save} disabled={saving || loading}>
                  {saving ? "Saving…" : "Save Settings"}
                </button>
                {savedAt && !saving && (
                  <span className="text-xs text-green-700 uppercase tracking-widest">Saved ✓</span>
                )}
              </div>
            </div>

            {/* Tips summary */}
            <div className="parlor-card p-5">
              <h2 className="font-serif text-lg text-navy">Tips Collected</h2>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="font-serif text-gold text-4xl leading-none">
                  ${tipTotal.toFixed(2)}
                </span>
                <span className="text-xs text-warmgray uppercase tracking-widest">
                  {tipCount} tip{tipCount === 1 ? "" : "s"} · {weddingOrderCount} wedding order{weddingOrderCount === 1 ? "" : "s"}
                </span>
              </div>
              <button onClick={refreshTips} className="text-xs text-gold uppercase tracking-widest mt-3 hover:text-navy">
                Refresh
              </button>
            </div>

            {/* Export guest photos + send gallery */}
            <div className="parlor-card p-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-lg text-navy">Export Guest Photos</h2>
                <button onClick={refreshPhotoCount} className="text-xs text-gold uppercase tracking-widest hover:text-navy">
                  Refresh
                </button>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-navy text-4xl leading-none">
                  {photoCount === null ? "—" : photoCount}
                </span>
                <span className="text-xs text-warmgray uppercase tracking-widest">
                  photo{photoCount === 1 ? "" : "s"} uploaded this event
                </span>
              </div>

              <a
                href="/api/wedding/export"
                className={`btn-outline w-full text-center block text-sm ${!photoCount ? "pointer-events-none opacity-40" : ""}`}
              >
                Download All Photos (.zip)
              </a>

              <div className="border-t border-bordercream pt-4 space-y-3">
                <div>
                  <label className="label">Couple&apos;s Email <span className="normal-case tracking-normal text-warmgray">(for the gallery link)</span></label>
                  <input
                    className="input"
                    type="email"
                    value={coupleEmail}
                    onChange={(e) => setCoupleEmail(e.target.value)}
                    placeholder="couple@example.com"
                    inputMode="email"
                  />
                </div>
                <button
                  className="btn-gold w-full text-sm py-3"
                  onClick={sendGallery}
                  disabled={sending || !photoCount}
                >
                  {sending ? "Creating gallery…" : "Send Gallery to Couple ♥"}
                </button>
                {sendError && <p className="text-sm text-red-700">{sendError}</p>}

                {sendResult && (
                  <div className="bg-cream border border-bordercream rounded p-3 space-y-2">
                    {sendResult.emailStatus === "sent" ? (
                      <p className="text-sm text-green-700">
                        ✓ Emailed the gallery link to the couple.
                      </p>
                    ) : sendResult.emailStatus === "failed" ? (
                      <p className="text-sm text-red-700">
                        The email failed to send — share the link below manually.
                      </p>
                    ) : (
                      <p className="text-sm text-charcoal">
                        {sendResult.configured
                          ? "No email was sent — share the link below manually."
                          : "Email isn't set up on this server — copy the link below and send it to the couple."}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <input className="input text-sm py-2 flex-1" readOnly value={sendResult.url} onFocus={(e) => e.target.select()} />
                      <button
                        className="btn-outline text-sm py-2 px-3 whitespace-nowrap"
                        onClick={() => navigator.clipboard?.writeText(sendResult.url).catch(() => {})}
                      >
                        Copy
                      </button>
                    </div>
                    <a href={sendResult.url} target="_blank" rel="noopener" className="text-xs text-gold uppercase tracking-widest hover:text-navy">
                      Open gallery ↗
                    </a>
                    <p className="text-[11px] text-warmgray leading-snug">
                      The gallery stays live for 30 days, independent of this event. Closing the
                      event below won&apos;t remove it or the photos.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Close event */}
            <div className="parlor-card p-5">
              <h2 className="font-serif text-lg text-navy">Close This Event</h2>
              <p className="text-xs text-warmgray mt-1 leading-snug">
                Turns wedding mode off and clears the couple&apos;s text, date, and subtitle.
                Orders stay in history; any gallery you sent stays live for 30 days.
              </p>
              <button
                className="btn-outline w-full mt-4 text-sm"
                onClick={closeEvent}
                disabled={closing}
              >
                {closing ? "Closing…" : "Close This Event"}
              </button>
            </div>
          </div>
        </section>

        {/* Live preview */}
        <section className="overflow-y-auto bg-cream border-l border-bordercream">
          <div className="wedding-border" aria-hidden />
          <div className="px-6 pb-10">
            <p className="text-center text-xs text-warmgray uppercase tracking-[0.3em] mb-2">
              Live Preview
            </p>
            <div className="max-w-md mx-auto">
              <CoupleHeader
                coupleText={coupleText}
                eventDate={eventDate}
                subtitle={subtitle}
              />
              <div className="parlor-card p-6 mt-6 text-center opacity-70">
                <p className="font-serif text-navy text-lg">Let&apos;s make you a keepsake magnet</p>
                <p className="text-warmgray text-sm mt-1">A little gift from the happy couple.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ── Wedding day checklist ────────────────────────────────────────────────────
// A collapsible, phone-friendly run sheet the operator ticks off during and
// after an event. State persists in localStorage (per device) and can be reset
// for the next wedding. Manual-email steps are highlighted because the system
// does NOT send those automatically — they're the ones that get forgotten.
const CHECKLIST_KEY = "mp_wedding_checklist_v1";

type ChecklistItem = { id: string; label: string; manual?: boolean };
const CHECKLIST: { title: string; note?: string; items: ChecklistItem[] }[] = [
  {
    title: "At Setup",
    items: [
      { id: "setup-mode-on", label: "Turn wedding mode ON" },
      { id: "setup-couple-info", label: "Enter couple's name, event date, and subtitle" },
      { id: "setup-verify", label: "Open /wedding on your phone — verify the couple's name shows and upload works" },
    ],
  },
  {
    title: "After the Wedding",
    note: "within a day or two",
    items: [
      { id: "after-photo-count", label: "Check the photo count on this page looks right" },
      { id: "after-download", label: "Optional: Download All Photos ZIP as a backup" },
      { id: "after-send-gallery", label: "Enter the couple's email → Send Gallery to Couple → copy the link" },
      {
        id: "after-personal-email",
        manual: true,
        label:
          "Personally email the couple from hello@themagnetparlor.com — a warm note with the gallery link. Mention it's live for 30 days and they can order keepsake magnets right from it.",
      },
      { id: "after-close-event", label: "Close This Event" },
      { id: "after-confirm-link", label: "Open the gallery link once more to confirm it still works" },
    ],
  },
  {
    title: "When Gallery Magnet Orders Arrive",
    items: [
      { id: "orders-fulfill", label: "Order appears under Online Orders — print, press, and ship it" },
      { id: "orders-tracking", label: "Enter the USPS tracking number + Mark as Shipped" },
      {
        id: "orders-notify",
        manual: true,
        label:
          "Manually email or text the couple their tracking number — “Mark as Shipped” does NOT notify them.",
      },
    ],
  },
];

function WeddingChecklist() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      if (raw) setChecked(JSON.parse(raw) || {});
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked, hydrated]);

  const allItems = CHECKLIST.flatMap((s) => s.items);
  const done = allItems.filter((i) => checked[i.id]).length;
  const total = allItems.length;

  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const reset = () => {
    if (confirm("Clear all checklist items for the next wedding?")) setChecked({});
  };

  return (
    <div className="parlor-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-gold" aria-hidden>☑</span>
          <span className="font-serif text-navy text-lg">Wedding Checklist</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-warmgray uppercase tracking-widest tabular-nums">
            {done}/{total}
          </span>
          <span className={`text-warmgray transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>▾</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-bordercream">
          <p className="text-xs text-warmgray mt-3 leading-snug">
            Tick items as you go — progress is saved on this device. Reset it before the next wedding.
          </p>

          {CHECKLIST.map((section) => (
            <div key={section.title} className="mt-5">
              <h3 className="text-xs uppercase tracking-widest text-gold">
                {section.title}
                {section.note && (
                  <span className="normal-case tracking-normal text-warmgray"> · {section.note}</span>
                )}
              </h3>
              <ul className="mt-2 space-y-2">
                {section.items.map((item) => {
                  const isDone = Boolean(checked[item.id]);
                  return (
                    <li key={item.id}>
                      <label
                        className={`flex items-start gap-3 p-2.5 rounded cursor-pointer transition ${
                          item.manual
                            ? "bg-gold/10 border border-gold"
                            : "hover:bg-cream border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggle(item.id)}
                          className="mt-0.5 w-5 h-5 shrink-0 accent-navy"
                        />
                        <span className={`text-sm leading-snug ${isDone ? "line-through text-warmgray" : "text-charcoal"}`}>
                          {item.manual && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold font-serif mr-1.5 align-baseline">
                              <span aria-hidden>✉</span> Do this yourself
                            </span>
                          )}
                          {item.label}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <button
            onClick={reset}
            className="mt-6 text-xs text-warmgray hover:text-red-700 underline-offset-2 hover:underline uppercase tracking-widest"
          >
            Reset Checklist
          </button>
        </div>
      )}
    </div>
  );
}
