/**
 * Video-wide configuration: frame rate, durations, and all on-screen copy.
 *
 * This is deliberately the *only* place scene timing and text live. Phase 2
 * (raw footage + ffmpeg caption track) can import `SCENES` and `FPS` from here
 * to drive caption timing without touching any React/animation code.
 */

export const FPS = 30;

/** Crossfade length between scenes, in seconds. */
export const TRANSITION_SECONDS = 0.5;

/** Convert seconds → whole frames at the project FPS. */
export const sec = (s: number) => Math.round(s * FPS);

export const TRANSITION_FRAMES = sec(TRANSITION_SECONDS);

/**
 * Music bed. To swap in the real track (Phase: NEEDS ME):
 *   1. Drop the file in `public/` (e.g. public/music.mp3)
 *   2. Set MUSIC_SRC = 'music.mp3'
 * Leaving it null renders a silent audio bed — the promo still renders end to
 * end, and the swap is a genuine one-liner.
 */
export const MUSIC_SRC: string | null = null;

export type SceneId =
  | 'hook'
  | 'pain'
  | 'turn'
  | 'features'
  | 'credibility'
  | 'cta';

export interface SceneConfig {
  id: SceneId;
  /** Scene length in seconds (before crossfade overlap is subtracted). */
  durationSeconds: number;
}

/**
 * Ordered scene list with durations. Timings are within the ±10% GREEN/YELLOW
 * band from the brief. Total wall-clock after crossfade overlap is ~38s.
 */
export const SCENES: SceneConfig[] = [
  { id: 'hook', durationSeconds: 5.5 },
  { id: 'pain', durationSeconds: 6.5 },
  { id: 'turn', durationSeconds: 6.0 },
  { id: 'features', durationSeconds: 8.0 },
  { id: 'credibility', durationSeconds: 6.0 },
  { id: 'cta', durationSeconds: 8.5 }, // 7s content + 1.5s hold
];

/** All copy, keyed by scene. Kept as plain data for Phase 2 reuse. */
export const COPY = {
  hook: {
    clockFrom: '7:04 PM',
    clockTo: '7:09 PM',
    headline: ["You're still doing ", 'invoices.'], // 2nd part italic/leaf
    sub: 'Twelve hours on the crew. Two more at the desk.',
  },
  pain: {
    eyebrow: 'MEANWHILE',
    lines: [
      'Three missed calls went to voicemail.',
      'Two estimates never got sent.',
      'A $9,000 patio lead went cold.',
      'And your competitor answered in 30 seconds.',
    ],
  },
  turn: {
    eyebrow: "THERE'S A BETTER WAY TO RUN THIS",
    logo: 'groundswork',
    logoAccent: '.ai',
    tagline: 'AI AUTOMATION BUILT FOR THE GREEN INDUSTRY',
  },
  features: {
    headline: ['Your back office, ', 'on autopilot.'], // 2nd part italic/leaf
    cards: [
      {
        title: 'Every lead answered',
        body: "Calls, texts, and form fills get an instant response — even when you're on a skid steer.",
      },
      {
        title: 'Follow-ups that never forget',
        body: 'Estimates chased, reviews requested, no-shows rebooked. Automatically.',
      },
      {
        title: 'Paperwork off your plate',
        body: "Invoices, scheduling, and pipeline updates handled while you're in the field.",
      },
    ],
  },
  credibility: {
    headline: ['Built by a contractor. ', 'Not a software company.'], // 2nd italic/leaf
    sub: 'Every system we sell runs our own landscaping company first — 10+ years in the field, 130+ five-star reviews.',
    caps: 'PROVEN ON REAL CREWS · REAL CUSTOMERS · REAL DIRT',
  },
  cta: {
    eyebrow: 'FREE TOOLS · GUIDES · DONE-FOR-YOU BUILDS',
    url: 'groundswork',
    urlAccent: '.ai',
    closing: 'We handle the back office. You stay in the field.',
  },
} as const;

/**
 * Compute per-scene frame layout. Because scenes crossfade, each scene after
 * the first starts TRANSITION_FRAMES early, and total duration subtracts one
 * overlap per transition.
 */
export const computeTimeline = () => {
  const durations = SCENES.map((s) => sec(s.durationSeconds));
  const totalDuration =
    durations.reduce((a, b) => a + b, 0) -
    TRANSITION_FRAMES * (SCENES.length - 1);

  // Absolute start frame of each scene on the master timeline (accounting for
  // the crossfade overlap). Useful for the grass-line progress mapping.
  let cursor = 0;
  const starts: number[] = [];
  durations.forEach((d, i) => {
    starts.push(cursor);
    cursor += d - (i < SCENES.length - 1 ? TRANSITION_FRAMES : 0);
  });

  return { durations, starts, totalDuration };
};
