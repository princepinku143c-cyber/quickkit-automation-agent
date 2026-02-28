# NexusStream System Audit (A→Z)

## Clean project structure

### 1) Frontend App Layer
- `App.tsx` → main shell, route-state sync, modal orchestration, dashboard/editor switching.
- `components/`:
  - Auth/Billing: `AuthPage`, `PricingModal`, `SettingsModal`, `PaymentStatus`
  - Workspace: `Canvas`, `Sidebar`, `ProjectList`, `PropertiesPanel`
  - Client portal: `components/client/*`, `ClientPortal`

### 2) Business / Service Layer
- `services/paymentGateway.ts` → payment flow helpers (PayPal/Razorpay)
- `services/usageGuard.ts`, `services/cloudStore.ts` → limits, quota, logs, rate limiting
- `services/authService.ts`, `services/userService.ts`, `services/projectService.ts` → auth/profile/project data

### 3) Backend API Layer (Serverless)
- `api/billing/paypal/*` → create/capture/webhook
- `api/billing/verify.ts` → Razorpay signature verification
- `api/paypal/*` → compatibility exports
- `api/test-*` → diagnostics; now gated by `ENABLE_TEST_ENDPOINTS`

### 4) Infra / Config
- `package.json` scripts: `dev`, `build`, `lint`, `preview`
- `vercel.json`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`
- `functions/*` workers for async/background tasks

### 5) Domain Models / Constants
- `types.ts`, `constants.ts`, `data/blueprints.ts`

## Actionable bug board (current)

| ID | Severity | Area | File | Exact fix | ETA |
|---|---|---|---|---|---|
| NS-001 | P0 | Quota | `services/cloudStore.ts` | Fail closed on quota/rate limit transaction errors | Done |
| NS-002 | P0 | Payments | `api/billing/paypal/webhook.ts` | Disallow signature skip outside strict dev override | Done |
| NS-003 | P1 | Billing UX | `components/SettingsModal.tsx` | Disable non-implemented refund/cancel/add-on paths | Done |
| NS-004 | P1 | Routing | `App.tsx` | Add popstate parity for `/billing` and `/settings` | Done |
| NS-005 | P1 | Portal Auth | `components/ClientPortal.tsx` | Remove dead auth state and use real authenticated uid | Done |
| NS-006 | P2 | Public forms | `components/PublicFormView.tsx` | Restrict localStorage loading to local preview only | Done |
| NS-007 | P2 | Test API exposure | `api/test-db.ts`, `api/test-email.ts` | Add `ENABLE_TEST_ENDPOINTS` gate | Done |
| NS-008 | P2 | Observability | `api/billing/paypal/*.ts` | Add `x-correlation-id` request/response propagation and logs | Done |

## Next 7-step owner plan
1. Security hardening sprint (P0 first)
2. Billing UX cleanup
3. Route formalization with `/app/*`
4. API-backed public form publish model
5. Test endpoint lockdown + deploy checks
6. Observability + correlation IDs + runbook
7. Regression pack (auth/billing/webhook/quota/routes)
