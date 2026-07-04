# Groundswork.ai — Promo Video (Remotion)

A ~38s brand promo for **Groundswork.ai**, built in [Remotion](https://remotion.dev).
One composition renders to two aspect ratios:

| Deliverable | Composition | Size | Use |
| --- | --- | --- | --- |
| `out/groundswork-promo-16x9.mp4` | `Promo-16x9` | 1920×1080 | Website hero / YouTube |
| `out/groundswork-promo-9x16.mp4` | `Promo-9x16` | 1080×1920 | Reels / Shorts / TikTok |

Both are H.264 MP4, 30fps, CRF 18.

## Setup

```bash
npm install
```

Node is required. Remotion downloads and manages its own headless Chromium on
first render — no manual browser install needed on the Windows render rig.

## Preview (Remotion Studio)

```bash
npm run studio
```

Opens the interactive editor. Select **Promo-16x9** or **Promo-9x16** from the
sidebar and scrub the timeline.

## Render

```bash
npm run render:169    # → out/groundswork-promo-16x9.mp4
npm run render:916    # → out/groundswork-promo-9x16.mp4
npm run render:all    # both, sequentially
```

## Project structure

Content and animation are fully separated so the timing/copy can be reused as a
caption track in Phase 2 (raw footage + ffmpeg).

```
src/
  video.config.ts     # ← FPS, scene durations, ALL copy, timeline math (Phase 2 reuses this)
  theme.ts            # brand tokens (colors, fonts, eyebrow style)
  fonts.ts            # Fraunces + Archivo via @remotion/google-fonts
  Root.tsx            # registers the 16:9 and 9:16 compositions
  Promo.tsx           # assembles scenes (crossfades) + grass line + audio
  components/
    Background.tsx    # soil radial gradient
    GrassLine.tsx     # signature grass-blade progress bar
    motion.tsx        # RiseIn / SpringIn / Eyebrow entrance primitives
    layout.ts         # orientation-aware reflow helper (16:9 ↔ 9:16)
  scenes/
    Scene1Hook.tsx … Scene6Cta.tsx
```

### The grass line

A ground line of 46 grass blades springs up left-to-right in sync with video
progress — it doubles as a progress bar, with a dirt-fill bar tracking
underneath. Blade geometry is deterministic (`random(seed)`), so every render is
identical. It completes at the start of the CTA's ~1.5s hold and stays full
through the final frame.

## Audio

The music bed is a **silent placeholder** until the real track is supplied.
To swap it in, it's a one-liner in `src/video.config.ts`:

```ts
// 1. Drop the file in public/  (e.g. public/music.mp3)
// 2. Set:
export const MUSIC_SRC = 'music.mp3';
```

Leaving `MUSIC_SRC = null` renders a silent audio track (the MP4s still carry an
audio stream), so nothing else needs to change.

## Editing copy or timing

Everything text- and time-related lives in `src/video.config.ts`:

- `SCENES` — per-scene durations (seconds)
- `COPY` — every on-screen string, keyed by scene
- `FPS`, `TRANSITION_SECONDS`

No animation code needs touching to adjust wording or pacing.

## Rendering notes

The committed `render:*` scripts are clean and cross-platform. If you render
inside a TLS-intercepting proxy (e.g. some CI sandboxes) where the headless
browser can't validate `fonts.gstatic.com`, point Remotion at a system Chromium
and relax cert checks for that run only:

```bash
REMOTION_BROWSER_EXECUTABLE=/path/to/chromium \
  npx remotion render Promo-16x9 out/groundswork-promo-16x9.mp4 \
  --codec=h264 --crf=18 --ignore-certificate-errors
```

`remotion.config.ts` already reads `REMOTION_BROWSER_EXECUTABLE` when set.
