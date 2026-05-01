# Phase Plan — Confidential Payroll (ConfPay)

**Total build phases:** 5 + Submission Packaging
**Total available hours:** 40 (including 6h packaging reserve)
**Toolchain:** Hardhat (Foundry unsupported — BLOCKER-001, resolved by this switch)
**Differentiator:** Selective Auditor Disclosure (ACL grant/revoke flow)

---

### Phase 1: Scaffold + Deploy Base Token
- **Goal:** Deploy a working ERC-7984 wrapper token on Arbitrum Sepolia using the wizard-generated pattern.
- **Deliverable:** Deployed ConfPayToken contract on Arbitrum Sepolia with verified wrap() working via Hardhat deploy script.
- **Acceptance test (binary):** 
  - MockERC20 deployed and minted on Arbitrum Sepolia (tx hash provided)
  - ConfPayToken (ERC20ToERC7984Wrapper) deployed on Arbitrum Sepolia (tx hash provided)
  - `wrap()` called successfully — ERC-20 tokens locked, confidential balance exists (tx hash provided)
  - All 3 tx hashes verifiable on sepolia.arbiscan.io
- **Out of scope:** PayrollManager, frontend, unwrap flow, batch payments
- **Time cap:** 4 hours
- **ERC standard touched?** YES — ERC-7984 (full compliance required). All interface functions must exist via inherited ERC7984 base.
- **Hot-path AI check:** No AI in any contract code.
- **Files to create/modify:**
  - `code/contracts/MockERC20.sol`
  - `code/contracts/ConfPayToken.sol`
  - `code/hardhat.config.js`
  - `code/scripts/deploy.js`
  - `code/package.json`
  - `reports/phase-1-executor.md`

---

### Phase 2: PayrollManager Contract + Auditor Disclosure
- **Goal:** Deploy PayrollManager with batch-pay AND auditor grant/revoke. This is the differentiator phase.
- **Deliverable:** PayrollManager deployed on Arbitrum Sepolia. Batch payment to 2+ addresses + auditor granted access and able to decrypt a payment handle.
- **Acceptance test (binary):**
  - PayrollManager contract deployed (tx hash)
  - `addEmployee()` called for 2+ addresses (tx hash)
  - Employer wraps tokens, sets operator, calls `batchPay()` (tx hash)
  - Employee addresses have non-zero confidential balance (verified via `confidentialBalanceOf()`)
  - `grantAuditorAccess(auditorAddress)` called (tx hash)
  - Auditor can decrypt at least one employee's payment handle (verified via SDK `decrypt()` call in test script)
- **Out of scope:** Frontend, unwrap flow, UI polish, auditor revocation (nice-to-have)
- **Time cap:** 4 hours
- **ERC standard touched?** YES — PayrollManager implements `IERC7984Receiver`. Must fully implement `onConfidentialTransferReceived()`.
- **Hot-path AI check:** No AI in any contract code.
- **Files to create/modify:**
  - `code/contracts/PayrollManager.sol`
  - `code/scripts/deploy-payroll.js`
  - `code/scripts/test-auditor-decrypt.js` (script that grants auditor + decrypts to prove it works)
  - `code/test/PayrollManager.test.js` (Hardhat integration tests)
  - `reports/phase-2-executor.md`

---

### Phase 3: Frontend — Core UI
- **Goal:** Build the core frontend with wallet connection, employer wrap flow, and employee balance decryption.
- **Deliverable:** Running Vite+React app with working wallet connect, wrap flow, and balance decryption against deployed contracts.
- **Acceptance test (binary):**
  - `npm run dev` serves the app without errors
  - Wallet connects via MetaMask (screenshot)
  - Employer can wrap ERC-20 → ConfPayToken (screenshot of successful tx)
  - Employee can view and decrypt their confidential balance (screenshot showing plaintext amount)
- **Out of scope:** Batch payment UI, unwrap flow, styling polish, animations
- **Time cap:** 4 hours
- **ERC standard touched?** No (frontend only, contracts already deployed)
- **Hot-path AI check:** No AI calls in frontend runtime. SDK calls only (encryptInput, decrypt).
- **Files to create/modify:**
  - `code/frontend/` (entire directory: package.json, vite config, components, pages)
  - `code/frontend/src/App.jsx`
  - `code/frontend/src/components/` (WalletConnect, TokenBalance, WrapForm)
  - `code/frontend/src/config/contracts.js` (deployed addresses, ABIs)
  - `reports/phase-3-executor.md`

---

### Phase 4: Frontend — Payment + Unwrap + Auditor Flows
- **Goal:** Complete all frontend flows: batch payment, unwrap, auditor grant/revoke UI, auditor decrypt view, transaction history.
- **Deliverable:** Fully functional frontend with all flows including auditor disclosure working end-to-end.
- **Acceptance test (binary):**
  - Employer can add employees and execute batch payment (screenshot)
  - Employee can initiate unwrap and finalize (screenshot showing ERC-20 received)
  - **Employer can grant auditor access and auditor can decrypt salaries (screenshot showing auditor view with decrypted amounts)**
  - Transaction history displays past payments (screenshot)
  - All flows work with real on-chain state (no mock data)
- **Out of scope:** Advanced styling, animations, SEO meta tags, demo video
- **Time cap:** 4 hours
- **ERC standard touched?** No (frontend only)
- **Hot-path AI check:** No AI in runtime.
- **Files to create/modify:**
  - `code/frontend/src/components/BatchPayForm.jsx`
  - `code/frontend/src/components/UnwrapFlow.jsx`
  - `code/frontend/src/components/AuditorPanel.jsx`
  - `code/frontend/src/components/TransactionList.jsx`
  - `code/frontend/src/pages/Employer.jsx`
  - `code/frontend/src/pages/Employee.jsx`
  - `code/frontend/src/pages/Auditor.jsx`
  - `reports/phase-4-executor.md`

---

### Phase 5: E2E Integration + Deploy Final
- **Goal:** Full end-to-end flow working: frontend → contracts → real on-chain state on Arbitrum Sepolia. All contracts final-deployed.
- **Deliverable:** Complete e2e walkthrough documented with tx hashes at every step.
- **Acceptance test (binary):**
  - Fresh deployment of all contracts (tx hashes)
  - Full flow: mint ERC-20 → wrap → add employee → batch pay → employee decrypts balance → employee unwraps → ERC-20 received (all tx hashes)
  - Frontend connected to final deployment, all flows working (screenshots)
  - Contract addresses documented in README
  - `docs/CHAINGPT_AUDIT.md` generated (ChainGPT audit of final contracts — setup-time artifact)
- **Out of scope:** Demo video recording, X post, submission packaging
- **Time cap:** 4 hours
- **ERC standard touched?** YES — final ERC-7984 compliance audit by Reviewer
- **Hot-path AI check:** ChainGPT runs at build time only. Confirm no AI in deployed contract code.
- **Files to create/modify:**
  - `code/scripts/deploy-final.js`
  - `code/frontend/src/config/contracts.js` (update addresses)
  - `docs/CHAINGPT_AUDIT.md`
  - `reports/phase-5-executor.md`

---

### Phase 6: Submission Packaging (HARD RESERVE — 6 hours)
- **Goal:** Produce all submission artifacts: README, feedback.md, demo script, demo video, X post draft.
- **Deliverable:** Complete submission package ready for GitHub push and X post.
- **Acceptance test (binary):**
  - `submission/README.md` — install, run, test, deploy commands reproducible
  - `submission/feedback.md` — honest iExec tooling feedback (>500 words)
  - `submission/demo-script.md` — 4-min shot list with narration
  - Demo video recorded (≤4 min)
  - `submission/x-post-draft.md` — tags @iEx_ec and @Chain_GPT, includes video + repo link
  - GitHub repo public, tagged `v1.0-submission`
- **Out of scope:** New code, new features
- **Time cap:** 6 hours (HARD — no extension)
- **ERC standard touched?** No (packaging only)
- **Hot-path AI check:** N/A
- **Files to create/modify:**
  - `submission/README.md`
  - `submission/feedback.md`
  - `submission/demo-script.md`
  - `submission/x-post-draft.md`
  - `reports/phase-6-executor.md`
