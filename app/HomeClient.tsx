"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomeClient() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <Nav scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="awning" aria-hidden />

      <Hero />
      <About />
      <HowItWorks />
      <Events />
      <Pricing />
      <Contact />
      <Footer />
    </main>
  );
}

function Nav({
  scrolled,
  menuOpen,
  setMenuOpen,
}: {
  scrolled: boolean;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}) {
  const close = () => setMenuOpen(false);
  return (
    <nav
      className={`sticky top-0 z-40 bg-warmwhite transition-shadow duration-200 ${
        scrolled ? "shadow-[0_2px_10px_rgba(43,56,86,0.08)]" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2" onClick={close}>
          <span className="font-script text-gold text-2xl leading-none">The</span>
          <span className="font-serif text-navy text-xl tracking-wide">Magnet Parlor</span>
        </Link>
        <ul className="hidden md:flex items-center gap-7 text-sm tracking-widest uppercase">
          <li><a href="#about" className="text-charcoal hover:text-navy transition">About</a></li>
          <li><a href="#how" className="text-charcoal hover:text-navy transition">How It Works</a></li>
          <li><Link href="/weddings" className="text-charcoal hover:text-navy transition">Weddings</Link></li>
          <li><a href="#events" className="text-charcoal hover:text-navy transition">Events</a></li>
          <li><a href="#pricing" className="text-charcoal hover:text-navy transition">Pricing</a></li>
          <li><a href="#contact" className="text-charcoal hover:text-navy transition">Book Us</a></li>
          <li><Link href="/shop" className="text-gold hover:text-navy transition">Order Online</Link></li>
        </ul>
        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="block w-6 h-[2px] bg-navy mb-1.5" />
          <span className="block w-6 h-[2px] bg-navy mb-1.5" />
          <span className="block w-6 h-[2px] bg-navy" />
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-warmwhite border-t border-bordercream">
          <ul className="px-5 py-4 space-y-3 text-sm tracking-widest uppercase">
            <li><a href="#about" onClick={close}>About</a></li>
            <li><a href="#how" onClick={close}>How It Works</a></li>
            <li><Link href="/weddings" onClick={close}>Weddings</Link></li>
            <li><a href="#events" onClick={close}>Events</a></li>
            <li><a href="#pricing" onClick={close}>Pricing</a></li>
            <li><a href="#contact" onClick={close}>Book Us</a></li>
            <li><Link href="/shop" className="text-gold" onClick={close}>Order Online</Link></li>
          </ul>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-16 sm:pt-24 pb-20 px-5 text-center">
      <div className="max-w-3xl mx-auto reveal">
        <p className="font-script text-gold text-4xl sm:text-5xl">The</p>
        <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl text-navy leading-none -mt-2">
          Magnet <span className="italic">Parlor</span>
        </h1>
        <div className="heart-divider my-8"><span>♥</span></div>
        <p className="text-xs sm:text-sm text-warmgray uppercase tracking-[0.35em]">
          Capture the moment. Keep the memory.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-12">
          <a href="#contact" className="btn-primary">Book Your Event</a>
          <Link href="/order" className="btn-outline">Order at a Market</Link>
        </div>
        <div className="mt-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-gold hover:text-navy transition font-serif text-lg"
          >
            <span aria-hidden>🧲</span>
            Order Online — We Ship Nationwide
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gold uppercase tracking-[0.4em]">{children}</p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-4xl sm:text-5xl text-navy mt-3">{children}</h2>
  );
}

function About() {
  return (
    <section id="about" className="px-5 py-24 bg-warmwhite border-y border-bordercream">
      <div className="max-w-3xl mx-auto text-center reveal">
        <SectionLabel>Our Story</SectionLabel>
        <SectionTitle>Memories Worth Keeping</SectionTitle>
        <div className="heart-divider my-8"><span>♥</span></div>
        <p className="text-warmgray text-lg leading-relaxed">
          We turn your favorite photos into beautiful custom fridge magnets — made fresh
          right before your eyes. Whether it&apos;s a candid family moment, a snapshot with
          friends, or a photo from the best night of your life, we make it something
          you&apos;ll see and smile at every single day. Find us at local markets across
          Northeast Ohio, or book us for your next event.
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Scan & Upload",
      body: "Scan our QR code with your phone and upload your favorite photos. Crop them just the way you like — it takes less than a minute.",
    },
    {
      n: "02",
      title: "We Print & Create",
      body: "We print your photos on premium paper and hand-assemble each magnet with care. Every one is made fresh, right in front of you.",
    },
    {
      n: "03",
      title: "Take Them Home",
      body: "We'll text you when your magnets are ready. Pick them up, stick them on your fridge, and enjoy your memories every day.",
    },
  ];
  return (
    <section id="how" className="px-5 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center reveal">
          <SectionLabel>The Process</SectionLabel>
          <SectionTitle>Simple as 1, 2, 3</SectionTitle>
          <div className="heart-divider my-8"><span>♥</span></div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mt-10">
          {steps.map((s) => (
            <div key={s.n} className="relative pt-8 reveal">
              <span className="absolute top-0 left-0 font-serif text-7xl sm:text-8xl text-bordercream leading-none select-none">
                {s.n}
              </span>
              <div className="relative">
                <h3 className="font-serif text-2xl text-navy mt-6">{s.title}</h3>
                <p className="text-warmgray mt-3 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Events() {
  const cards = [
    {
      title: "Weddings",
      body: "Give your guests a keepsake they'll actually keep. We set up on-site and create custom photo magnets throughout your reception — the perfect favor that never gets thrown away.",
    },
    {
      title: "Birthday Parties",
      body: "From first birthdays to milestone celebrations, we capture the joy and turn it into magnets your guests take home and treasure. A unique addition to any party.",
    },
    {
      title: "Corporate Events",
      body: "Team outings, holiday parties, product launches — custom branded magnets add a memorable, personal touch that stands out from the usual swag.",
    },
  ];
  return (
    <section id="events" className="px-5 py-24 bg-warmwhite border-y border-bordercream">
      <div className="max-w-5xl mx-auto">
        <div className="text-center reveal">
          <SectionLabel>What We Do</SectionLabel>
          <SectionTitle>Perfect for Every Occasion</SectionTitle>
          <div className="heart-divider my-8"><span>♥</span></div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {cards.map((c) => (
            <article key={c.title} className="event-card reveal">
              <h3 className="font-serif text-2xl text-navy">{c.title}</h3>
              <p className="text-warmgray mt-3 leading-relaxed">{c.body}</p>
              {c.title === "Weddings" && (
                <Link href="/weddings" className="inline-block mt-4 text-gold uppercase tracking-widest text-xs hover:text-navy transition">
                  See our wedding experience →
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      title: "Graduation Parties",
      body: "Custom magnets for all your guests. Packages starting at $250.",
    },
    {
      title: "Weddings",
      body: "On-site magnet station for your reception. Custom packages available. Contact us for a quote.",
    },
    {
      title: "Corporate Events",
      body: "Branded magnets for your team. Custom packages available. Contact us for a quote.",
    },
  ];
  return (
    <section id="pricing" className="px-5 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center reveal">
          <SectionLabel>Packages</SectionLabel>
          <SectionTitle>Event Pricing</SectionTitle>
          <div className="heart-divider my-8"><span>♥</span></div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {tiers.map((t) => (
            <div key={t.title} className="pricing-card reveal">
              <p className="font-serif text-2xl text-navy">{t.title}</p>
              <div className="heart-divider my-6"><span>♥</span></div>
              <p className="text-warmgray leading-relaxed">{t.body}</p>
              {t.title === "Weddings" && (
                <Link href="/weddings" className="inline-block mt-4 text-gold uppercase tracking-widest text-xs hover:text-navy transition">
                  See our wedding experience →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Capture the form synchronously — React nulls e.currentTarget after the handler returns.
    const form = e.currentTarget;
    setSubmitting(true);
    setStatus("idle");
    setErrMsg(null);
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      eventType: String(fd.get("eventType") || ""),
      message: String(fd.get("message") || ""),
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Could not send. Try again.");
      }
      // On success the form unmounts (replaced by the thank-you panel), so a
      // separate reset() is unnecessary — but call it defensively in case the
      // user comes back to the form via state change.
      form?.reset();
      setStatus("ok");
    } catch (err: any) {
      setStatus("err");
      setErrMsg(err.message || "Could not send. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="px-5 py-24 bg-warmwhite border-y border-bordercream">
      <div className="max-w-3xl mx-auto">
        <div className="text-center reveal">
          <SectionLabel>Get In Touch</SectionLabel>
          <SectionTitle>Book Us for Your Event</SectionTitle>
          <div className="heart-divider my-8"><span>♥</span></div>
          <p className="text-warmgray text-lg leading-relaxed max-w-2xl mx-auto">
            Whether it&apos;s a wedding, a birthday, a corporate gathering, or something else
            entirely — we&apos;d love to be part of it. Tell us about your event and we&apos;ll
            put together a custom package just for you.
          </p>
        </div>

        {status === "ok" ? (
          <div className="parlor-card p-8 mt-10 text-center reveal">
            <div className="mx-auto w-14 h-14 rounded-full bg-navy flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-warmwhite" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl text-navy mt-4">Thank you!</h3>
            <p className="text-warmgray mt-2">We&apos;ll be in touch soon to talk about your event.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="parlor-card p-6 sm:p-8 mt-10 space-y-5 reveal">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" name="name" required className="input" autoComplete="name" />
              </div>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required className="input" autoComplete="email" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" className="input" inputMode="tel" autoComplete="tel" />
              </div>
              <div>
                <label className="label" htmlFor="eventType">Event Type</label>
                <select id="eventType" name="eventType" required className="input" defaultValue="">
                  <option value="" disabled>Select…</option>
                  <option>Wedding</option>
                  <option>Birthday Party</option>
                  <option>Corporate Event</option>
                  <option>Market or Festival</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="message">Message</label>
              <textarea id="message" name="message" required className="input min-h-32" rows={5} />
            </div>
            {status === "err" && <p className="text-sm text-red-700">{errMsg}</p>}
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Sending…" : "Send Inquiry"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-navydark text-cream px-5 py-16 mt-auto">
      <div className="max-w-4xl mx-auto text-center">
        <p className="font-script text-gold text-3xl">The</p>
        <p className="font-serif text-3xl text-cream -mt-1">Magnet Parlor</p>
        <p className="font-serif italic text-goldmuted mt-2">Capture the moment. Keep the memory.</p>
        <div className="footer-divider my-8"><span>♥</span></div>
        <ul className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-[0.3em] text-cream/80">
          <li><a href="#about" className="hover:text-cream">About</a></li>
          <li><a href="#events" className="hover:text-cream">Events</a></li>
          <li><a href="#pricing" className="hover:text-cream">Pricing</a></li>
          <li><a href="#contact" className="hover:text-cream">Book Us</a></li>
        </ul>
        <p className="text-xs text-cream/60 mt-10">© 2026 The Magnet Parlor. Northeast Ohio.</p>
      </div>
    </footer>
  );
}
