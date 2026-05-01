<p align="center">
  <h1 align="center">🛡️ Veilroll</h1>
  <p align="center"><strong>Confidential Payroll on Arbitrum</strong></p>
  <p align="center">
    Pay your team with encrypted amounts. Only authorized parties can decrypt.<br/>
    Built with <a href="https://protocol.iex.ec/">iExec Nox Protocol</a> · <a href="https://eips.ethereum.org/EIPS/eip-7984">ERC-7984</a> · Arbitrum Sepolia
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-^0.8.28-363636?logo=solidity" alt="Solidity" />
  <img src="https://img.shields.io/badge/Hardhat-2.x-yellow?logo=hardhat" alt="Hardhat" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Network-Arbitrum%20Sepolia-blue" alt="Network" />
  <img src="https://img.shields.io/badge/ERC-7984-green" alt="ERC-7984" />
</p>

---

## The Problem

On-chain payroll is transparent by default. Every salary, every bonus, every payment amount is publicly visible to anyone with a block explorer. Companies can't use blockchain payroll without exposing compensation data to competitors, employees seeing each other's pay, or the entire world.

## The Solution

**Veilroll** wraps standard ERC-20 tokens into **ERC-7984 confidential tokens** using iExec's Nox Protocol. Salary amounts are encrypted on-chain as opaque `bytes32` handles — nobody watching the blockchain can see how much was paid. Only authorized parties (the employee, or an employer-approved auditor) can decrypt specific amounts.

### 🔑 Key Differentiator: Selective Auditor Disclosure

What makes Veilroll more than a basic encrypted transfer demo:

> The employer can grant an external auditor **read-only access** to specific payment handles via on-chain ACL. The auditor can decrypt individual salaries for compliance verification — without employees publicly revealing their compensation, and without the employer emailing a CSV.

This demonstrates the **core value proposition of confidential tokens**: privacy with selective, verifiable, on-chain disclosure.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   FRONTEND (Vite + React + ethers v6)        │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐   │
│  │ 🏢 Employer    │  │ 👤 Employee    │  │ 🔍 Auditor   │   │
│  │ - Wrap tokens  │  │ - Decrypt bal  │  │ - Decrypt    │   │
│  │ - Batch pay    │  │ - Unwrap ERC20 │  │   payments   │   │
│  │ - Grant audit  │  │                │  │ - Read-only  │   │
│  └───────┬────────┘  └───────┬────────┘  └──────────────┘   │
│          │     @iexec-nox/handle SDK      │                  │
└──────────┼───────────────────┼────────────────────────────────┘
           │                   │
           ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                 ARBITRUM SEPOLIA (Chain 421614)               │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐   │
│  │  MockERC20   │  │ ConfPayToken  │  │ PayrollManager  │   │
│  │  (test USDC) │  │ (ERC-7984     │  │ (bookkeeping +  │   │
│  │              │  │  wrapper)     │  │  auditor ACL)   │   │
│  └──────────────┘  └───────────────┘  └─────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  NOX PROTOCOL (iExec-managed infrastructure)         │    │
│  │  NoxCompute · Handle Gateway · Intel TDX TEE         │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Encryption Model

Nox uses **ECIES (Elliptic Curve Integrated Encryption Scheme) on secp256k1 + Intel TDX TEE** — not FHE. Encrypted Solidity types (`euint256`, `ebool`) are opaque 32-byte handles pointing to off-chain encrypted data managed by Nox infrastructure. Decryption requires ACL permission and is performed inside Intel TDX secure enclaves.

---

## Smart Contracts

### [`ConfPayToken.sol`](code/contracts/ConfPayToken.sol)
The core ERC-7984 confidential token. Wraps any ERC-20 into encrypted equivalents.
- Inherits `ERC20ToERC7984Wrapper` → `ERC7984` from `@iexec-nox/nox-confidential-contracts`
- `wrap()` — lock ERC-20, mint encrypted balance
- `confidentialTransfer()` — transfer encrypted amounts between wallets
- `unwrap()` + `finalizeUnwrap()` — two-step conversion back to ERC-20 (TEE decryption required)

### [`PayrollManager.sol`](code/contracts/PayrollManager.sol)
Bookkeeping and auditor registry layer.
- `addEmployee()` / `removeEmployee()` — manage payroll roster
- `recordPayments()` — store payment handles after direct ConfPayToken transfers
- `grantAuditorAccess()` / `revokeAuditorAccess()` — manage auditor roster
- `getPaymentHandle()` / `getPaidEmployees()` — query payment records for auditor disclosure

### [`MockERC20.sol`](code/contracts/MockERC20.sol)
Standard ERC-20 test token with public `mint()` for demo purposes.

### Deployed Contracts (Arbitrum Sepolia)

