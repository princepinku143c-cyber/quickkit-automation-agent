# Next Sets (Fast Execution Plan)

Use these named sets when asking the agent to continue work quickly.
When you say `next S1` (or only `next`), the matching set is executed in one batch.

## How much work in one `next`?
- **Standard mode (default):** 1 full set per `next` (safe + fast).
- **Fast mode:** up to 2 sets per `next` if changes are low-risk and related.
- **Max recommended in one go:** 90 minutes of scoped work, then validate (build + typecheck).

## Status format (what I will always report)
When you say `next`, updates will follow this structure:
1. **Started set:** `Sx - Name`
2. **Completed in this batch:** bullet list
3. **Remaining in set:** bullet list
4. **Next suggested set:** `Sy - Name`


## Live progress reference
- Current completion status is tracked in `SET_PROGRESS.md`.
- Ask `next status` to get completed vs remaining items before coding.
- Run `npm run ops:s1:check -- --base-url=https://<domain>` before external S1 replay to avoid delays.
- Run `npm run ops:s1:evidence:init -- --domain=https://<domain> --uid=<uid>` to create a ready-to-fill proof file.
- Shortcut command: `npm run ops:s1:next-fast -- --domain=https://<domain> --uid=<uid>` (runs readiness + evidence init together).
- Optional flags: `--allow-health-fail` (continue if health endpoint is unreachable) and `--skip-health` (skip readiness gate).

## S1 — Payment Reliability Pack (45–60 min)
- Verify PayPal create-order request validation and response guards.
- Verify webhook header validation + idempotency behavior against duplicate deliveries.
- Validate Firestore write path and graceful `503` behavior when billing store is unavailable.
- Run build + typecheck.

## S2 — Runtime Stability Pack (45–60 min)
- Harden run start/stop guardrails in `RunModal`.
- Ensure no stale cloud subscriptions/timeouts survive modal close/reopen.
- Improve blocked/duplicate-start user logs to avoid “stuck” confusion.
- Run build + typecheck.

## S3 — Observability Starter Pack (60–90 min)
- Add/standardize run and payment log messages for troubleshooting.
- Verify health endpoint payload fields used for external checks.
- Document quick troubleshooting sequence for webhook + runtime failures.
- Run build + typecheck.

## S4 — Connector Hardening Starter (60–90 min)
- Pick top-priority connectors and add input validation + retry policy defaults.
- Ensure failure messages are actionable.
- Reference priority order in `CONNECTOR_PRIORITY.md`.
- Run build + typecheck.

## S5 — Deployment Ops Pack (30–45 min)
- Re-validate `DEPLOYMENT_CHECKLIST.md` against current code paths.
- Add missing external dashboard checks (Vercel/Firebase/PayPal).
- Run build + typecheck.

---


## Mandatory report in every `next` response
From now until all sets are complete, every `next` / `next fast` update must include:
1. **Started set name** and what was added in this batch.
2. **Pending work list** (exact unchecked items).
3. **Completion %** (overall and set-wise).
4. **ETA** (best case + with 1 fix/redeploy cycle).
5. **Next set preview** (what will be added next time).

## Default sequencing rule
- If prompt is only `next`, execute **S2** first, then continue **S1 → S3 → S4 → S5**.
- If prompt is `next fast`, execute current set + next related set (max 2 sets).
- For remaining ETA reference use `COMPLETION_TIMELINE.md`.
- For simple pending + function-wise explanation use `REMAINING_WORK_SIMPLE.md`.
- Each set must end with: summary + commands executed + result status.