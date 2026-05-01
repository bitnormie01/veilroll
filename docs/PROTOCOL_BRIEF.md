# Protocol Brief — Nox Protocol & Confidential Tokens

**Produced by:** Recon pass (PM-executed)
**Date:** 2026-04-29T08:31Z
**Sources:** All Tier 1 URLs fetched and read. npm org page returned 403 (fetched via docs instead).

---

## 1. Nox Protocol — What It Is

Nox is a confidential computation protocol for DeFi on Arbitrum. It allows smart contracts to operate on encrypted data without exposing plaintext on-chain.

### TEE Model
- **Hardware:** Intel TDX-based TEE enclaves (not SGX as CONTEXT_PACK states — docs say TDX)
- **Encryption:** ECIES on secp256k1, using KMS public key. KMS never sees plaintext — performs "decryption delegation"
- **NOT FHE:** Despite CONTEXT_PACK mentioning FHE/Zama, the actual Nox docs describe ECIES + TEE architecture. The EIP-7984 spec is technology-agnostic (uses `bytes32` pointers). iExec's implementation uses TEE, not FHE.

### Architecture — 6 Components
1. **On-chain Smart Contracts** — NoxCompute library, ACL contract, handle validation
2. **Ingestor** — Event listener, polls blocks, filters NoxCompute logs, publishes to NATS JetStream
3. **NATS JetStream** — Message queue between Ingestor and Runner
4. **Runner** — Computation engine inside TEE, decrypts inputs, computes, encrypts results
5. **Handle Gateway** — Encrypted data store (AWS S3), manages handles, serves decryption material
6. **KMS** — Key management, decryption delegation via ECDH shared secret

### Key Invariants
- Handles are 32-byte identifiers pointing to encrypted data, NOT the ciphertext itself
- Handle structure: `[prehandle 26B][chainId 4B][type 1B][version 1B]`
- Computation result handles are deterministic (same inputs + same tx = same handle)
- User input handles use random prehandle, validated via EIP-712 signed proof
- ACL controls who can use handles as computation input AND who can decrypt

### Three-Phase Flow
1. **Input:** User encrypts via SDK → Handle Gateway stores → returns handle + EIP-712 proof → user calls contract with handle
2. **Compute:** Ingestor picks up event → Runner decrypts in TEE → computes → encrypts result → stores in Handle Gateway
3. **Output:** User requests decryption → Handle Gateway checks ACL → KMS delegates decryption → user decrypts locally

---

## 2. Confidential Token (ERC-7984)

### ERC-7984 Spec (EIP-7984, Draft, July 2025)
- **Interface ID:** `0x4958f2a4` (must return `true` from `supportsInterface`)
- **NOT ERC-20 compatible** — completely separate interface
- All amounts are `bytes32` pointers, not `uint256`
- Technology-agnostic: works with FHE, ZKP, TEE, or any pointer-based system

### Required Methods (FULL compliance checklist)
```
function name() external view returns (string memory)
function symbol() external view returns (string memory)
function decimals() external view returns (uint8)
function contractURI() external view returns (string memory)
function confidentialTotalSupply() external view returns (bytes32)
function confidentialBalanceOf(address account) external view returns (bytes32)
function isOperator(address holder, address spender) external view returns (bool)
function setOperator(address operator, uint48 until) external
function confidentialTransfer(address to, bytes32 amount) external returns (bytes32)
function confidentialTransfer(address to, bytes32 amount, bytes calldata data) external returns (bytes32)
function confidentialTransferFrom(address from, address to, bytes32 amount, bytes calldata data) external returns (bytes32)
function confidentialTransferFrom(address from, address to, bytes32 amount, bytes calldata data) external returns (bytes32)
function confidentialTransferAndCall(address to, bytes32 amount, bytes calldata callData) external returns (bytes32)
function confidentialTransferAndCall(address to, bytes32 amount, bytes calldata data, bytes calldata callData) external returns (bytes32)
function confidentialTransferFromAndCall(address from, address to, bytes32 amount, bytes calldata callData) external returns (bytes32)
function confidentialTransferFromAndCall(address from, address to, bytes32 amount, bytes calldata data, bytes calldata callData) external returns (bytes32)
```

