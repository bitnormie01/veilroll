# CONTEXT PACK — iExec Vibe Coding Challenge

**Purpose:** Ground truth for all agents (Recon, Architect, Executor, Reviewer). Read before any other work.

**Hierarchy of truth (later overrides earlier):**
1. This file (`docs/CONTEXT_PACK.md`)
2. The hackathon brief (`docs/HACKATHON_BRIEF.md`)
3. Live iExec docs (must be fetched, see Section 4)
4. The PM master prompt
5. Anything an agent's training data thinks it knows about iExec — **distrust by default**

If a fact in your training contradicts a fact in 1–4, **the source wins**. Nox is new (v0.1.0 released April 9, 2026). Your training data on it is thin to wrong. Verify before writing code.

---

## 1. PROTOCOL FACTS (verified)

### Nox Protocol
- **Version:** v0.1.0, first official release, dated April 9, 2026
- **Repo:** `iexec-nox/nox-protocol-contracts` on GitHub
- **What it is:** Confidential computing layer that combines on-chain smart contracts with off-chain Trusted Execution Environments (TEE). Processes encrypted data without exposing plaintext on-chain.
- **TEE technology:** Intel SGX + Intel TDX, via the Scone framework
- **Composability claim:** Confidential contracts remain composable with existing DeFi protocols. Users keep their wallets; developers don't rewrite contracts.
- **Core primitives shipped in v0.1.0:** confidential token, confidential compute components, on-chain access control list (ACL) system

### Confidential Token (the product layer on Nox)
- **What it is:** A reversible ERC-20 wrapper. Any ERC-20 → its confidential equivalent. Hidden balances, hidden transaction amounts.
- **Standard:** Implements **ERC-7984** (Confidential Fungible Token)
- **Reversible:** wrap and unwrap both supported
- **Demo + faucet:** https://cdefi.iex.ec (Arbitrum Sepolia)

### ERC-7984 (the standard underneath)
- **Status:** Draft EIP, July 2025 (Greenberg, García, Croubois, et al.)
- **NOT ERC-20 compliant.** It's inspired by ERC-20 but is its own interface.
- **Cryptography:** Implementations use FHE (Fully Homomorphic Encryption). Zama's implementation is the reference. Balances and transfer amounts are stored as **ciphertext handles** (`euint64` in Solidity), never plaintext.
- **Eight transfer functions** — permutations of:
  - `transfer` vs `transferFrom`
  - with vs without `inputProof` (proves sender knows the ciphertext value)
  - other variants per spec
- **Wrapper pattern:** `ERC7984ERC20Wrapper.wrap(address to, uint256 amount)` takes ERC-20 in, mints ERC-7984 with `_mint(to, (amount / rate()).toUint64().asEuint64())`.
- **Unwrap:** Requires off-chain decryption relayed via Zama Gateway (or equivalent). This is async — design accordingly.
- **Reference implementation:** OpenZeppelin Confidential Contracts. **Read this before writing any code:** https://docs.openzeppelin.com/confidential-contracts/token
- **Performance reality:** FHE ops cost more gas than ERC-20 transfers. Zama claims 100× improvements recently with another 100× targeted, but assume current-gen costs in your design.

### Critical FHE consequences for implementers
- You **cannot** read a balance from the contract and use it as a plain integer in Solidity. It's a ciphertext handle.
- Comparisons (`>`, `<`, `==`) on encrypted values use FHE library functions, not native operators.
- Decryption is **off-chain** and **async**. Any UX that says "click this and see your balance instantly" needs to call a decryption gateway and wait.
- `inputProof` is required for many flows — the user's wallet/SDK must produce it. Cannot fake it.
- Auditor/regulator visibility (the "selective disclosure" feature) is per-spec optional but supported via grant flows.

---

## 2. HACKATHON ESSENTIALS (from the brief — verify against `HACKATHON_BRIEF.md`)

- **Chain:** Arbitrum Sepolia or Arbitrum mainnet. Default to Sepolia.
- **AI partner:** ChainGPT — free API credits, contact `@vladnazarxyz` on Telegram
- **Required submission elements:**
  1. Public GitHub repo, open-source, with README and full docs
  2. Functional frontend
  3. ≤4-min demo video
  4. X post tagging `@iEx_ec` AND `@Chain_GPT`, including project description + demo video + repo link
  5. **`feedback.md` in repo** with honest iExec tooling feedback (worth ⭐⭐ — missing it loses 2 stars)
