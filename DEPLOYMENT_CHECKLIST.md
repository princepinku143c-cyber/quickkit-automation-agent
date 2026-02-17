# NexusStream Deployment & Payment Readiness Checklist

## 1) Firebase Console
- Enable Google provider in **Authentication > Sign-in method**.
- Add production domain in **Authentication > Settings > Authorized domains**.
- Deploy Firestore rules from `firestore.rules`.
- Ensure collections exist: `users`, `projects`, `payments`, `coupons`.

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

## 3) PayPal Dashboard
- Webhook URL: `https://<domain>/api/billing/paypal/webhook`
- Events:
  - `PAYMENT.CAPTURE.COMPLETED`
  - `BILLING.SUBSCRIPTION.ACTIVATED`

## 4) Smoke Tests
1. Build: `npm run build`
2. Type-check: `npx tsc --noEmit` (known existing `functions/*` typing debt)
3. PayPal create order should return `approvalUrl`.
4. Webhook test should write:
   - user plan upgrade fields
   - payment log document

## 5) Expected Behavior
- Logout resets local plan state to `FREE`.
- PayPal duplicate webhook should not double-process successful payment.
- In production, test routes require `x-test-secret`.