| Contract | Address |
|----------|---------|
| MockERC20 | [`0x155b9eee80e9f89f0594953bb9B9554d8b653a00`](https://sepolia.arbiscan.io/address/0x155b9eee80e9f89f0594953bb9B9554d8b653a00) |
| ConfPayToken | [`0x08A1ABF57C949Db12848bE205498f492e9b5BBa6`](https://sepolia.arbiscan.io/address/0x08A1ABF57C949Db12848bE205498f492e9b5BBa6) |
| PayrollManager (v3) | [`0xe3A2240060e1f52D84d8acE41dBb908aF53B3825`](https://sepolia.arbiscan.io/address/0xe3A2240060e1f52D84d8acE41dBb908aF53B3825) |

---

## Payment Flow

```
1. Employer approves + wraps ERC-20 → encrypted ERC-7984 balance
2. Employer calls SDK.encryptInput() per employee → encrypted handle + proof
3. Employer calls ConfPayToken.confidentialTransfer() per employee
4. Employer calls PayrollManager.recordPayments() → stores handles for audit
5. [Optional] Employer calls NoxCompute.allow(handle, auditor) → grants auditor access
6. Employee calls SDK.decrypt(balanceHandle) → sees plaintext salary
7. Employee calls ConfPayToken.unwrap() → triggers TEE decryption (~15s)
8. Employee calls SDK.publicDecrypt() → gets proof from TEE
9. Employee calls ConfPayToken.finalizeUnwrap() → ERC-20 received
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MetaMask** browser extension
- **Arbitrum Sepolia ETH** — get from [iExec faucet](https://cdefi.iex.ec) or Arbitrum faucet

### Setup

```bash
# Clone the repository
git clone https://github.com/0xjaadu/veilroll.git
cd veilroll

# Install smart contract dependencies
cd code
cp .env.example .env
# Add your deployer private key to .env
npm install

# Install frontend dependencies
cd frontend
npm install
```

### Run the Frontend

```bash
cd code/frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and connect MetaMask to **Arbitrum Sepolia** (Chain ID: 421614).

### Deploy Contracts (Optional)

The contracts are already deployed on Arbitrum Sepolia. To redeploy:

```bash
cd code

# Edit .env with your private key
# PRIVATE_KEY=your_private_key_here

npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

---

## Frontend Pages

| Route | Role | Description |
|-------|------|-------------|
| `/` | All | Landing page with contract addresses and architecture overview |
| `/employer` | Employer | Wrap tokens, manage employees, batch pay, grant auditors |
| `/employee` | Employee | View encrypted balance, decrypt, unwrap to ERC-20 |
| `/auditor` | Auditor | Read-only view of disclosed payment handles with decrypt |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.28, Hardhat 2.x, OpenZeppelin 5.x |
| Confidential Layer | iExec Nox Protocol, ERC-7984, `@iexec-nox/nox-confidential-contracts` |
| Frontend | React 19, Vite 8, ethers.js 6, React Router 7 |
| Encryption SDK | `@iexec-nox/handle` (ECIES + Intel TDX TEE) |
| Network | Arbitrum Sepolia (Chain ID: 421614) |

---

## Demo Flow (2 minutes)

| Time | Scene | What Happens |
|------|-------|-------------|
| 0:00–0:10 | Hook | Problem statement: "Salary payments on-chain are public" |
| 0:10–0:40 | Wrap + Pay | Employer wraps 1000 mUSDC, pays 2 employees (500 + 300) with encrypted transfers |
| 0:40–1:05 | Unwrap | Employee decrypts balance, unwraps with ~15s real TEE decryption |
| 1:05–1:35 | Audit | Employer grants auditor → auditor decrypts both salaries (selective disclosure) |
| 1:35–2:00 | Close | Summary + repo link |

See [`submission/demo-script.md`](submission/demo-script.md) for the full scene-by-scene video script.

---

## Project Structure

```
veilroll/
├── code/
│   ├── contracts/          # Solidity smart contracts
│   │   ├── ConfPayToken.sol
│   │   ├── PayrollManager.sol
│   │   └── MockERC20.sol
│   ├── scripts/            # Hardhat deploy scripts
│   ├── frontend/           # Vite + React frontend
│   │   ├── src/
│   │   │   ├── pages/      # Employer, Employee, Auditor, Home
│   │   │   ├── components/ # Navbar, shared UI
│   │   │   ├── config/     # Contract ABIs + addresses
│   │   │   └── context/    # WalletContext (MetaMask integration)
│   │   └── package.json
│   ├── hardhat.config.js
│   └── package.json
├── deployments/            # Contract addresses per network
├── docs/                   # Architecture, protocol briefs, audit
├── submission/             # Demo script, feedback, assets
└── README.md
```

---

## Known Limitations

- **ACL Revocation**: Nox does not support retroactive ACL revocation. Previously-granted handles remain accessible even after auditor removal from the roster.
- **TEE Latency**: The unwrap flow requires ~15 seconds for Intel TDX TEE decryption. This is inherent to the Nox protocol, not a bug.
- **Local Testing**: Encrypted operations (`euint256`, `Nox.fromExternal()`) require the live Nox Handle Gateway. Unit tests cover only non-encrypted logic paths.

---

## Built For

**iExec VIBE Hackathon** — Confidential DeFi track

Built with [iExec Nox Protocol](https://protocol.iex.ec/) and [ERC-7984 Confidential Tokens](https://eips.ethereum.org/EIPS/eip-7984)

[@iEx_ec](https://twitter.com/iaboratory) · [@Chain_GPT](https://twitter.com/Chain_GPT)

---

## License

MIT
