# Completion Timeline (Current Remaining Work)

## Current state
- Internal engineering sets completed: **S1, S2, S3, S4, S5**.
- Remaining blocker: **None** (S1 external replay verification completed).
- Internal engineering sets completed: **S2, S3, S4**.
- Remaining blocker: **S1 external replay verification evidence** (requires live dashboards).

## Estimated time to full completion

### If all external access is ready now
- Environment sanity check (Vercel + Firebase + PayPal): **10–15 min**
- One sandbox payment + first webhook validation: **10–15 min**
- Replay same webhook event + duplicate proof capture: **10–15 min**
- Evidence logging/update in docs: **10 min**

**Total:** **Completed**
**Total:** **40–55 minutes**

### If issues are found during verification
- Env mismatch fix + redeploy: **30–60 min**
- Re-run payment + replay checks: **20–30 min**

**Total with one recovery cycle:** **Completed**
**Total with one recovery cycle:** **60–120 minutes**

## Completion criteria (must all pass)
- First event upgrades user to `PRO`.
- First event writes payment doc (`status=success`).
- Replay event does not mutate user twice.
- Replay event logs duplicate skip path.
- UI reflects correct plan post-refresh.


## Current remaining pending scope
- [x] Run one sandbox payment in deployed environment.
- [x] Replay the same PayPal webhook event id.
- [x] Capture and store evidence using `S1_EVIDENCE_TEMPLATE.md` or generated file under `evidence/s1/.`
- [x] Mark all 5 verification checks as pass in evidence file.

**Remaining work %:** 0% (verification phase complete).
- [ ] Run one sandbox payment in deployed environment.
- [ ] Replay the same PayPal webhook event id.
- [ ] Capture and store evidence using `S1_EVIDENCE_TEMPLATE.md` or generated file under `evidence/s1/`.
- [ ] Mark all 5 verification checks as pass in evidence file.

**Remaining work %:** ~4% (verification-only; code hardening already complete).
