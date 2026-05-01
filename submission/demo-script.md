# Demo Script — ConfPay: Confidential Payroll on Arbitrum

**Total runtime:** ≤2:00 (target: 1:55)
**Format:** Screen recording with voiceover narration + post-editing (speed-ups/jump-cuts marked below)
**Demo config:** 2 employees (500 + 300 mUSDC), 1 auditor — locked in `deployments/arbitrum-sepolia.json::demoConfig`
**Architecture:** Employer calls ConfPayToken.confidentialTransfer directly, then PayrollManager.recordPayments for bookkeeping. Frontend bundles via "Pay All" button.

---

## Hook (0:00–0:10)

### On-screen:
Dark screen with text overlay: **"Salary payments on the blockchain are public by default."** Then fade to Arbiscan showing a regular ERC-20 transfer with a visible amount.

### Voiceover (22 words):
*"On-chain payroll has a problem — salary amounts are public. Anyone can see what you earn. ConfPay encrypts them."*

### Editing notes:
No MetaMask. Voiceover over static visuals. Pre-capture the Arbiscan screenshot before recording.

---

## Scene 1+2: Wrap + Batch Pay (0:10–0:40)

### On-screen action:
1. **0:10–0:14** — ConfPay Employer Dashboard, wallet connected. Click "Mint 10k mUSDC". **[JUMP_CUT to minted state]**
2. **0:14–0:20** — Enter `1000` in wrap field. Click "Approve & Wrap". Show MetaMask confirm for wrap tx. Encrypted balance handle appears on-screen. Voiceover names the privacy moment.
3. **0:20–0:26** — Employee roster shows 2 employees (pre-added). Enter `500` and `300`. Click "Pay All". First MetaMask popup: confidentialTransfer to Employee A — **SHOW_REAL**.
4. **0:26–0:30** — Second confidentialTransfer to Employee B — **SPEED_4X**.
5. **0:30–0:35** — recordPayments tx — **JUMP_CUT to confirmed**.
6. **0:35–0:40** — Quick flash of Arbiscan showing ConfidentialTransfer events with bytes32 handles.

### Voiceover (62 words):
*"The employer wraps ERC-20 tokens into confidential tokens using iExec's ERC-7984 standard. Watch — the balance becomes an opaque handle, unreadable on-chain."*

*"Now, batch payment. Two employees, different salaries. Each amount is encrypted by the Nox SDK before transfer. On Arbiscan, you can see the transfers happened — but every amount is a bytes32 handle. No observer can read them."*

### Privacy moment:
Individual salary amounts are encrypted end-to-end. Transfer events emit bytes32 handles — unreadable without ACL permission. Even the employer's total payout is hidden from public view.

### Editing notes:
- mint tx: JUMP_CUT (cut to minted state, ~0s screen time)
- approve tx: **SKIPPED** (pre-approve MaxUint256 before recording; allowance check auto-skips)
- wrap tx: SHOW_REAL (~5s) — key moment where balance becomes encrypted
- encryptInput sign (emp1): SPEED_4X (~1s) — SDK encryption signature, not a tx
- confidentialTransfer(emp1): SHOW_REAL (~5s) — first encrypted transfer
- encryptInput sign (emp2): JUMP_CUT (~0s)
- confidentialTransfer(emp2): SPEED_4X (~2s)
- recordPayments: JUMP_CUT (~1s)

---

## Scene 3: Employee Decrypt + Unwrap (0:40–1:05)

### On-screen action:
1. **0:40–0:42** — **[JUMP_CUT]** to Employee Dashboard (wallet already switched). Encrypted balance handle visible.
2. **0:42–0:45** — Click "Decrypt Balance". EIP-712 signature popup → plaintext "500.0 mUSDC" appears.
3. **0:45–0:48** — Click "Unwrap to ERC-20". MetaMask confirms unwrap tx.
4. **0:48–1:03** — **SHOW_REAL: 15-second TEE decryption wait.** UI spinner says "TEE Decrypting (~15s)...". Voiceover fills the entire wait — this is a feature, not dead air.
5. **1:03–1:05** — MetaMask confirms finalizeUnwrap. ERC-20 balance updates to `500.0 mUSDC`.

### Voiceover (65 words):
*"Switch to the employee's wallet. The balance is encrypted — only this employee can decrypt it. Five hundred mUSDC, exactly what was paid."*

*"To cash out, unwrap back to ERC-20. The Nox protocol's Intel TDX secure enclaves are decrypting the amount right now... fifteen seconds of real cryptographic work, not a loading screen. Done. Regular tokens, back in the wallet."*

