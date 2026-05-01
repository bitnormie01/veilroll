# Architecture — Confidential Payroll (ConfPay)

> **Toolchain:** Hardhat (not Foundry — Foundry guide is "Coming Soon" per iExec docs, BLOCKER-001)
> **Encryption model:** ECIES + Intel TDX TEE — NOT FHE/Zama. CONTEXT_PACK was wrong. See §Encryption Model below.
> **Last updated:** T+16.8h (2026-04-30T05:44Z) — Post Phase 5a architecture changes

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vite + React + ethers.js v6)      │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Employer Panel   │  │  Employee Panel   │  │  Auditor View │ │
│  │  - Wrap ERC-20    │  │  - View balance   │  │  - Decrypt    │ │
│  │  - Add recipients │  │  - Decrypt amount │  │    handles    │ │
│  │  - Pay (direct tx)│  │  - Unwrap to ERC20│  │  - Read-only  │ │
│  │  - Grant auditor  │  │  - Tx history     │  │               │ │
│  └──────┬───────────┘  └──────┬───────────┘  └───────────────┘ │
│         │                      │                                  │
│         │    @iexec-nox/handle (JS SDK)                          │
│         │    encryptInput() / decrypt() / publicDecrypt()        │
│         │                      │                                  │
└─────────┼──────────────────────┼──────────────────────────────────┘
          │                      │
          ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ARBITRUM SEPOLIA (Chain ID: 421614)           │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  MockERC20     │  │  ConfPayToken  │  │  PayrollManager  │  │
│  │  (test token)  │  │  (ERC7984      │  │  (bookkeeping +  │  │
│  │  - mint()      │  │   Wrapper)     │  │   auditor roster)│  │
│  │  - approve()   │  │  - wrap()      │  │  - addEmployee() │  │
│  │                │  │  - unwrap()    │  │  - recordPay()   │  │
│  │                │  │  - finalize    │  │  - grantAuditor()│  │
│  │                │  │    Unwrap()    │  │  - getHandles()  │  │
│  └────────────────┘  └───────┬────────┘  └──────────────────┘  │
│                               │                                  │
│  ┌────────────────────────────┼─────────────────────────────┐   │
│  │  NOX PROTOCOL INFRASTRUCTURE (iExec-managed)              │   │
│  │  - NoxCompute @ 0xd464...c229 (handle validation, ACL)   │   │
│  │  - Handle Gateway (encryption/decryption)                 │   │
│  │  - Ingestor + Runner + KMS (off-chain compute)           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Encryption Model (Ground Truth)

**Nox uses ECIES (Elliptic Curve Integrated Encryption Scheme) on secp256k1 + Intel TDX TEE, NOT Fully Homomorphic Encryption (FHE).**

- CONTEXT_PACK.md references FHE/Zama. This is incorrect for the current Nox implementation.
- The EIP-7984 spec is technology-agnostic (uses `bytes32` pointers). iExec's implementation stores encrypted data in the Handle Gateway (AWS S3), with computation performed inside TEE enclaves.
- Encrypted Solidity types (`euint256`, `externalEuint256`, `ebool`) are opaque 32-byte handles pointing to off-chain encrypted data. They are NOT FHE ciphertexts.
- Arithmetic operations (`Nox.add()`, `Nox.sub()`) emit events that trigger off-chain computation in the Runner TEE. The result handle is deterministic but the computation is async.
- **Implication for implementers:** Do NOT import Zama libraries. Use only `@iexec-nox/nox-protocol-contracts` and `@iexec-nox/nox-confidential-contracts`. All encrypted type handling goes through the `Nox` library.
- **Testing:** Hardhat tests that call `Nox.fromExternal()` require the Handle Gateway. Integration tests must run against Arbitrum Sepolia (live or forked). Local unit tests cover only non-encrypted logic paths.

## Smart Contract Layout

### 1. `MockERC20.sol` (test token)
- Standard ERC-20 with public `mint()` for testing
- Used as the underlying token for wrapping
- Import from OpenZeppelin

