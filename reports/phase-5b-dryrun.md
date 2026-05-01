# Phase 5b — Dry Run Report

**Run:** dry-run-1
**Date:** 2026-04-30
**Time:** T+___h
**Operator:** 0xjaadu (manual MetaMask)
**Recording:** `submission/assets/dry-run-1.mp4`

---

## Pre-Record Checklist

- [ ] Employer MetaMask account `0x31f4...9198` has ≥0.005 ETH
- [ ] Run `node scripts/pre-record-check.mjs` from `code/frontend/` — verify Gateway latency <30s
- [ ] Log PRE_RECORD_LATENCY to `state/DECISIONS.md` (script does this automatically)
- [ ] 2 employee addresses added to PayrollManager via `addEmployee()` (pre-recording setup)
- [ ] No auditors registered yet
- [ ] Employer has 0 mUSDC (will mint fresh)
- [ ] Screen recorder running at 1080p, dark theme
- [ ] Frontend running: `cd code/frontend && npm run dev`

---

## Scene Results

### Scene 1: Wrap (target 0:00–1:00)

| Step | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Mint 10k mUSDC | MetaMask popup → tx confirms | | |
| Approve ConfPayToken | MetaMask popup → tx confirms | | |
| Wrap 1000 mUSDC | MetaMask popup → encrypted balance handle appears | | |
| Transition to Arbiscan | Contract visible on explorer | | |

**MetaMask popups this scene:** 3 expected
**Actual popups:** ___
**Wall-clock time:** ___
**Errors/glitches:** ___

---

### Scene 2: Batch Pay (target 1:00–2:00)

| Step | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Show 2 employees on roster | Pre-added, visible in list | | |
| Enter amounts (500, 300) | Input fields accept values | | |
| Click "Pay All" | Sequential MetaMask popups: 2× confidentialTransfer + 1× recordPayments | | |
| Verify on Arbiscan | ConfidentialTransfer events with bytes32 handles | | |

**MetaMask popups this scene:** 3 expected
**Actual popups:** ___
**Wall-clock time:** ___
**Errors/glitches:** ___

---

### Scene 3: Employee Unwrap (target 2:00–3:00)

| Step | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Switch to Employee wallet | Employee Dashboard shows encrypted balance | | |
| Decrypt Balance | EIP-712 sign → plaintext "500.0" appears | | |
| Click Unwrap | MetaMask popup → "TEE Decrypting (~15s)..." spinner | | |
| publicDecrypt wait | ~10-15s spinner, voiceover opportunity | | |
| Finalize | MetaMask popup → ERC-20 balance updates to 500 | | |

**MetaMask popups this scene:** 2 expected (unwrap + finalizeUnwrap)
**Actual popups:** ___
**publicDecrypt latency:** ___s
**Wall-clock time:** ___
**Errors/glitches:** ___

---

### Scene 4: Auditor Disclosure (target 3:00–3:50)

| Step | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Switch to Employer wallet | Employer Dashboard loads | | |
| Enter auditor address | Address field accepts input | | |
| Click "Grant Access" | MetaMask: 1× grantAuditorAccess + 2× NoxCompute.allow | | |
| Switch to Auditor wallet | Auditor Dashboard shows "Authorized" + 2 payment records | | |
| Decrypt payment #1 | EIP-712 sign → "500.0 mUSDC" | | |
| Decrypt payment #2 | EIP-712 sign → "300.0 mUSDC" | | |

**MetaMask popups this scene:** 3 expected
**Actual popups:** ___
**Wall-clock time:** ___
**Errors/glitches:** ___

---

## Summary

| Metric | Value |
|--------|-------|
| **Total wall-clock time** | ___ |
| **Total MetaMask popups** | ___ / 11 expected |
| **Scenes passed** | ___ / 4 |
| **Console errors visible** | ___ |
| **Visual glitches** | ___ |
| **publicDecrypt latency** | ___s |

### Verdict
- [ ] **PASS** — All scenes clean, proceed to recording
- [ ] **FAIL** — Bug list below, fix and re-dry-run

### Bug List (if any)
1. 
2. 
3. 

### Dry Run Attempt Counter
- **Attempt 1:** this report
- **Hard cap:** 3 attempts. Escalate on 4th.