### Privacy moment:
Only the employee can decrypt their own balance — the employer, other employees, and the public never see it. The unwrap reveals the amount only to the protocol's TEE for the ERC-20 transfer.

### Editing notes:
- Wallet switch: JUMP_CUT (hard cut, no transition)
- Decrypt balance: EIP-712 sign (~2s) — show real, it's fast
- unwrap tx: SHOW_REAL (~3s)
- 15s TEE wait: **SHOW_REAL — do not cut, do not speed up.** Voiceover fills the time.
- finalizeUnwrap tx: SHOW_REAL (~2s)

---

## Scene 4: Auditor Disclosure — The Differentiator (1:05–1:35)

### On-screen action:
1. **1:05–1:07** — **[JUMP_CUT]** to Employer Dashboard (wallet switched back).
2. **1:07–1:12** — Enter auditor wallet address. Click "Grant Access". MetaMask shows grantAuditorAccess tx — **SHOW_REAL**.
3. **1:12–1:17** — NoxCompute.allow popups fire for 2 handles — **SPEED_4X** first, **JUMP_CUT** second.
4. **1:17–1:20** — **[JUMP_CUT]** to Auditor Dashboard. "✓ Authorized" badge visible. Two payment records listed.
5. **1:20–1:24** — Click "Decrypt" on Payment #1 → EIP-712 sign → "500.0 mUSDC".
6. **1:24–1:28** — Click "Decrypt" on Payment #2 → EIP-712 sign → "300.0 mUSDC". Both values visible.
7. **1:28–1:35** — Pause on the auditor view showing both decrypted salaries. Voiceover delivers the differentiator line.

### Voiceover (56 words):
*"Here's what makes ConfPay different — selective auditor disclosure. The employer grants an auditor read permission on-chain. The auditor decrypts: five hundred, three hundred. Every salary visible — but only because the employer chose to share. On-chain, verifiable, revocable. No spreadsheets, no trust assumptions."*

### Privacy moment:
The auditor sees salaries only through an explicit on-chain ACL grant from the employer. The permission is transparent and auditable — the auditor didn't hack anything, the employer chose to share.

### Editing notes:
- Wallet switch (employer): JUMP_CUT
- grantAuditorAccess tx: SHOW_REAL (~4s) — core differentiator action
- NoxCompute.allow(h1): SPEED_4X (~2s)
- NoxCompute.allow(h2): JUMP_CUT (~1s)
- Wallet switch (auditor): JUMP_CUT
- Decrypt Payment #1: EIP-712 sign (~2s) — show real
- Decrypt Payment #2: EIP-712 sign (~2s) — show real

---

## Closing (1:35–2:00)

### On-screen:
1. **1:35–1:45** — Text card on dark background:

   > **ConfPay — Confidential Payroll, On-Chain**
   > Three roles. Three access levels. One encrypted protocol.

2. **1:45–1:55** — GitHub repo URL on screen. Text: *"Built with iExec Nox Protocol + ERC-7984 Confidential Tokens. Arbitrum Sepolia."*
3. **1:55–2:00** — Tags overlay: **@iEx_ec  @Chain_GPT**

### Voiceover (17 words):
*"Three roles, three access levels, one confidential protocol. ConfPay — built on iExec Nox and ERC-7984."*

### Editing notes:
No MetaMask. Static visuals with text overlays. Can add subtle background animation.

---

## MetaMask Interaction Plan

> **Legend:** 🔒 = EIP-712 signature (free, no gas) · ✍️ = on-chain transaction

