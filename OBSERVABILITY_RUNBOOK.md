# NexusStream Observability Runbook (Runtime + Payments)

## Scope
Use this runbook when workflow runs appear stuck, payments are not upgrading, or webhook behavior is unclear.

## 1) Runtime incident quick triage
1. Open browser console and look for runtime status logs from RunModal.
2. Confirm whether run start was blocked by validation or by duplicate-start guard.
3. If cloud run was started, verify timeout and terminal status behavior (`COMPLETED` or `FAILED`).

## 2) Payment incident quick triage
1. Check PayPal webhook delivery history for HTTP status code.
2. Check Vercel function logs for `[PAYPAL_WEBHOOK]` messages.
3. Validate Firestore payment/event docs and user plan fields for same event/payment IDs.

## 3) Primary health checks
- `GET /api/billing/paypal/webhook` should return:
  - `ok: true`
  - `firebaseReady: true`
  - `env: sandbox|live`
- If `firebaseReady` is false, inspect Firebase Admin env vars immediately.

## 4) Known failure signatures
- `Missing PayPal signature header` -> sender is not PayPal webhook source or headers stripped.
- `Invalid signature` -> `PAYPAL_WEBHOOK_ID` mismatch or wrong sandbox/live mode.
- `Billing store unavailable` -> Firebase Admin env/key formatting issue.
- `duplicate: true` -> normal retry skip path; no upgrade duplication.

## 5) Recovery checklist
1. Fix env mismatch (`PAYPAL_ENV`, webhook ID, Firebase Admin vars).
2. Redeploy and re-run a sandbox payment.
3. Confirm webhook 200 + payment doc + user tier update.
4. Confirm frontend reflects updated plan state.