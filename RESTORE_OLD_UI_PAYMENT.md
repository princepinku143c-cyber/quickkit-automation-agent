# Restore Old Frontend + Payment Code (Razorpay/PayPal Compatible)

If your current UI/payment feels broken and you want the older working setup, run:

```bash
bash scripts/restore-old-ui-payment.sh
```

By default it restores from commit `d01557a` (stable point before later hardening/docs churn).

## What it restores
- `App.tsx`
- `components/Sidebar.tsx`
- `api/billing/paypal/createOrder.ts`
- `api/billing/paypal/webhook.ts`
- `api/paypal/createOrder.ts`
- `api/paypal/webhook.ts`

> Razorpay files were not changed in the hardening sequence after this baseline, so they are already compatible with this restore point.

## Optional: restore from a different commit
```bash
RESTORE_COMMIT=<commit_hash> bash scripts/restore-old-ui-payment.sh
```

## After restore (must run)
```bash
npm run -s build
npx tsc --noEmit
```

## Verify locally
```bash
git diff -- App.tsx components/Sidebar.tsx api/billing/paypal/createOrder.ts api/billing/paypal/webhook.ts
```