- **Eval criteria, in priority order:**
  - ⭐⭐⭐ Works end-to-end without mocks (mock data → disqualification, per brief)
  - ⭐⭐ Deployed on Arbitrum Sepolia or Arbitrum
  - ⭐⭐ `feedback.md` present
  - ⭐⭐ Demo video ≤4 min
  - ⭐ Confidential Token + Nox integration depth
  - ⭐ Real-world DeFi/RWA use case
  - ⭐ Code quality (within time constraints)
  - ⭐ UX
- **ERC compliance hard rule (from brief, verbatim):** *"For ERC standards (ERC-3643, ERC-7540, ERC-7984) implementations must fully adhere to the specifications including correct integration of encrypted types when applicable. Partial implementations will not be considered valid."* Treat partial implementations as auto-fail.
- **Prizes:** $750 / $500 / $250, paid in RLC tokens.

---

## 3. CHAIN CONFIG — Arbitrum Sepolia

- **Chain ID:** 421614
- **RPC (public):** `https://sepolia-rollup.arbitrum.io/rpc`
- **Block explorer:** `https://sepolia.arbiscan.io`
- **Faucet for ETH:**
  - Bridge from Sepolia: `https://bridge.arbitrum.io`
  - Direct faucets: search current "Arbitrum Sepolia faucet" — links rot, verify before using
- **iExec faucet for confidential token testing:** included in `https://cdefi.iex.ec` (per brief)
- **Foundry config snippet:**
  ```toml
  [profile.default]
  src = "src"
  out = "out"
  libs = ["lib"]
  
  [rpc_endpoints]
  arbitrum_sepolia = "https://sepolia-rollup.arbitrum.io/rpc"
  
  [etherscan]
  arbitrum_sepolia = { key = "${ARBISCAN_API_KEY}", url = "https://api-sepolia.arbiscan.io/api" }
  ```

---

## 4. MUST-FETCH URLS (Recon does this first)

Recon agent — do not skim, do not summarize from training data, **fetch each URL and read it**. Compile findings into `docs/PROTOCOL_BRIEF.md`.

**Tier 1 — required:**
1. `https://docs.iex.ec/nox-protocol/getting-started/welcome` — entry point, crawl from here
2. `https://docs.iex.ec` — top-level docs index
3. `https://www.npmjs.com/org/iexec-nox` — list every package, note versions, what each does
4. `https://cdefi-wizard.iex.ec/` — the contract generator. Generate a sample, save the output, study it.
5. `https://cdefi.iex.ec/` — live demo. Run a wrap and unwrap. Note tx hashes, contract addresses.
6. `https://docs.openzeppelin.com/confidential-contracts/token` — ERC-7984 reference implementation
7. `https://eips.ethereum.org/EIPS/eip-7984` — the spec itself
8. `https://linktr.ee/iexec.tech` — broader resource hub

**Tier 2 — fetch if Tier 1 leaves gaps:**
9. ChainGPT docs: `https://chaingpt.org` and their dev docs
10. Zama FHE docs (if Architect picks anything that needs custom FHE): `https://docs.zama.ai`
11. iExec GitHub org: search `iexec-nox` repo for examples and tests

**For each URL, Recon must capture:**
- Function names and signatures actually present in the SDK / contracts
- Package names and exact version numbers
- Code examples (paste verbatim into PROTOCOL_BRIEF.md)
- Anything that contradicts what training data says
- Anything the docs *don't* cover (the OPEN_QUESTIONS section)

---

## 5. KNOWN GOTCHAS (front-load these or lose hours)

1. **Nox is 3 weeks old at hackathon time.** Expect rough edges, sparse error messages, missing examples. Budget 30% extra time for iExec-tooling debugging vs a mature stack.

2. **FHE = encrypted types in Solidity.** Code that compiles for ERC-20 will not compile for ERC-7984 if it tries to do `balance > 0` with native operators. Use the FHE library's comparison functions.

