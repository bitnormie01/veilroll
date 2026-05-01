# Blockers (live — clear when resolved)

### BLOCKER-001: Foundry Guide "Coming Soon" → RESOLVED
- **Discovered:** T+0h (Recon)
- **Impact:** No official Foundry remappings or testing guide for @iexec-nox packages
- **Resolution:** Switched to Hardhat per 0xjaadu AMEND directive. iExec npm packages designed for Hardhat. Cost: ~30min to switch scaffold (absorbed into Phase 1 time cap).
- **Status:** RESOLVED (2026-04-29T11:54Z)

### BLOCKER-002: Testing encrypted types locally → CONFIRMED
- **Discovered:** T+0h (Recon)  
- **Impact:** `Nox.fromExternal()` requires Handle Gateway. Local mocks do not exist.
- **Resolution:** All encrypted logic tested via deploy scripts on Arbitrum Sepolia. Local Hardhat unit tests limited to non-encrypted logic paths.
- **Status:** RESOLVED — confirmed in Phase 1 (Nox.toEuint256 reverts on local Hardhat)

### BLOCKER-003: Nox ACL revocation — PARTIALLY RESOLVED
- **Discovered:** T+0h (Architect, during differentiator design)
- **Impact:** `Nox.allow()` exists but no `Nox.revoke()`. Once ACL is granted, it cannot be retroactively removed.
- **Resolution:** Documented as known limitation. `revokeAuditorAccess()` removes auditor from roster (no future grants), but previously-granted handles remain accessible. This is stated in docs and demo voiceover.
- **Status:** RESOLVED — documented limitation, accepted by 0xjaadu at Phase 3 GO

### BLOCKER-004: Nox ACL msg.sender mismatch → RESOLVED (Architecture change)
- **Discovered:** T+15.4h (Phase 5a First Light)
- **Impact:** `validateInputProof` checks `msg.sender` against proof's `applicationContract`. Cross-contract PayrollManager→ConfPayToken call chain caused irreconcilable proof mismatches ("App mismatch", "Owner mismatch").
- **Resolution:** ARCH-CHANGE-001/002/003 — employer calls ConfPayToken.confidentialTransfer directly. PayrollManager redefined as bookkeeping + auditor registry. See DECISIONS.md.
- **Status:** RESOLVED (T+15.6h)

### USER-ACTION-001: Sepolia ETH refill required
- **Discovered:** T+17.1h (2026-04-30T06:08Z)
- **Impact:** Deployer wallet `0x31f4a2E4b4dF8c46c466076cbf56fb1037899198` has <0.0003 ETH remaining. Phase 5b dry run requires gas for ~11+ txs.
- **Owner:** 0xjaadu (manual faucet)
- **Status:** ⏳ ACTIVE — 5b execution blocked until balance confirmed
- **Estimated need:** ≥0.005 ETH for full dry-run + recording buffer
