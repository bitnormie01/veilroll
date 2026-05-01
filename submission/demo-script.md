# Demo Script — Veilroll: Confidential Payroll on Arbitrum

**Total runtime:** ≤3:00 (target: 2:55)
**Format:** Screen recording with voiceover narration + post-editing (speed-ups/jump-cuts marked below)
**Demo config:** 2 employees (500 + 300 mUSDC), 1 auditor — locked in `deployments/arbitrum-sepolia.json::demoConfig`
**Architecture:** Employer calls ConfPayToken.confidentialTransfer directly, then PayrollManager.recordPayments for bookkeeping. Frontend bundles via "Pay All" button.

---

## Hook (0:00–0:20)

### On-screen:
Dark screen with text overlay: **"Salary payments on the blockchain are public by default."** Then fade to Arbiscan showing a regular ERC-20 transfer with a visible amount, followed by a transition to the Veilroll landing page.

### Voiceover (45 words):
*"On-chain payroll has a massive privacy problem — salary amounts are entirely public. Anyone with a block explorer can see exactly what you earn and what your company spends. Veilroll solves this by wrapping standard tokens into encrypted handles. Let's look at how it works."*

### Editing notes:
No MetaMask. Voiceover over static visuals and smooth panning. Pre-capture the Arbiscan screenshot before recording.

---

## Scene 1+2: Wrap + Batch Pay (0:20–1:00)

### On-screen action:
1. **0:20–0:25** — Veilroll Employer Dashboard, wallet connected. Click "Mint 10k mUSDC". **[SHOW_REAL]**
2. **0:25–0:35** — Enter `1000` in wrap field. Click "Approve & Wrap". Show MetaMask confirm for wrap tx. Encrypted balance handle appears on-screen. Voiceover names the privacy moment.
3. **0:35–0:48** — Employee roster shows 2 employees (pre-added). Enter `500` and `300`. Click "Pay All". First MetaMask popup: confidentialTransfer to Employee A — **SHOW_REAL**.
4. **0:48–0:52** — Second confidentialTransfer to Employee B — **SPEED_4X**.
5. **0:52–0:56** — recordPayments tx — **SHOW_REAL**.
6. **0:56–1:00** — Quick flash of Arbiscan showing ConfidentialTransfer events with bytes32 handles.

### Voiceover (85 words):
*"As the employer, you start by wrapping regular ERC-20 tokens into confidential tokens using iExec's ERC-7984 standard. Watch closely — the balance instantly becomes an opaque handle, completely unreadable on-chain."*

*"Now, let's run batch payroll. We have two employees with different salaries. Each amount is encrypted by the Nox SDK right in the browser before transfer. On Arbiscan, you can verify the transfers happened — but every amount is just a bytes32 handle. No observer, competitor, or co-worker can read them."*

### Privacy moment:
Individual salary amounts are encrypted end-to-end. Transfer events emit bytes32 handles — unreadable without ACL permission. Even the employer's total payout is hidden from public view.

### Editing notes:
- mint tx: SHOW_REAL (~5s)
- approve tx: **SKIPPED** (pre-approve MaxUint256 before recording; allowance check auto-skips)
- wrap tx: SHOW_REAL (~10s) — let the user read the screen
- encryptInput sign (emp1): SHOW_REAL (~2s) — SDK encryption signature
- confidentialTransfer(emp1): SHOW_REAL (~5s) — first encrypted transfer
- encryptInput sign (emp2): SPEED_4X (~1s)
- confidentialTransfer(emp2): SPEED_4X (~2s)
- recordPayments: SHOW_REAL (~4s)

---

## Scene 3: Employee Decrypt + Unwrap (1:00–1:45)

### On-screen action:
1. **1:00–1:04** — **[JUMP_CUT]** to Employee Dashboard (wallet already switched). Encrypted balance handle visible.
2. **1:04–1:10** — Click "Decrypt Balance". EIP-712 signature popup → plaintext "500.0 mUSDC" appears.
3. **1:10–1:15** — Click "Unwrap to ERC-20". MetaMask confirms unwrap tx.
4. **1:15–1:35** — **SHOW_REAL: 15-second TEE decryption wait.** UI spinner says "TEE Decrypting (~15s)...". Voiceover fills the entire wait — explaining the architecture.
5. **1:35–1:45** — MetaMask confirms finalizeUnwrap. ERC-20 balance updates to `500.0 mUSDC`.

### Voiceover (90 words):
*"Switching over to the employee's wallet. The balance is encrypted — and importantly, only this specific employee can decrypt it. They sign a request, and there it is: five hundred mUSDC, exactly what was paid."*

*"To cash out, they unwrap the confidential tokens back to standard ERC-20. The Nox protocol's Intel TDX secure enclaves are decrypting the amount right now. This is fifteen seconds of real cryptographic hardware work happening off-chain, not just a loading screen. And it's done. Regular tokens, back in the wallet."*

### Privacy moment:
Only the employee can decrypt their own balance — the employer, other employees, and the public never see it. The unwrap reveals the amount only to the protocol's TEE for the ERC-20 transfer.

