# S1 External Replay Verification Evidence Template

Use this template to submit proof after running the replay flow.

## Run metadata
- Date/Time:
- Environment: sandbox/live
- Domain:
- Target uid:
- Event ID:
- Payment ID:

## Baseline
- users/<uid>.tier (before):
- users/<uid>.lastPaymentId (before):

## First delivery result
- PayPal delivery status:
- Webhook API response:
- Vercel log snippet:
- users/<uid>.tier (after first delivery):
- payments/<paymentId>.status:

## Replay delivery result
- Replay delivery status:
- Replay API response (`duplicate: true` expected):
- Duplicate-skip log snippet:
- users/<uid>.lastPaymentId (after replay):

## Final checklist
- [ ] First event upgraded to PRO.
- [ ] First event wrote payment doc.
- [ ] Replay did not perform second upgrade.
- [ ] Duplicate skip path confirmed in logs.
- [ ] UI shows correct plan after refresh.

## Attachments
- PayPal delivery screenshot:
- Vercel log screenshot:
- Firestore doc screenshot: