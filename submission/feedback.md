# Developer Feedback — iExec Nox Protocol & Confidential Tokens

**Project:** ConfPay — Confidential Payroll on Arbitrum Sepolia
**Builder:** 0xjaadu
**Date:** 2026-04-30 (Vibe Coding Challenge)
**Build time:** ~18h across 5 phases, Hardhat toolchain, React+Vite frontend

---

## Executive Summary

We built a confidential payroll DApp using ERC-7984 Confidential Tokens (Nox protocol) on Arbitrum Sepolia. The project exercises the full lifecycle: ERC-20 → confidential wrap → encrypted transfer → employee decrypt → auditor selective disclosure → unwrap back to ERC-20. This feedback covers genuine friction, documentation gaps, and things that worked well — all sourced from real build decisions, not hypothetical.

---

## 🟢 What Worked Well

### 1. `@iexec-nox/handle` SDK — Clean DX
The JS SDK (`createEthersHandleClient`) is genuinely well-designed. `encryptInput()`, `decrypt()`, and `publicDecrypt()` have minimal boilerplate and compose naturally with ethers.js v6. The EIP-712 signature flow for decrypt is invisible to the developer — the SDK handles it. For a protocol with this much cryptographic complexity under the hood, the surface API is impressively simple.

### 2. `ERC20ToERC7984Wrapper` — One-Line Token Creation
The wrapper base contract is the right abstraction. Our entire `ConfPayToken.sol` is 15 lines of code. `wrap()` and `unwrap()` work correctly out of the box. The two-step unwrap pattern (`unwrap` → `publicDecrypt` → `finalizeUnwrap`) is well-documented and the events are clean.

### 3. EIP-7984 Spec — Well-Structured Standard
The spec cleanly separates concerns: `bytes32` handles are technology-agnostic, the operator model replaces ERC-20 allowances elegantly, and the callback pattern (`IERC7984Receiver`) follows ERC-1363 conventions. Developers familiar with ERC-20/721 will find the mental model transferable.

### 4. Arbiscan Integration
Confidential transfer events are visible on Arbiscan with `bytes32` amount handles. This is important for demos and debugging — you can prove a transfer happened without revealing the amount. The "privacy is visible" narrative writes itself.

---

## 🟡 Friction Points (Medium — Solvable)

### 5. Foundry Guide: "Coming Soon" (BLOCKER-001, T+0h)
The Foundry integration page at `docs.nox.iex.ec` says "Coming Soon, this guide is under active development." We switched to Hardhat at T+0h to avoid this risk. For a hackathon, this is fine — Hardhat works. But Foundry is the dominant smart contract toolchain in 2026, and its absence signals "not ready for production teams." **Recommendation:** Publish a minimal `foundry.toml` remapping snippet for the three `@iexec-nox` packages. Even a 5-line config file in each npm package would unblock builders.

### 6. ACL Model: `msg.sender` Chain Breaks Cross-Contract Calls (BLOCKER-004, T+15h)
This was our largest friction point. `Nox.fromExternal()` validates the input proof against `msg.sender` as the `applicationContract`. In a cross-contract call chain (Employer EOA → PayrollManager → ConfPayToken → NoxCompute), `msg.sender` at the NoxCompute level is ConfPayToken, but the proof was generated for either PayrollManager or ConfPayToken — causing "App mismatch" or "Owner mismatch" errors.

**What happened:** We spent 3+ hours debugging three different architectures before discovering that the employer must call ConfPayToken.confidentialTransfer *directly* — any intermediary contract breaks the proof validation chain.

**Impact:** Any DApp that wants a "manager" or "router" contract to orchestrate confidential transfers on behalf of users cannot use the current proof model. This limits composability significantly.

**Recommendation:** Document the `msg.sender` constraint explicitly in the "Building a Confidential DApp" guide. A single sentence — *"The wallet that encrypts the input must be the direct external caller of the contract that calls `Nox.fromExternal()`"* — would have saved us 3 hours.