### Editing notes:
- Wallet switch: JUMP_CUT (hard cut, no transition)
- Decrypt balance: EIP-712 sign (~4s) — show real, let it breathe
- unwrap tx: SHOW_REAL (~5s)
- 15s TEE wait: **SHOW_REAL — do not cut, do not speed up.** Voiceover fills the time.
- finalizeUnwrap tx: SHOW_REAL (~5s)

---

## Scene 4: Auditor Disclosure — The Differentiator (1:45–2:40)

### On-screen action:
1. **1:45–1:48** — **[JUMP_CUT]** to Employer Dashboard (wallet switched back).
2. **1:48–1:55** — Enter auditor wallet address. Click "Grant Access". MetaMask shows grantAuditorAccess tx — **SHOW_REAL**.
3. **1:55–2:02** — NoxCompute.allow popups fire for 2 handles — **SHOW_REAL** for both.
4. **2:02–2:06** — **[JUMP_CUT]** to Auditor Dashboard. "✓ Authorized" badge visible. Two payment records listed.
5. **2:06–2:15** — Click "Decrypt" on Payment #1 → EIP-712 sign → "500.0 mUSDC".
6. **2:15–2:24** — Click "Decrypt" on Payment #2 → EIP-712 sign → "300.0 mUSDC". Both values visible.
7. **2:24–2:40** — Pause on the auditor view showing both decrypted salaries. Voiceover delivers the differentiator line slowly.

### Voiceover (95 words):
*"Here is what makes Veilroll completely different: selective auditor disclosure. Let's say a compliance officer needs to verify payroll. The employer can grant an auditor read-only permission via an on-chain ACL."*

*"Switching to the auditor's view... they can now decrypt the specific payment handles they were granted access to. Five hundred, and three hundred. Every salary is visible to them — but only because the employer explicitly chose to share it. It’s on-chain, verifiable, and secure. No more emailing sensitive spreadsheets, and no need to trust third-party databases."*

### Privacy moment:
The auditor sees salaries only through an explicit on-chain ACL grant from the employer. The permission is transparent and auditable — the auditor didn't hack anything, the employer chose to share.

### Editing notes:
- Wallet switch (employer): JUMP_CUT
- grantAuditorAccess tx: SHOW_REAL (~7s) — core differentiator action
- NoxCompute.allow(h1): SHOW_REAL (~4s)
- NoxCompute.allow(h2): SHOW_REAL (~3s)
- Wallet switch (auditor): JUMP_CUT
- Decrypt Payment #1: EIP-712 sign (~5s) — show real
- Decrypt Payment #2: EIP-712 sign (~5s) — show real

---

## Closing (2:40–3:00)

### On-screen:
1. **2:40–2:50** — Text card on dark background:

   > **Veilroll — Confidential Payroll, On-Chain**
   > Three roles. Three access levels. One encrypted protocol.

2. **2:50–2:55** — GitHub repo URL on screen. Text: *"Built with iExec Nox Protocol + ERC-7984 Confidential Tokens. Arbitrum Sepolia."*
3. **2:55–3:00** — Tags overlay: **@iEx_ec  @Chain_GPT**

### Voiceover (32 words):
*"Three roles, three distinct access levels, and one confidential protocol securing it all. Veilroll — bringing true privacy to on-chain payroll. Built on the iExec Nox Protocol and ERC-7984. Thanks for watching."*

### Editing notes:
No MetaMask. Static visuals with text overlays. Let the screen linger to hit the 3-minute mark perfectly.

---

## Timing Analysis

### Voiceover Word Count

| Section | Words | Duration at 2.5w/s |
|---------|-------|-------------------|
| Hook | 45 | 18s |
| Scene 1+2 | 85 | 34s |
| Scene 3 | 90 | 36s |
| Scene 4 | 95 | 38s |
| Close | 32 | 13s |
| **Total** | **347** | **139s (~2:19)** |

Voiceover fills 139s of 180s (77%). Remaining 41s is for breathing room during visual transitions and UI interactions — a very comfortable, professional pace.

### Raw vs Edited Duration

| Section | Target Duration | Notes |
|---------|-----------------|-------|
| Hook | 20s | Problem statement and intro |
| Scene 1+2 | 40s | Wrap + Pay All with minimal jump cuts |
| Scene 3 | 45s | Employee unwrap, showcasing the 15s TEE wait |
| Scene 4 | 55s | Auditor disclosure flow, showing full signatures |
| Close | 20s | Outro and credits |
| **Total** | **180s (3:00)** | **Perfect 3-minute runtime** |

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

- [ ] Apply JUMP_CUTs for wallet switching
- [ ] Apply SPEED_4X only for redundant Employee B operations
- [ ] Add text overlay for Hook ("Salary payments on the blockchain are public")
- [ ] Add closing card with repo URL + @iEx_ec @Chain_GPT tags
- [ ] Verify total exactly ~3:00
- [ ] Export as MP4 1080p → `submission/assets/demo.mp4`
