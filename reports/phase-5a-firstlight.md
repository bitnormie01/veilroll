# Phase 5a — First Light Verification

**Started:** 2026-04-30T04:22Z (T+15.4h of 48h, ~32%)
**Time cap:** 60 min
**Rule:** Halt on first failure. No silent patching.
**Contracts:** Arbitrum Sepolia (421614)
**Architecture:** Employer → ConfPayToken.confidentialTransfer (direct) → PayrollManager.recordPayments (bookkeeping)

| Contract | Address |
|---|---|
| MockERC20 | `0x155b9eee80e9f89f0594953bb9B9554d8b653a00` |
| ConfPayToken | `0x08A1ABF57C949Db12848bE205498f492e9b5BBa6` |
| PayrollManager | `0xe3A2240060e1f52D84d8acE41dBb908aF53B3825` |

**Test Wallets:**
- Employer (deployer): `0x31f4a2E4b4dF8c46c466076cbf56fb1037899198`
- Employee: fresh random wallet (funded from employer)
- Auditor: fresh random wallet (funded from employer)

---

## Path 1: Employer Batch Pay (encrypt → transfer → record → event)
**Status:** ✅ PASS
**Transfer Tx Hash:** `0x6d5bb211a3f3119fe5fa5ea2fe264261c4f0fb94a84877670f618353210e78d6`
**Gas Used:** 302115 gas
**Encrypted Handle Bytes:** `0x0000066eee23019418afdcdc3524bc3b16df0fbad7bbec5b37b9d3000a052039`
**Event Log:** ConfidentialTransfer emitted. Handle: `0x0000066eee2301f89c3c448f3ba5321a45ab38fb75e64277c454bde010fdc960`
**Outcome:** Transfer mined, event emitted, handle stored in PayrollManager.

---

## Path 2: Employee Decrypt Balance (decrypt + EIP-712)
**Status:** ✅ PASS
**Plaintext Expected:** 500.0 mUSDC
**Plaintext Received:** 500.0 mUSDC (500000000000000000000 wei)
**Outcome:** Plaintext matches.

---

## Path 3: Auditor Selective Disclosure
### 3a: Pre-grant decrypt → MUST FAIL
**Status:** ✅ PASS
**Error Captured:** `Handle (0x0000066eee23018a69f49a24754d357774c9b1955f809959be0a2a5e5acf190b) does not exist or user (0x2EFeEd75490271d019AdD207aDf977D92d0eE354) is not authorized to decrypt it`
**Outcome:** Correctly failed.

### 3b: Grant auditor access tx
**Status:** ✅ PASS
**Tx Hash:** `0x3186bd64e9d19df65da666a0bc5647b885e89c2a007bc48aafe97b18912939b3`
**Outcome:** Auditor registered + ACL granted on payment handle.

### 3c: Post-grant decrypt → MUST SUCCEED
**Status:** ✅ PASS
**Plaintext Received:** 500.0 mUSDC
**Outcome:** Auditor decrypted payment handle successfully.

---

## Path 4: Two-Step Unwrap
**Status:** ✅ PASS
### Step 1: unwrap() tx
**Tx Hash:** `0x78140a66aea593fcf4f27892f266dea5c1cc14b0f12b900d4868cb3734803868`
**unwrapRequestId:** `0x0000066eee2301769d3bb5df44a2df7e6872b36603640a6e45578a0000c0e361`

### Step 2: publicDecrypt()
**Time elapsed:** 0.9s
**⚠️ >2min flag:** No

### Step 3: finalizeUnwrap() tx
**Tx Hash:** `0x731ab74db626199225affebaa1d08883dc5b12aa85e4466fbf714d1b0d1981e9`
**ERC-20 balance before:** 0.0 mUSDC
**ERC-20 balance after:** 500.0 mUSDC
**Outcome:** ERC-20 balance: 0.0 → 500.0

---

## Reviewer Rerun
**Status:** ⏳ PENDING — blocked on independent wallet provisioning
