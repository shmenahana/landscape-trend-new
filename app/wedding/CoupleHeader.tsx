// Pure presentational couple header — the calligraphy hero shown on /wedding and
// mirrored live in the dashboard's Wedding Settings preview. No hooks, so it is
// safe to import from both client and server components.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Accepts an ISO date (YYYY-MM-DD, from a native date input) and renders it as
// "June 14, 2026". Any other string is shown verbatim so freeform dates still work.
export function formatEventDate(raw: string): string {
  const s = (raw || "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12) return s;
  return `${MONTHS[mo - 1]} ${d}, ${y}`;
}

export function CoupleHeader({
  coupleText,
  eventDate,
  subtitle,
  compact = false,
}: {
  coupleText: string;
  eventDate: string;
  subtitle: string;
  /** Slightly smaller sizing for the dashboard preview. */
  compact?: boolean;
}) {
  const dateDisplay = formatEventDate(eventDate);
  const text = coupleText.trim() || "Congratulations!";
  const nameSize = compact
    ? "clamp(2rem, 8vw, 3rem)"
    : "clamp(2.75rem, 13vw, 5.25rem)";

  return (
    <div className="text-center">
      <div className="ornament-line" aria-hidden>
        <span>♥</span>
      </div>
      <p className="font-script text-goldmuted text-2xl leading-none">The wedding of</p>
      <h1
        className="font-script text-navy leading-[1.05] mt-1 px-2"
        style={{ fontSize: nameSize }}
      >
        {text}
      </h1>
      {dateDisplay && (
        <p className="font-serif text-gold uppercase tracking-[0.35em] text-sm mt-4">
          {dateDisplay}
        </p>
      )}
      {subtitle.trim() && (
        <p className="text-warmgray italic mt-2">{subtitle.trim()}</p>
      )}
      <div className="ornament-line" aria-hidden>
        <span>♥</span>
      </div>
    </div>
  );
}