### Required Events
```
event ConfidentialTransfer(address indexed from, address indexed to, bytes32 indexed amount)
event OperatorSet(address indexed holder, address indexed operator, uint48 until)
event AmountDisclosed(bytes32 indexed handle, uint256 amount) // SHOULD, not MUST
```

### Callback Interface (Contract Receivers)
```
function onConfidentialTransferReceived(address operator, address from, bytes32 amount, bytes calldata data) external returns (bytes32 success)
```
- If `address(to).code.length == 0`, callback is no-op
- If callback returns false, tokens are returned to sender

### Operator Model (replaces ERC-20 allowances)
- `setOperator(address, uint48 until)` — time-limited, full access (no amount cap)
- Multiple simultaneous operators allowed
- Revoke by setting `until = 0`

---

## 3. iexec-nox NPM Packages

### Confirmed packages (from docs):
1. **`@iexec-nox/nox-protocol-contracts`** — Core Solidity library
   - Import: `import {Nox, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol"`
   - Types: `euint256`, `externalEuint256`, `ebool`
   - Functions: `Nox.toEuint256()`, `Nox.fromExternal()`, `Nox.add()`, `Nox.sub()`, `Nox.safeAdd()`, `Nox.safeSub()`, `Nox.select()`, `Nox.allowThis()`, `Nox.allow()`, `Nox.allowTransient()`, `Nox.toEbool()`

2. **`@iexec-nox/nox-confidential-contracts`** — Higher-level token contracts
   - `ERC7984` base contract: `import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol"`
   - `ERC20ToERC7984Wrapper`: `import {ERC20ToERC7984Wrapper} from "@iexec-nox/nox-confidential-contracts/contracts/token/extensions/ERC20ToERC7984Wrapper.sol"`
   - `IERC7984`: `import {IERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984.sol"`
   - `IERC7984Receiver`: `import {IERC7984Receiver} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984Receiver.sol"`
   - Installs `@openzeppelin/contracts` as dependency
   - Solidity: `^0.8.28`

3. **`@iexec-nox/handle`** — JS/TS SDK for encryption/decryption
   - Factory: `createEthersHandleClient(provider)` or `createViemHandleClient(walletClient)`
   - Methods: `encryptInput()`, `decrypt()`, `publicDecrypt()`, `viewACL()`
   - Requires: Node.js 18+, Ethers.js v6 or Viem v2

---

## 4. Confidential Smart Contracts Wizard (cdefi-wizard.iex.ec)

### What It Generates
Minimal ERC-7984 token contract:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";

contract MyToken is ERC7984 {
    constructor() ERC7984("MyToken", "MTK", "") {}
}
```
- Settings panel (customizable name, symbol, features)
- Links to `@iexec-nox/nox-confidential-contracts` npm package
- **Safest starting point for Phase 1**

---

## 5. Faucet / Demo (cdefi.iex.ec)

- Marketing/demo page for Confidential Token on Arbitrum
- Features: DeFi composability, selective disclosure, scalable confidentiality
- **The page is JS-heavy SPA — actual faucet functionality requires wallet connection**
- Links to docs, GitHub (`github.com/iExec-Nox`), terms
- Available on Arbitrum Sepolia

---

## 6. Arbitrum Sepolia Deployment Specifics

- **Chain ID:** 421614
- **RPC:** `https://sepolia-rollup.arbitrum.io/rpc`
- **Block explorer:** `https://sepolia.arbiscan.io`
- **ETH faucet:** Bridge from Sepolia via `https://bridge.arbitrum.io`
- **iExec faucet:** via `https://cdefi.iex.ec`
- **Gas:** Standard Arbitrum L2 costs (low)

---

## 7. Known Constraints / Gotchas

