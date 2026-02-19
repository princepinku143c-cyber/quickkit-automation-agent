# Remaining Work (Simple + Function-wise)

## Simple status
- **Overall done:** 100%
- **Pending:** 0%
- **What is left:** verification phase closed; next phase is optimization/growth only.

## Pending items (simple)
- None for verification phase (S1 closed).

## Function-wise explanation (what each function does + what to verify)

### 1) `api/billing/paypal/createOrder.ts`
**Function:** Creates PayPal order safely with validated input (`userId`, `amount`, `currency`) and returns approval URL.
**Status:** Verified in external S1 closure run.

### 2) `api/billing/paypal/webhook.ts`
**Function:** Receives PayPal webhook, verifies signature headers, handles approved payment events, and prevents duplicate processing.
**Status:** Verified in external S1 closure run.

### 3) `scripts/s1-live-check.mjs`
**Function:** Quick readiness gate (checks webhook health endpoint fields like `ok`, `paypalEnv`, `firebaseReady`).
**Status:** Completed during verification flow.

### 4) `scripts/s1-init-evidence.mjs`
**Function:** Creates a timestamped evidence file under `evidence/s1/` with prefilled metadata.
**Status:** Completed during verification flow.

### 5) `S1_EVIDENCE_TEMPLATE.md`
**Function:** Final proof checklist template.
**Status:** Completed (all checks passed).

## ETA
- **Best case:** Completed
- **If one env fix/redeploy needed:** Completed

## What "next fast" will do now
- Execute optimization phase (connector depth, templates, observability dashboards).
- Keep payment verification in maintenance mode.

### One-command fast start
`npm run ops:s1:next-fast -- --domain=https://<domain> --uid=<uid>`

Optional when endpoint is temporarily unreachable:
`npm run ops:s1:next-fast -- --domain=https://<domain> --uid=<uid> --allow-health-fail`
