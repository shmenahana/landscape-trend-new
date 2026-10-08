import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const EMAIL = "hello@themagnetparlor.com";
const PHONE_DISPLAY = "(330) 417-4183";
const PHONE_TEL = "+13304174183";
const INQUIRE = "/#contact"; // reuse the homepage inquiry form
const MAILTO = `mailto:${EMAIL}?subject=Wedding%20Inquiry%20%E2%80%94%20The%20Magnet%20Parlor`;

export const metadata: Metadata = {
  title: { absolute: "Wedding Photo Magnets — Live at Your Reception | The Magnet Parlor" },
  description:
    "Custom photo magnets made live at your wedding. Guests upload their photos throughout the evening and we press them into keepsake magnets on site — plus a private gallery of every photo after the celebration. Serving Northeast Ohio.",
  alternates: { canonical: SITE_URL + "/weddings" },
  openGraph: {
    title: "Custom Photo Magnets, Made Live at Your Wedding",
    description:
      "Your guests add their photos throughout the evening — we press them into keepsake magnets on site. A favor they'll actually keep, and a gallery of every candid photo for you.",
    url: SITE_URL + "/weddings",
    siteName: "The Magnet Parlor",
    type: "website",
    locale: "en_US",
    images: [{ url: "/weddings/og.jpg", width: 1200, height: 630, alt: "The Magnet Parlor — live wedding photo magnets" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Photo Magnets, Made Live at Your Wedding",
    description:
      "Guests add their photos throughout the evening — we press them into keepsake magnets on site. Serving Northeast Ohio.",
    images: ["/weddings/og.jpg"],
  },
};

const STEPS = [
  {
    n: "1",
    img: "/weddings/step-1.webp",
    alt: "A guest opens The Magnet Parlor page on their phone after scanning the QR code",
    title: "Guests scan a QR code",
    body: "A little card sits on our table. Guests scan it with their phone camera — no app to download, no account to make. It works on any phone, instantly.",
  },
  {
    n: "2",
    img: "/weddings/step-2.webp",
    alt: "The photo upload screen where a guest picks a photo from their night",
    title: "They snap or upload a photo",
    body: "They take a picture at our photo setup, or upload one they already snapped somewhere else on the property that night — straight from their phone, in seconds.",
  },
  {
    n: "3",
    img: "/weddings/step-3.webp",
    alt: "The crop screen showing a couple's photo being framed to a square magnet",
    title: "They crop it just right",
    body: "A simple crop tool lets each guest frame their magnet exactly how they want it to look. What they see is what they get.",
  },
  {
    n: "4",
    img: "/weddings/step-4.webp",
    alt: "A guest's chosen photo ready to be made into a magnet",
    title: "We make it on site",
    body: "Their photo comes straight to our station, where we print and press it into a real magnet right there at your reception. No need to wait around or watch — we handle it while they get back to the party.",
  },
  {
    n: "5",
    img: "/weddings/step-5.webp",
    alt: "The confirmation screen letting a guest know their magnet is being made",
    title: "They take it home",
    body: "Guests grab their finished magnet whenever they're ready — later in the night or on their way out the door. A favor that goes straight on the fridge.",
  },
];

const FAQS = [
  {
    q: "How many magnets can guests make?",
    a: "That depends on your package — we'll walk you through the options when you reach out, and tailor it to your guest count and timeline.",
  },
  {
    q: "Do you do outdoor weddings?",
    a: "Yes! We just need a spot with cover from rain. Tents, patios, and pavilions all work beautifully.",
  },
  {
    q: "Do you travel?",
    a: "We're based in Northeast Ohio and travel throughout the region. Tell us where you're celebrating and we'll sort out the details when you inquire.",
  },
  {
    q: "How far in advance should we book?",
    a: "Dates fill up, especially in peak season — reach out as early as you can so we can hold your date.",
  },
  {
    q: "Do guests need an app or account?",
    a: "No. They scan a QR code, upload a photo, and they're done. It works on any phone with a camera.",
  },
];

function ScriptEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-script text-goldmuted text-3xl sm:text-4xl leading-none">{children}</p>;
}

function Ornament() {
  return <div className="ornament-line" aria-hidden><span>♥</span></div>;
}

export default function WeddingsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-warmwhite/95 backdrop-blur border-b border-bordercream">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-baseline gap-2 shrink-0">
            <span className="font-script text-gold text-2xl leading-none">The</span>
            <span className="font-serif text-navy text-lg sm:text-xl tracking-wide">Magnet Parlor</span>
          </Link>
          <nav className="flex items-center gap-6">
            <a href="#how" className="hidden sm:inline text-xs text-charcoal hover:text-navy uppercase tracking-widest transition">How It Works</a>
            <a href="#gallery" className="hidden sm:inline text-xs text-charcoal hover:text-navy uppercase tracking-widest transition">The Gallery</a>
            <Link href={INQUIRE} className="btn-gold text-sm py-2 px-4">Inquire</Link>
          </nav>
        </div>
      </header>

      <div className="wedding-border" aria-hidden />

      {/* Hero */}
      <section className="px-5 pt-10 sm:pt-16 pb-16 text-center">
        <div className="max-w-3xl mx-auto">
          <Ornament />
          <ScriptEyebrow>A keepsake, made live</ScriptEyebrow>
          <h1 className="font-serif text-4xl sm:text-6xl text-navy leading-[1.08] mt-3">
            Custom Photo Magnets,<br className="hidden sm:block" /> Made Live at Your Wedding
          </h1>
          <p className="text-warmgray text-lg sm:text-xl leading-relaxed mt-6 max-w-2xl mx-auto">
            Your guests add their favorite photos throughout the evening, and we press them into
            beautiful keepsake magnets right there at your reception — a favor they&apos;ll
            actually keep.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-10">
            <Link href={INQUIRE} className="btn-primary">Inquire About Your Date</Link>
            <a href="#how" className="btn-outline">See How It Works</a>
          </div>
        </div>
      </section>

      {/* The guest book on the fridge */}
      <section className="px-5 py-20 bg-warmwhite border-y border-bordercream">
        <div className="max-w-3xl mx-auto text-center">
          <ScriptEyebrow>Why couples love it</ScriptEyebrow>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mt-3">
            The guest book that lives on the fridge
          </h2>
          <div className="heart-divider my-8"><span>♥</span></div>
          <p className="text-warmgray text-lg leading-relaxed">
            You end the night with a gallery of candid photos from every guest&apos;s phone —
            the laughing, dancing, in-between moments the photographer never catches. And your
            guests go home with a favor they&apos;ll actually keep for years: not a sparkler or
            a candle that gets tossed in a drawer, but a little piece of your day that lives on
            their fridge and makes them smile every morning.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-5 py-20 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <ScriptEyebrow>The evening, step by step</ScriptEyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mt-3">How It Works</h2>
            <div className="heart-divider my-8"><span>♥</span></div>
            <p className="text-warmgray text-lg max-w-2xl mx-auto leading-relaxed">
              No wristbands, no complicated setup — just a QR code and a few taps. Here&apos;s
              exactly what your guests see.
            </p>
          </div>

          <div className="mt-14 space-y-16 sm:space-y-24">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className={`flex flex-col ${i % 2 === 1 ? "sm:flex-row-reverse" : "sm:flex-row"} items-center gap-8 sm:gap-14`}
              >
                <div className="w-full sm:w-1/2 flex justify-center">
                  <div className="device-phone">
                    <div className="device-phone-screen">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.img} alt={s.alt} loading="lazy" width={640} height={1385} />
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-1/2 text-center sm:text-left">
                  <span className="wed-step-num">{s.n}</span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-navy mt-2">{s.title}</h3>
                  <p className="text-warmgray text-lg leading-relaxed mt-3 max-w-md mx-auto sm:mx-0">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The perfect timeline */}
      <section className="px-5 py-20 bg-warmwhite border-y border-bordercream">
        <div className="max-w-3xl mx-auto text-center">
          <ScriptEyebrow>Come, scan, and carry on</ScriptEyebrow>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mt-3">The Perfect Timeline</h2>
          <div className="heart-divider my-8"><span>♥</span></div>
          <p className="text-warmgray text-lg leading-relaxed">
            We&apos;re fully set up before cocktail hour begins — nothing for you to coordinate.
            We just recommend inviting guests to swing by during cocktail hour: they scan the QR
            code, snap a photo at our setup or upload one they already took somewhere on the
            property, and then head right back to the celebration. Photos keep coming in
            throughout the evening, and guests grab their finished magnets later on or on their
            way out. There&apos;s nothing to sit and watch — just a favor and a little fun.
          </p>
          <ol className="mt-10 grid sm:grid-cols-2 gap-4 text-left">
            {[
              ["Ready by cocktail hour", "We're fully set up before guests arrive — nothing for you to coordinate."],
              ["Guests swing by", "During cocktail hour they scan the QR code and add a photo in seconds."],
              ["Snap or upload", "They take a picture at our setup, or upload one from elsewhere on the property that night."],
              ["Pickup", "Finished magnets are ready to grab throughout the evening or on the way out — no waiting around."],
            ].map(([t, b]) => (
              <li key={t} className="parlor-card p-5">
                <p className="font-serif text-navy text-lg">{t}</p>
                <p className="text-warmgray mt-1 leading-relaxed">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* After the wedding — gallery */}
      <section id="gallery" className="px-5 py-20 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <ScriptEyebrow>Yours to keep</ScriptEyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mt-3">After the Wedding</h2>
            <div className="heart-divider my-8"><span>♥</span></div>
            <p className="text-warmgray text-lg max-w-2xl mx-auto leading-relaxed">
              A few days later, you receive a private link to the full gallery of every photo
              your guests uploaded — browsable, downloadable, and yours to keep. And if any of
              them make you smile, you can order your own keepsake magnets right from the
              gallery, shipped to your door.
            </p>
          </div>
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="device-browser">
              <div className="device-browser-bar" aria-hidden>
                <i /><i /><i />
                <span className="addr">themagnetparlor.com/gallery</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/weddings/gallery.webp" alt="A couple's private wedding photo gallery, populated with photos guests uploaded during the reception" loading="lazy" width={1600} height={1255} />
            </div>
          </div>
        </div>
      </section>

      {/* Easy on your venue — planners */}
      <section className="px-5 py-20 bg-warmwhite border-y border-bordercream">
        <div className="max-w-4xl mx-auto text-center">
          <ScriptEyebrow>For planners &amp; venues</ScriptEyebrow>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mt-3">Easy on Your Venue</h2>
          <div className="heart-divider my-8"><span>♥</span></div>
          <p className="text-warmgray text-lg leading-relaxed max-w-2xl mx-auto">
            We&apos;re completely self-contained — we bring our own table, power, and
            everything else. Just point us to a small spot to set up.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 text-left">
            {[
              ["Just a little space", "Show us where to set up — we bring our own table and everything else."],
              ["No wifi required", "We run on our own connection, so venue wifi is never an issue."],
              ["No AV needed", "No screens, no sound system, no technical setup on your end."],
              ["Small footprint", "A tidy little station that tucks neatly into your floor plan."],
            ].map(([t, b]) => (
              <div key={t} className="parlor-card p-5">
                <p className="font-serif text-navy text-lg">{t}</p>
                <p className="text-warmgray mt-1 leading-relaxed text-sm">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <ScriptEyebrow>Good to know</ScriptEyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mt-3">Frequently Asked</h2>
            <div className="heart-divider my-8"><span>♥</span></div>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="parlor-card p-5 group">
                <summary className="font-serif text-navy text-lg cursor-pointer list-none flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-gold text-xl transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="text-warmgray mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-24 bg-navydark text-cream text-center">
        <div className="max-w-2xl mx-auto">
          <p className="font-script text-gold text-4xl sm:text-5xl leading-none">Let&apos;s talk about your date</p>
          <p className="text-cream/85 text-lg leading-relaxed mt-6">
            We&apos;d love to hear about your celebration. Reach out and we&apos;ll put together
            a package that fits your day — and hold your date before it fills up.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-10">
            <Link href={INQUIRE} className="btn-gold">Inquire About Your Date</Link>
            <a href={MAILTO} className="btn-outline border-cream text-cream hover:bg-cream hover:text-navy">Email Us</a>
          </div>
          <div className="footer-divider my-10"><span>♥</span></div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 text-cream/85">
            <a href={MAILTO} className="hover:text-cream transition">{EMAIL}</a>
            <a href={`tel:${PHONE_TEL}`} className="hover:text-cream transition">{PHONE_DISPLAY}</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-cream px-5 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-script text-gold text-2xl">The Magnet Parlor</p>
          <p className="font-serif italic text-goldmuted mt-1 text-sm">Capture the moment. Keep the memory.</p>
          <ul className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-[0.3em] text-cream/75 mt-6">
            <li><Link href="/" className="hover:text-cream">Home</Link></li>
            <li><a href="#how" className="hover:text-cream">How It Works</a></li>
            <li><a href="#gallery" className="hover:text-cream">The Gallery</a></li>
            <li><Link href={INQUIRE} className="hover:text-cream">Inquire</Link></li>
          </ul>
          <p className="text-xs text-cream/60 mt-8">© 2026 The Magnet Parlor. Northeast Ohio.</p>
        </div>
      </footer>
    </main>
  );
}