### 7. ACL Revocation: No `Nox.revoke()` (BLOCKER-003, T+0h)
`Nox.allow()` grants permanent ACL on a handle. There is no `Nox.revoke()` or `Nox.disallow()`. Once an auditor has decrypt access to a payment handle, it cannot be retroactively removed. We documented this as a known limitation and worked around it (new payments after "revocation" simply don't grant access), but for real-world compliance use cases (GDPR right-to-erasure, auditor rotation), this is a gap.

**Recommendation:** Add `Nox.disallow(handle, account)` to the ACL system, or document the design rationale for permanent-only grants.

### 8. No Local Testing Path for Encrypted Operations (BLOCKER-002, T+0h)
`Nox.toEuint256()`, `Nox.fromExternal()`, and all encrypted arithmetic revert on a local Hardhat network because they depend on the NoxCompute precompile at a fixed address. There's no mock or local mode. All encrypted logic must be tested against Arbitrum Sepolia.

**Impact:** Iteration speed drops from sub-second (local Hardhat) to ~5s per tx (Sepolia RPC). For a hackathon this is tolerable; for production development it's painful.

**Recommendation:** Ship a `MockNoxCompute` contract that can be deployed to local Hardhat for unit tests. Even a stub that accepts any proof and returns deterministic handles would dramatically improve DX.

### 9. `publicDecrypt` Latency Variance (Flag 3, T+17h)
We measured `publicDecrypt()` latency across 4 samples: 0.9s (warm Gateway), 13.3s, 15.3s, 15.9s (cold Gateway). The ~15s cold-start is caused by the Handle Gateway needing to process the `allowPublicDecryption` event before the handle becomes decryptable.

**Impact:** UX design must account for 10-15s waits during unwrap. Not a dealbreaker, but the variance (0.9s to 15.9s = 17x range) makes it hard to set user expectations.

**Recommendation:** Expose a "readiness" endpoint or event so the frontend can show deterministic progress. Currently we poll `publicDecrypt()` and catch the "does not exist or is not publicly decryptable" error — error-driven polling is brittle.

---

## 🔴 Pain Points (High — Require Design Changes)

### 10. NoxCompute Address Not In Docs
The NoxCompute contract address on Arbitrum Sepolia (`0xd464B198f06756a1d00be223634b85E0a731c229`) is hardcoded in `Nox.sol` but not documented anywhere. We had to read the Solidity source to find it. For builders who need to call `NoxCompute.allow()` directly (our auditor disclosure flow), this is a blocker until you grep the source.

**Recommendation:** Add a "Deployed Addresses" page to docs.nox.iex.ec listing all infrastructure contracts per network.

### 11. Error Messages Are Opaque
When `validateInputProof` fails, the error is a custom error selector (`0x3fcc3f17` = `SenderCannotAllow`) with no human-readable context. We had to reverse-engineer the error from bytecode. Other errors like `NotAllowed(bytes32, address)` don't tell you *why* the handle isn't allowed — is it a wrong sender? Wrong contract? Expired transient?

**Recommendation:** Add descriptive revert strings or NatSpec to the common error paths. At minimum, the proof validation function should log which specific check failed (signer vs. application vs. type mismatch).

---

## 📊 By The Numbers

| Metric | Value |
|---|---|
| Total build time | ~18h |
| Time lost to ACL debugging | 3h (~17% of build) |
| Contract LOC (custom) | ~280 (PayrollManager) + 15 (ConfPayToken) |
| Deployments (Arbitrum Sepolia) | 5 (3 PayrollManager versions, 1 MockERC20, 1 ConfPayToken) |
| Gas per confidentialTransfer | ~302,000 |
| publicDecrypt latency (cold) | 13–16s |
| publicDecrypt latency (warm) | <1s |
| MetaMask confirmations per full demo | ~11 |

---

## 💡 Feature Requests (If Building This Again)

1. **Batch confidentialTransfer** — `confidentialTransfer(address[] to, bytes32[] amounts, bytes[] proofs)`. Currently requires N separate txs for N recipients, each with its own MetaMask confirmation. Gas and UX overhead scales linearly.

2. **Handle metadata query** — Given a handle, return its type (`euint256`/`ebool`), creation block, and ACL list. Currently opaque from the frontend.

3. **Delegated proof signing** — Allow a smart contract to sign input proofs on behalf of a user via EIP-1271. This would unblock contract-mediated transfers without the `msg.sender` chain problem.

4. **`isAllowed(handle, account)` view function** — Exists in NoxCompute but not exposed via the SDK. Useful for pre-flight checks before attempting decrypt.

---

*This feedback is based on a real 18-hour build, not theoretical analysis. Every friction point has a corresponding entry in our DECISIONS.md or BLOCKERS.md with timestamps. We believe Nox has genuine product-market fit for confidential DeFi — the DX just needs polish to match the protocol quality.*
