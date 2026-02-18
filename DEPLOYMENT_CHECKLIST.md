# NexusStream Deployment & Payment Readiness Checklist

## 1) Firebase Console
- Enable Google provider in **Authentication > Sign-in method**.
- Add production domain in **Authentication > Settings > Authorized domains**.
- Deploy Firestore rules from `firestore.rules`.
- Ensure collections exist: `users`, `projects`, `payments`, `coupons`.

### Firebase external checks
- Confirm user profile document contains billing fields after payment (`tier`, `status`, `provider`, `plan.*`).
- Confirm webhook writes are visible in `payments` collection (`status=success`, `rawEventType`).
- Verify Firestore rules do not allow client writes to payment logs.

## 2) Vercel Environment Variables
### Frontend
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)

### Backend / Webhooks
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (escaped newlines: `\\n`)
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV` (`sandbox` or `live`)
- `PAYPAL_WEBHOOK_ID`
- `APP_BASE_URL` (e.g. `https://www.nexusstream.site`)
- `TEST_API_SECRET` (for locked diagnostic routes)

### Vercel external checks
- Confirm all envs are present in **Production + Preview** scopes where needed.
- Confirm latest deployment picked updated env values (redeploy after env updates).
- Verify function logs for `/api/billing/paypal/webhook` show `received: true` responses.

## 3) PayPal Dashboard
- Webhook URL: `https://<domain>/api/billing/paypal/webhook`
- Events:
  - `PAYMENT.CAPTURE.COMPLETED`
  - `BILLING.SUBSCRIPTION.ACTIVATED`

### PayPal external checks
- Sandbox/live mode must match `PAYPAL_ENV`.
- Webhook delivery history should show HTTP 200 for recent events.
- If retries occur, confirm API responses include duplicate skip handling.

## 4) Local validation commands
1. Build: `npm run build`
2. Type-check: `npx tsc --noEmit`
3. Live S1 readiness check: `npm run ops:s1:check -- --base-url=https://<domain>`
4. Initialize evidence file: `npm run ops:s1:evidence:init -- --domain=https://<domain> --uid=<uid>`
5. Optional quick API smoke (local/dev):
   - `GET /api/billing/paypal/webhook` should return `ok: true` and `firebaseReady` flag.
   - `POST /api/billing/paypal/createOrder` with valid payload should return `approvalUrl`.

## 5) External smoke test sequence (10–15 min)
1. Trigger a sandbox payment from UI upgrade flow.
2. Observe PayPal webhook delivery (PayPal dashboard).
3. Observe function log entry (Vercel logs).
4. Confirm `users/<uid>` upgraded to `PRO` and payment record written.
5. Refresh UI and verify plan state reflects upgraded tier.

## 6) Expected behavior
- Logout resets local plan state to `FREE`.
- PayPal duplicate webhook should not double-process successful payment.
- In production, diagnostic routes require `x-test-secret`.

## 7) Quick troubleshooting map
- `400 Missing PayPal signature header` -> Check webhook source and required transmission headers.
- `400 Invalid signature` -> Verify `PAYPAL_WEBHOOK_ID` and mode mismatch (sandbox/live).
- `503 Billing store unavailable` -> Check Firebase Admin env vars and private key formatting.
- `duplicate: true` -> Expected for webhook retries; no action required unless first event failed.


## 8) PayPal external replay verification (S1 completion)
Use this when you need concrete proof that idempotency + upgrade path is working.

### 8.1 Capture baseline
- Run readiness gate first: `npm run ops:s1:check -- --base-url=https://<domain>`
- Record target user id (`uid`) and current `users/<uid>.tier`.
- Open Vercel logs filter: `/api/billing/paypal/webhook`.
- Open PayPal webhook delivery history screen.

### 8.2 Trigger sandbox payment
- Execute upgrade flow once from UI.
- Confirm first webhook delivery returns HTTP 200.

### 8.3 Replay same event from PayPal dashboard
- In webhook delivery history, replay the same event id.
- Expected API behavior: `duplicate: true` response or duplicate-skip log.

### 8.4 Evidence checklist (mark pass/fail)
- [ ] First event upgraded to PRO.
- [ ] First event wrote payment doc.
- [ ] Replay did not perform second upgrade.
- [ ] Duplicate skip path confirmed in logs.
- [ ] UI shows correct plan after refresh.

### 8.5 Optional API sanity cURL
```bash
curl -sS https://<domain>/api/billing/paypal/webhook
```
Expected contains: `ok: true`, `firebaseReady: true`, `env`.
