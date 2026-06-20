"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDisplay } from "@/lib/phone";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  message: string;
  createdAt: string;
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/inquiries", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setInquiries(j.inquiries || []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Could not load inquiries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, []);

  async function signOut() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/dashboard/login";
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="awning" aria-hidden />
      <header className="px-6 py-4 border-b border-bordercream bg-warmwhite flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-2xl text-navy">The Magnet Parlor</h1>
          <p className="text-xs text-warmgray uppercase tracking-widest">Inquiries</p>
        </div>
        <div className="flex items-baseline gap-5">
          <Link href="/dashboard" className="text-xs text-gold uppercase tracking-widest hover:text-navy">
            ← Dashboard
          </Link>
          <span className="text-xs text-warmgray">
            {loading ? "Loading…" : `${inquiries.length} total`}
          </span>
          <button
            onClick={signOut}
            className="text-xs text-gold uppercase tracking-widest hover:text-navy"
          >
            Sign Out
          </button>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto bg-cream px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {error && (
            <div className="parlor-card p-4 border-l-4 border-l-red-700">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {!loading && inquiries.length === 0 && !error && (
            <p className="text-sm text-warmgray italic text-center mt-10">
              No inquiries yet. Submissions from the homepage contact form will show up here.
            </p>
          )}
          {inquiries.map((i) => (
            <article key={i.id} className="parlor-card p-5" style={{ borderLeft: "4px solid #2B3856" }}>
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <span className="font-serif text-navy text-xl">{i.name}</span>
                  {i.eventType && (
                    <span className="text-warmgray text-sm ml-3">· {i.eventType}</span>
                  )}
                </div>
                <span className="text-xs text-warmgray uppercase tracking-widest">
                  {formatTime(i.createdAt)}
                </span>
              </div>
              <p className="text-sm text-warmgray mt-1">
                <a href={`mailto:${i.email}`} className="underline-offset-2 hover:underline text-charcoal">
                  {i.email}
                </a>
                {i.phone && (
                  <>
                    <span className="mx-2">·</span>
                    <a href={`tel:${i.phone}`} className="underline-offset-2 hover:underline text-charcoal">
                      {formatDisplay(i.phone) || i.phone}
                    </a>
                  </>
                )}
              </p>
              <p className="text-charcoal mt-3 whitespace-pre-wrap leading-relaxed">{i.message}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function formatTime(iso: string): string {
  const t = new Date(iso.replace(" ", "T") + "Z").getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso.replace(" ", "T") + "Z").toLocaleDateString();
}