### 2. `ConfPayToken.sol` (ERC-7984 Wrapper)
- Inherits: `ERC20ToERC7984Wrapper`, `ERC7984`
- Constructor takes `IERC20` address of underlying token
- Wraps any ERC-20 into confidential equivalent
- All ERC-7984 methods inherited from base contract
- **The employer calls `confidentialTransfer` on this contract directly** — it is the entry point for all encrypted token transfers
- **Full ERC-7984 compliance via inherited base**

### 3. `PayrollManager.sol` (bookkeeping + auditor registry)

> ⚠️ **Architecture change (T+15.4h):** PayrollManager was originally designed to execute transfers via `batchPay`. This was redesigned to `recordPayments` during Phase 5a. See §Architecture Change History below.

- **Current role:** Bookkeeping + auditor roster management. Does NOT execute token transfers.
- Functions:
  - `addEmployee(address employee)` — owner only
  - `removeEmployee(address employee)` — owner only
  - `recordPayments(address[] employees, euint256[] handles)` — owner records handles from direct ConfPayToken transfers
  - `getPaymentHandle(address employee, uint256 index)` — returns stored handle
  - `getPaymentCount(address employee)` — returns count of recorded payments
  - **`grantAuditorAccess(address auditor)`** — owner registers auditor in roster (ACL is handled separately via NoxCompute)
  - **`revokeAuditorAccess(address auditor)`** — owner removes auditor from roster
  - `getAuditors()` — returns list of current auditors
  - `getPaidEmployees()` — returns all employees who received payments
- **Does NOT call Nox.allow** — PayrollManager has no ACL on transferred handles
- **Auditor ACL** is managed by the employer calling `NoxCompute.allow(handle, auditor)` directly

## Differentiator: Selective Auditor Disclosure

**What makes this non-generic:** The employer can grant an external auditor wallet view-only access to specific payment handles. The auditor can decrypt individual salary amounts to verify compliance, but cannot transfer or modify tokens.

**On-chain mechanics (post-5a):**
1. Employer calls `payrollManager.grantAuditorAccess(auditor)` to register the auditor in the roster
2. Employer calls `noxCompute.allow(paymentHandle, auditor)` for each handle the auditor should access — the employer has ACL on transferred handles because `ERC7984Base._update` calls `Nox.allow(transferred, from)`
3. Auditor uses `handleClient.decrypt(handle)` to view plaintext salary amounts
4. Revocation: `payrollManager.revokeAuditorAccess(auditor)` removes from roster. Note: Nox ACL does not support retroactive revocation — previously-granted handles remain accessible. Documented per BLOCKER-003.

**Frontend:**
- Employer dashboard has an "Auditor Management" panel: add/remove auditor addresses
- When granting, the frontend sends two txs: `grantAuditorAccess` + `NoxCompute.allow` for each stored handle
- Auditor view: read-only page showing decrypted payment amounts for all employees they have access to

**Why this is judge-visible:**
- Demonstrates Nox ACL system beyond basic transfer/decrypt
- Real-world compliance use case (payroll audits, tax reporting)
- Shows selective disclosure — the core value prop of confidential tokens

## Data Flow: Payment Cycle (Post-5a Architecture)

```
1. Employer: ERC-20.approve(ConfPayToken, amount)
2. Employer: ConfPayToken.wrap(employer, amount) → encrypted balance
3. Employer: SDK.encryptInput(salary, 'uint256', ConfPayToken.address) → handle + proof
4. Employer: ConfPayToken.confidentialTransfer(employee, handle, proof)
   └→ ConfPayToken._update:
      ├→ Nox.allow(transferred, employee) — employee can decrypt
      ├→ Nox.allow(transferred, employer) — employer retains ACL for auditor grants
      └→ emit ConfidentialTransfer(employer, employee, transferred)
5. Employer: PayrollManager.recordPayments([employee], [transferredHandle])
   └→ Stores handle for auditor disclosure queries
6. [Optional] Employer: NoxCompute.allow(transferredHandle, auditor)
   └→ Grants auditor decrypt permission on this specific payment
7. Employee: SDK.decrypt(balanceHandle) → sees plaintext salary
8. Employee: ConfPayToken.unwrap(employee, employee, balanceHandle) → requestId
9. [Off-chain: Nox decrypts amount via TEE]
10. Employee: SDK.publicDecrypt(requestId) → plaintext + proof
11. Employee: ConfPayToken.finalizeUnwrap(requestId, proof) → ERC-20 received
```