| # | Interaction | Type | Scene | Edit Mode | Screen Time | Reasoning |
|---|------------|------|-------|-----------|-------------|-----------|
| 1 | mint 10k mUSDC | ✍️ tx | 1+2 | **JUMP_CUT** | ~0s | Setup, not interesting |
| 2 | approve (if needed) | ✍️ tx | 1+2 | **SKIPPED** | 0s | Pre-approved MaxUint256 before recording |
| 3 | wrap 1000 mUSDC | ✍️ tx | 1+2 | **SHOW_REAL** | ~5s | Key: balance becomes encrypted |
| 4 | encryptInput (emp1) | 🔒 sign | 1+2 | **SPEED_4X** | ~1s | SDK encryption, not a tx |
| 5 | confidentialTransfer(emp1) | ✍️ tx | 1+2 | **SHOW_REAL** | ~5s | First encrypted transfer |
| 6 | encryptInput (emp2) | 🔒 sign | 1+2 | **JUMP_CUT** | ~0s | Same SDK sign, viewer gets it |
| 7 | confidentialTransfer(emp2) | ✍️ tx | 1+2 | **SPEED_4X** | ~2s | Same action repeated |
| 8 | recordPayments | ✍️ tx | 1+2 | **JUMP_CUT** | ~1s | Bookkeeping, not visual |
| 9 | decrypt balance | 🔒 sign | 3 | **SHOW_REAL** | ~2s | Employee proves ownership |
| 10 | unwrap | ✍️ tx | 3 | **SHOW_REAL** | ~3s | Triggers TEE decryption |
| 11 | finalizeUnwrap | ✍️ tx | 3 | **SHOW_REAL** | ~2s | Completes unwrap |
| 12 | grantAuditorAccess | ✍️ tx | 4 | **SHOW_REAL** | ~4s | Core differentiator |
| 13 | NoxCompute.allow(h1) | ✍️ tx | 4 | **SPEED_4X** | ~2s | Supporting tx |
| 14 | NoxCompute.allow(h2) | ✍️ tx | 4 | **JUMP_CUT** | ~1s | Same action repeated |
| 15 | auditor decrypt #1 | 🔒 sign | 4 | **SHOW_REAL** | ~2s | Proves selective disclosure |
| 16 | auditor decrypt #2 | 🔒 sign | 4 | **SHOW_REAL** | ~2s | Second salary revealed |

**Summary:** 9 on-chain txs + 5 EIP-712 signatures = **14 MetaMask popups** (approve skipped via pre-approval)
- 6× SHOW_REAL, 3× SPEED_4X, 3× JUMP_CUT, 1× SKIPPED, 1× implied by UI

---

## Timing Analysis

### Voiceover Word Count

| Section | Words | Duration at 3w/s |
|---------|-------|-------------------|
| Hook | 22 | 7.3s |
| Scene 1+2 | 62 | 20.7s |
| Scene 3 | 65 | 21.7s |
| Scene 4 | 56 | 18.7s |
| Close | 17 | 5.7s |
| **Total** | **222** | **74.0s** |

Voiceover fills 74s of 120s (62%). Remaining 46s is visual beats — healthy ratio.

### Raw vs Edited Duration

| Section | Raw Flow | Edited | Savings |
|---------|----------|--------|---------|
| Hook | 10s | 10s | 0s (no editing needed) |
| Scene 1+2 | 78s | 30s | 48s (JUMP_CUT mint/approve/record, SPEED_4X emp2) |
| Scene 3 | 36s | 25s | 11s (JUMP_CUT wallet switch) |
| Scene 4 | 49s | 30s | 19s (SPEED_4X/JUMP_CUT allow txs, JUMP_CUT switches) |
| Close | 25s | 25s | 0s |
| **Total** | **198s (3:18)** | **120s (2:00)** | **78s saved** |

**Edit ratio: 1.65×** — achievable with standard video editing (jump-cuts + speed-ups). No scenes require extreme compression.

### Privacy Moments Preserved

| Scene | Privacy Moment | Preserved? |
|-------|---------------|------------|
| 1+2 | Salary amounts encrypted as bytes32 handles | ✅ Full |
| 3 | Only employee can decrypt own balance | ✅ Full |
| 4 | Auditor access via explicit on-chain grant | ✅ Full (differentiator) |

**No privacy moments were cut.** All three are explicitly named in voiceover.

---

## Pre-Recording Checklist

- [ ] Employer MetaMask has ≥0.005 ETH
- [ ] 2 employees pre-added to PayrollManager roster (not timed)
- [ ] No auditors registered (grant happens in Scene 4)
- [ ] Employer has 0 mUSDC (mints fresh in Scene 1)
- [ ] Run `node scripts/pre-record-check.mjs` — Gateway latency < 30s
- [ ] Screen recorder at 1080p, dark theme
- [ ] Have Arbiscan open in second tab for Scene 1+2 transition
- [ ] Pre-capture a regular ERC-20 transfer screenshot for Hook

## Post-Recording Editing Checklist

- [ ] Apply JUMP_CUTs (4 txs) — remove waiting footage
- [ ] Apply SPEED_4X (2 txs) — accelerate confirmation animations
- [ ] Add text overlay for Hook ("Salary payments on the blockchain are public")
- [ ] Add closing card with repo URL + @iEx_ec @Chain_GPT tags
- [ ] Verify total ≤ 2:00
- [ ] Export as MP4 1080p → `submission/assets/demo.mp4`
