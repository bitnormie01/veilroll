# Use Case Pick: Confidential Payroll / Donations (ERC-7984 only)

## Decision

**Pick:** Confidential Payroll — a privacy-preserving batch payment system using ERC-7984 confidential tokens on Arbitrum Sepolia.

## Justification

| Criterion | Confidential Vault (ERC-7540+7984) | Private Lending (ERC-7984) | **Confidential Payroll (ERC-7984)** | Private Stocks (ERC-3643+7984) |
|---|---|---|---|---|
| ERC standards to implement | 2 (7984 + 7540) | 1 (7984) | **1 (7984)** | 2 (3643 + 7984) |
| Full ERC compliance risk | HIGH — ERC-7540 is complex async vault | MEDIUM — lending logic on encrypted types | **LOW — only ERC-7984** | EXTREME — ERC-3643 is massive |
| 48h feasibility | Risky | Feasible | **Safest** | Not feasible |
| Judge appeal | Strong narrative | Medium | **Strong — everyone understands payroll privacy** | Strong but won't ship |
| Nox integration depth | High | Medium | **Medium-High** | High |

### Why NOT the others:
- **Confidential Vault (ERC-7540):** Full ERC-7540 compliance requires async deposit/redeem with share accounting on encrypted types. The 2-step unwrap pattern alone adds complexity. Combined with ERC-7984, this is 28+ build hours with high ERC compliance risk. One partial function = disqualification.
- **Private Lending:** Needs collateral ratio checks on encrypted types (`Nox.gt()`, `Nox.select()`). Interest accrual on encrypted balances is untested territory. Scope creep risk is extreme.
- **Private Stocks (ERC-3643):** ERC-3643 (T-REX) has 10+ contracts (Identity Registry, Compliance, Claims, etc.). Full compliance in 48h is impossible.

### Why Confidential Payroll:
1. **Single ERC standard** — only ERC-7984. Full compliance is achievable.
2. **Clear real-world narrative** — "Companies pay employees without anyone seeing individual salaries on-chain"
3. **Demonstrates all core Nox primitives** — wrap, confidential transfer, decrypt, ACL management, receiver callbacks
4. **Frontend is straightforward** — employer dashboard, employee view, tx history
5. **End-to-end is provable** — deploy wrapper, wrap tokens, batch transfer, employee decrypts balance
6. **ChainGPT integration** — use for contract audit report (setup-time artifact, not runtime)

## Differentiator: Selective Auditor Disclosure

**The one thing that makes this non-generic:** The employer can grant an external auditor wallet read-only access to employee payment handles via Nox ACL. The auditor decrypts individual salary amounts to verify compliance — without employees publicly revealing their salaries, and without the employer emailing a CSV.

**Why this, not the other options:**
- **(a) Selective auditor disclosure ← PICKED.** Uses Nox's core ACL primitives (`Nox.allow()`, `decrypt()`). Adds 2 contract functions + 1 frontend page. Judge-visible in demo (Scene 4). Estimated cost: +2h.
- (b) Hidden total payroll with per-recipient verification — interesting but requires `publicDecrypt()` on individual handles, which may conflict with privacy guarantees. Conceptually muddled.
- (c) Compliance export endpoint — just a JSON download. Not on-chain enough to impress judges.

**Contract additions:**
- `PayrollManager.grantAuditorAccess(address auditor)` — iterates stored payment handles, calls `Nox.allow(handle, auditor)` for each
- `PayrollManager.revokeAuditorAccess(address auditor)` — stops granting on new payments (ACL revocation may not be supported — documented as limitation)
- `PayrollManager.getAuditors()` — view function

**Frontend additions:**
- Employer dashboard: "Auditor Management" panel (add/remove)
- `/auditor` page: read-only view, decrypt button per employee, shows plaintext salary amount

## Estimated Build Hours

| Component | Hours |
|---|---|
| ERC-7984 token + wrapper contracts | 4 |
| Payroll manager contract | 4 |
| Deploy + test on Arbitrum Sepolia | 4 |
| Frontend (employer + employee views) | 4 |
| E2E integration + polish | 4 |
| Submission packaging | 6 |
| **Total** | **26** |
| **Available** | **40** |
| **Buffer** | **14 (35%)** |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Local testing impossible for Nox types | HIGH | HIGH | Test directly on Arbitrum Sepolia fork. Skip unit tests for encrypted logic, rely on integration tests. |
| Foundry toolchain incompatible | MEDIUM | HIGH | Use Hardhat instead. npm packages designed for Hardhat. |
| Handle Gateway downtime | LOW | CRITICAL | No mitigation — external dependency. Monitor. |
| 2-step unwrap UX confusion | MEDIUM | MEDIUM | Clear UI states: "Pending decryption…" → "Ready to finalize" |
| Gas costs exceed testnet budget | LOW | MEDIUM | Use iExec faucet at cdefi.iex.ec |