3. **Decryption is async + off-chain.** Any UI that "shows the user their balance" needs a decryption flow. Plan for it from the start; don't bolt it on at the end.

4. **`inputProof` is mandatory for transfer flows.** The frontend SDK generates it client-side. If your frontend doesn't generate it, your contract calls will revert.

5. **The wrapper has a `rate()`.** Wrapping `amount` of ERC-20 produces `amount / rate()` of ERC-7984, with a remainder. Edge case: `amount < rate()` means zero confidential tokens minted. Test this.

6. **ChainGPT integration is not free of latency.** If you call ChainGPT inside a transaction flow, the user waits on an LLM. Per master prompt rule: **AI runs at setup time, not in the runtime hot path.** Acceptable: ChainGPT generates contract scaffolds, audit reports, or static config that gets deployed. Not acceptable: ChainGPT called inside a contract function or before every user action.

7. **`forge test` on FHE code may need the Zama testing fixtures.** Standard Foundry fork tests work for the Solidity layer but the FHE coprocessor may need a mock or live testnet. Recon must verify the testing approach the iExec docs recommend.

8. **Wallet support.** Confirm which wallets (MetaMask, Rabby, etc.) actually work with the iExec SDK on Arbitrum Sepolia. Do not assume.

9. **Verify the `iexec-nox` npm packages are installable.** First Executor task: `npm install @iexec-nox/<package>` and confirm. Brand new packages sometimes have publishing issues.

10. **The `cdefi-wizard.iex.ec` generated code is your safest starting point.** Phase 1 should be: generate from the wizard, deploy unmodified to Arbitrum Sepolia, confirm it works. Build custom logic on top, never replacing the wizard's output.

---

## 6. CHAINGPT — what's actually useful

ChainGPT offers (per their public surface):
- Smart contract generator
- Smart contract auditor
- Web3 LLM (general-purpose)
- Image / NFT generator
- On-chain data insights
- Legal assistant

**Highest-EV uses for this hackathon (each is judge-visible):**
1. **Audit report generation** — run ChainGPT audit on your contracts, ship the report in the repo as `docs/CHAINGPT_AUDIT.md`. Concrete artifact, low effort.
2. **Pre-deployment scaffold review** — feed your contract draft to ChainGPT, capture the diff, document the changes you accepted and why. Shows AI-assisted dev workflow.
3. **Setup-time config generation** — if your dApp has rules or thresholds, generate them once via ChainGPT and store as JSON in the repo. **Never** in the runtime path.

**Anti-pattern to avoid:** UI that calls ChainGPT inside a transaction flow. Slow, expensive, breaks under rate limits, judges flag it.

---

## 7. AGENT INSTRUCTIONS — how to use this file

**Recon:** Read this entire file. Then fetch every Tier 1 URL in Section 4. Write `docs/PROTOCOL_BRIEF.md` per the master prompt's Appendix A. Do **not** trust your training data over what you fetch.

**Architect:** Read this file + `PROTOCOL_BRIEF.md` + `HACKATHON_BRIEF.md` before writing `USE_CASE_PICK.md`. Your use case must be feasible given the FHE gotchas in Section 5.

**Executor:** Re-read Section 5 before writing any FHE/ERC-7984 code. When in doubt, copy patterns from OpenZeppelin's reference (Section 4 URL #6), not from memory.

**Reviewer:** Use Section 5 as your audit checklist. For any ERC-7984 work, walk the EIP-7984 function list (Section 4 URL #7) and verify each function exists.

**PM:** Treat this file as immutable. If an agent claims something contradicts this file, escalate to 0xjaadu — don't let them rewrite ground truth.

---

## 8. WHAT'S NOT IN THIS PACK

I deliberately did not pre-pick:
- The use case (Architect's job — see master prompt Section 3 shortlist)
- The frontend framework (Architect's call based on team familiarity)
- The exact phase plan (Architect's job)
- Specific contract addresses for `iexec-nox` packages (Recon must fetch)

Anything else missing → flag in `state/BLOCKERS.md` and escalate.

---

**End of context pack.** Drop questions in chat with 0xjaadu, not in this file. This file is read-only after Stage 0.
