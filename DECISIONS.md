# Decisions Log

Records autonomy calls made while building the Groundswork.ai promo, per the
brief's GREEN / YELLOW / RED tiers.

## RED (needs sign-off) — none taken

No copy was rewritten, no scenes added/removed, no brand colors/fonts changed,
no music selected, nothing published. All copy is verbatim from the brief. The
music bed is wired as a silent placeholder (see README) awaiting the real track.

## YELLOW (noted, proceeded)

- **Final runtime is 38.0s (target ~40s).** The six scene durations sum to
  40.5s, but the five 0.5s crossfades overlap adjacent scenes (−2.5s total),
  netting 38.0s. Within the ±10% tolerance. No individual scene duration was
  changed from the brief.

## GREEN (design latitude — for transparency)

- **Grass line completion timing.** The line reaches 100% at the *start* of the
  CTA's ~1.5s hold (not on the literal last frame) so the finished line is
  visible while the final frame holds — matching "completes as the scene ends /
  hold final frame." Controlled by `settleFrames` in `GrassLine`.
- **Grass line details.** 46 blades, heights 14–48px, rotation ±5°, widths
  4–7px, leaf→moss vertical gradient, spring grow-in with a small per-blade
  frame stagger. Geometry is seeded (`random(seed)`) for deterministic renders.
  A moss→leaf dirt-fill bar tracks progress underneath.
- **Scene transitions.** 0.5s fade crossfades via `@remotion/transitions`.
- **Entrance motion.** Eased `translateY(18px)+fade` (`RiseIn`) as the default;
  spring scale-in with slight overshoot (`SpringIn`) for the logo and URL
  reveals. No linear moves, no spin/bounce/shimmer.
- **9:16 reflow.** Feature cards stack vertically; headline/URL sizes reduced;
  content re-centered for portrait safe zones. Driven by one `useLayout()` hook
  so both comps share every scene component.
- **Clock tick (Scene 1).** Steps discretely 7:04→7:09 PM across the scene
  (one minute per ~0.9s) rather than smoothly, reading as a real clock.
- **Render settings.** H.264, CRF 18, 30fps, jpeg frame format (Remotion
  default) for speed.

## Render environment note

Verified in this build by rendering preview stills of every scene in both
aspect ratios (equivalent to a Studio preview pass in a headless environment),
then the full MP4s. On the Windows rig, `npm run studio` gives the interactive
preview and `npm run render:169` / `render:916` produce the finals.
