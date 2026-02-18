# Remaining Work (Simple + Function-wise)

## Simple status
- **Overall done:** 96%
- **Pending:** 4%
- **What is left:** only **live external verification** (dashboard side), not major code rewrite.

## Pending items (simple)
1. Do 1 sandbox payment from app.
2. Replay same webhook event from PayPal dashboard.
3. Save proof (logs + Firestore + checklist).
4. Mark final pass in evidence file.

## Function-wise explanation (what each function does + what to verify)

### 1) `api/billing/paypal/createOrder.ts`
**Function:** Creates PayPal order safely with validated input (`userId`, `amount`, `currency`) and returns approval URL.
**Pending check:** From UI, verify this endpoint returns valid approval URL and opens checkout.

### 2) `api/billing/paypal/webhook.ts`
**Function:** Receives PayPal webhook, verifies signature headers, handles approved payment events, and prevents duplicate processing.
**Pending check:** After first payment event, replay same event and confirm duplicate skip path is logged.

### 3) `scripts/s1-live-check.mjs`
**Function:** Quick readiness gate (checks webhook health endpoint fields like `ok`, `paypalEnv`, `firebaseReady`).
**Pending check:** Run once before payment test to avoid wasting time on bad env setup.

### 4) `scripts/s1-init-evidence.mjs`
**Function:** Creates a timestamped evidence file under `evidence/s1/` with prefilled metadata.
**Pending check:** Generate file before running payment/replay so evidence is captured cleanly.

### 5) `S1_EVIDENCE_TEMPLATE.md`
**Function:** Final proof checklist template.
**Pending check:** Ensure all 5 checks are marked pass after replay test.

## ETA
- **Best case:** 40–55 min
- **If one env fix/redeploy needed:** 60–120 min

## What "next fast" will do now
- Run readiness command.
- Generate evidence file.
- Then execute live payment + replay verification steps.

### One-command fast start
`npm run ops:s1:next-fast -- --domain=https://<domain> --uid=<uid>`

Optional when endpoint is temporarily unreachable:
`npm run ops:s1:next-fast -- --domain=https://<domain> --uid=<uid> --allow-health-fail`