## Architecture Change History

| Timestamp | Change | Reason |
|---|---|---|
| T+15.4h | ARCH-CHANGE-001: PayrollManager redesigned from transfer executor to bookkeeping layer | Nox ACL `validateInputProof` checks `msg.sender` against proof's `applicationContract`. Cross-contract call chain (employer→PayrollManager→ConfPayToken→NoxCompute) caused irreconcilable proof mismatches. |
| T+15.4h | ARCH-CHANGE-002: `batchPay` → `recordPayments` | PayrollManager no longer holds transfer authority |
| T+15.4h | ARCH-CHANGE-003: Auditor ACL moved to employer direct NoxCompute.allow | PayrollManager never receives ACL on transferred handles |
| T+15.5h | PayrollManager v3 deployed at `0xe3A2240060e1f52D84d8acE41dBb908aF53B3825` | Replaces v1 and v2 (both deprecated) |

## Frontend Layout

### Framework: Vite + React + ethers.js v6 (Hardhat backend)

### Pages:
1. **`/` — Landing Page**
   - Hero: "Confidential Payroll on Arbitrum"
   - Connect wallet button
   - Brief explainer

2. **`/employer` — Employer Dashboard**
   - Wrap ERC-20 → ConfPayToken (input amount, approve, wrap)
   - Employee management (add/remove addresses)
   - Pay form: amounts per employee → sequential `confidentialTransfer` + `recordPayments` txs
   - Auditor management: grant/revoke (sends grantAuditorAccess + NoxCompute.allow)
   - ConfPayToken balance (encrypted, with decrypt button)

3. **`/employee` — Employee View**
   - Confidential balance display (decrypt via SDK)
   - Unwrap flow (2-step: request → finalize)
   - Payment history
   - Transfer to other addresses

4. **`/auditor` — Auditor View (the differentiator)**
   - Read-only dashboard
   - Lists all employees with granted access
   - Decrypt button per employee → shows plaintext salary amount

### Components:
- `WalletConnect` — connect/disconnect, show address
- `TokenBalance` — encrypted balance + decrypt button
- `WrapForm` — ERC-20 approve + wrap
- `UnwrapFlow` — 2-step unwrap with status
- `BatchPayForm` — multi-recipient encrypted payment (sequential ConfPayToken txs)
- `TransactionList` — tx history from events

## External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `hardhat` | 2.x | Contract compilation, testing, deployment |
| `@nomicfoundation/hardhat-toolbox` | latest | Hardhat plugins (ethers, chai, etc.) |
| `@iexec-nox/nox-protocol-contracts` | latest | Nox.sol, encrypted types |
| `@iexec-nox/nox-confidential-contracts` | latest | ERC7984, ERC20ToERC7984Wrapper |
| `@iexec-nox/handle` | latest | JS SDK for encrypt/decrypt |
| `@openzeppelin/contracts` | 5.x | ERC-20, Ownable, SafeERC20 |
| `ethers` | 6.x | Wallet interaction (shared by Hardhat + frontend) |
| `vite` | latest | Frontend build |
| `react` | 18.x | UI framework |

## HARD CONSTRAINT: No LLM in Runtime

**ChainGPT usage (setup-time only):**
1. Generate contract audit report → store as `docs/CHAINGPT_AUDIT.md`
2. Review contract code for vulnerabilities → document findings
3. **NOT called from any contract function, transaction flow, or user action**
