# Lessons

## Windows / MSYS shell gotchas (this repo)
- **`/tmp` and path translation:** MSYS bash `/tmp` (and other `/`-rooted paths)
  are NOT understood by native Windows tools invoked from that shell — Windows
  `python`/`node` resolve `/tmp/x` to `C:\tmp\x`. `curl -F "file=@/tmp/x"` may
  also fail to find the file. **Use repo-relative paths (`./.smoke/x`) for any
  file handed between bash, curl, and node/python.** Symptom: "file not found" or
  empty JSON when the file clearly exists per `ls`.
- **Each Bash tool call is a fresh shell** — cookie jars, env vars, and `cd` do
  not persist. Do a full flow (login → act) inside ONE call, or use absolute/
  repo-relative jar paths written earlier in the same call.
- **`sleep N && cmd` is blocked** by the harness. Use `Monitor` with an
  `until <check>; do sleep 3; done` loop, or Bash `run_in_background`.

## Deploy (magnet-parlor)
- `python .claude/deploy/deploy.py` tars, scps, and runs `server_deploy.sh`.
- Excludes `.env`, `data/`, `public/uploads`, `node_modules`, `.next` — the
  server preserves its own `.env` and DB on re-deploy. Adding npm deps means the
  server runs `npm ci`; avoid new deps when possible to keep deploy friction low.
- DB migrations run on module load (idempotent ALTER/CREATE) — additive columns/
  tables apply automatically to the prod DB on first request.

## Product defaults (magnet-parlor crop step)
- **Don't infer auto-select bands from a spec without flagging real-world
  impact.** The 0.80–1.25 FIT band made ordinary 4:3 phone photos default to
  FIT. User's rule: always default to FILL; FIT auto-selects only for extreme
  ratios (< 0.6 or > 1.67) or when FILL can't reach 720px. When a threshold
  would change behavior for the *common* input, raise it before shipping.

## Server-side checks must run before money moves
- Any validation that can reject an order must run before the charge exists
  (here: before the PaymentIntent), via ONE shared function — never rely on
  client checks "happening to match" the server. Check every intent route:
  /api/create-payment-intent, /api/gallery/[id]/intent, /api/tip.
