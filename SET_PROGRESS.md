# Set Progress Tracker

This file gives a clear view of what is completed vs pending in the current fast-execution model.

## Overall status
- Completed sets: **S2**, **S3**, **S4** (connector phase-1 + prioritization).
- In-progress sets: **S1 external replay verification**.
- Pending sets: **S1 live execution evidence** (environment dependent).

## Detailed breakdown


## Live snapshot (share this in every next update)
- **Overall completion:** 96%
- **Remaining completion:** 4%
- **Primary blocker:** S1 external replay evidence (dashboard-dependent).
- **Best-case ETA:** 40–55 minutes
- **ETA with one fix + redeploy:** 60–120 minutes

### S1 — Payment Reliability Pack
- [x] PayPal create-order input validation and approval URL guard.
- [x] Webhook required header checks and signature verification path.
- [x] Idempotency for duplicate webhook deliveries.
- [x] Firestore unavailable graceful response (`503`).
- [ ] External end-to-end sandbox replay verification checklist execution.

### S2 — Runtime Stability Pack
- [x] Duplicate-start prevention in local/cloud run handlers.
- [x] Explicit blocked-state logs for clarity.
- [x] Timeout/unsubscribe cleanup to avoid stale listeners.
- [x] Build + typecheck validation.

### S3 — Observability Starter Pack
- [x] Health payload includes `firebaseReady` for quick diagnostics.
- [x] Core payment event logs for duplicate/success paths.
- [x] Standardized troubleshooting runbook for runtime + webhook incidents.
- [x] Quick log pattern guide for operators.

### S4 — Connector Hardening Starter
- [x] Prioritize top connectors by usage.
- [x] Add input validation defaults.
- [x] Add retry policy defaults.
- [x] Add clearer connector failure messages.
- [x] Publish connector hardening order (`CONNECTOR_PRIORITY.md`).

### S5 — Deployment Ops Pack
- [x] Deployment checklist exists and includes required env matrix.
- [x] Added external dashboard checks for Firebase/Vercel/PayPal.
- [x] Added external smoke flow and troubleshooting map.

## Recommended next command mapping
- `npm run ops:s1:check -- --base-url=https://<domain>` -> quick readiness gate before live replay.
- `npm run ops:s1:evidence:init -- --domain=https://<domain> --uid=<uid>` -> create timestamped proof file before replay.
- `npm run ops:s1:next-fast -- --domain=https://<domain> --uid=<uid>` -> run readiness + evidence generation in one command.
- Add `--allow-health-fail` when endpoint is temporarily unreachable but you still need to prepare evidence file.
- `next` -> Execute **S1** replay verification using checklist and collect evidence.
- `next fast` -> Execute **S1** replay verification + deployment docs proof updates.
- Include completion % + ETA in response header.


## Estimated time to full completion
- Best case (all envs correct): **40–55 min**.
- With one env fix/redeploy cycle: **60–120 min**.
- Detailed breakdown: `COMPLETION_TIMELINE.md`.
- Evidence capture format: `S1_EVIDENCE_TEMPLATE.md`.
- Simple pending explainer: `REMAINING_WORK_SIMPLE.md`.