### CRITICAL: Foundry Guide Is "Coming Soon"
The Foundry integration page says **"Coming Soon, this guide is under active development."** This means:
- No official Foundry remapping guide for `@iexec-nox` packages
- Testing approach with Foundry is undocumented
- **Recommendation:** Use Hardhat for contract development, OR manually configure Foundry remappings by inspecting the npm package structure

### Encryption Is NOT FHE
CONTEXT_PACK references FHE/Zama. The actual Nox implementation uses ECIES + TEE (Intel TDX). The EIP-7984 spec is technology-agnostic. Do NOT import Zama libraries.

### Solidity Types
- `euint256` = encrypted uint256 (32-byte handle)
- `externalEuint256` = encrypted input from user (needs proof verification via `Nox.fromExternal()`)
- `ebool` = encrypted boolean
- Must explicitly initialize: `Nox.toEuint256(0)` — cannot use default `0`
- Cannot use native operators (`>`, `<`, `==`) on encrypted types — use Nox library functions

### Access Control Pattern (MUST follow)
After every operation that produces a new handle:
```solidity
Nox.allowThis(handle);        // let contract reuse in future txs
Nox.allow(handle, userAddr);  // let user decrypt off-chain
```
For transient (within-transaction) access:
```solidity
Nox.allowTransient(handle, targetContract);
```

### Wrapping/Unwrapping
- **Wrap (ERC-20 → ERC-7984):** Single step. `wrap(address to, uint256 amount)`. Plaintext amount, immediate.
- **Unwrap (ERC-7984 → ERC-20):** TWO steps:
  1. `unwrap()` — burns encrypted tokens, returns `unwrapRequestId`
  2. `finalizeUnwrap(unwrapRequestId, decryptedAmountAndProof)` — after off-chain decryption
- Unwrap is ASYNC — design UX accordingly

### Arithmetic Wrapping
- `Nox.add()` and `Nox.sub()` use wrapping arithmetic (no revert on overflow)
- For production: use `Nox.safeAdd()` / `Nox.safeSub()` + `Nox.select()` for overflow handling

### Receiver Pattern
- Contracts receiving ERC-7984 via `confidentialTransferAndCall` MUST implement `IERC7984Receiver`
- Return `Nox.toEbool(true)` to accept, `Nox.toEbool(false)` to refund
- Must use `Nox.allowTransient(accepted, msg.sender)` before returning

---

## 8. Open Questions (docs do not answer)

1. **Foundry support:** No official guide. How do remappings work for `@iexec-nox` npm packages in a Foundry project? Can we use `forge install` or must we npm install + configure remappings manually?

2. **Testing:** How do you unit test contracts that use `Nox.fromExternal()` and encrypted types locally? The computation pipeline (Ingestor → Runner) is off-chain. Is there a mock/local mode?

3. **Gas costs:** No gas benchmarks in docs. How much does a `confidentialTransfer` cost compared to ERC-20 `transfer`? Does it vary by operation type?

4. **Deployment addresses:** What are the addresses of the deployed Nox infrastructure contracts (NoxCompute, ACL, Handle Gateway endpoint) on Arbitrum Sepolia? The docs reference them but don't list explicit addresses.

5. **Rate in wrapper:** CONTEXT_PACK mentions a `rate()` function in the wrapper. The docs show 1:1 wrapping (`Nox.toEuint256(amount)`). Is there a conversion rate or is it always 1:1?

6. **ChainGPT integration specifics:** How to get API credits? Only method mentioned is contacting `@vladnazarxyz` on Telegram. No self-service API key portal found.

7. **ERC-165 for ERC-7984:** Interface ID is `0x4958f2a4`. Does the `ERC7984` base contract from `nox-confidential-contracts` implement this automatically?

8. **`contractURI()` requirement:** The spec says it MUST be implemented. What URI should we return? Is there a standard metadata schema?

9. **Handle Gateway availability:** Is the Handle Gateway always available on Arbitrum Sepolia testnet? What's the uptime SLA? Any rate limits?

10. **Wallet compatibility:** Which wallets actually work with the `@iexec-nox/handle` SDK? Docs show Ethers.js and Viem adapters but don't list tested wallets.
