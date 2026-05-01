# Phase 1 Executor Prompt — Scaffold + Deploy Base Token

**Phase:** 1
**Time cap:** 4 hours (hard)
**ERC standard touched:** YES — ERC-7984 (full compliance via inherited base)
**Hot-path AI check:** No AI in any contract code

---

## Objective

Deploy a wizard-generated ERC-7984 confidential token contract (ConfPayToken, wrapping a MockERC20) to Arbitrum Sepolia using Hardhat. Confirm a wrap roundtrip on-chain. Provide all tx hashes in the executor report.

## Ground Truth

- Read `docs/PROTOCOL_BRIEF.md` for ERC-7984 interface, Nox types, and encryption model (ECIES+TEE, NOT FHE).
- Read `docs/ARCHITECTURE.md` for contract layout and dependency list.
- ConfPayToken inherits `ERC20ToERC7984Wrapper` from `@iexec-nox/nox-confidential-contracts`.
- MockERC20 is a standard OpenZeppelin ERC-20 with public `mint()`.
- Solidity version: `^0.8.28`

## Steps

1. **Initialize Hardhat project** in `code/`
   - `npm init -y`
   - `npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox`
   - `npx hardhat init` (JavaScript project)
   - Configure `hardhat.config.js` with Arbitrum Sepolia network (chainId 421614, RPC `https://sepolia-rollup.arbitrum.io/rpc`)

2. **Install iExec + OpenZeppelin packages**
   - `npm install @iexec-nox/nox-protocol-contracts @iexec-nox/nox-confidential-contracts @openzeppelin/contracts`

3. **Create contracts**
   - `contracts/MockERC20.sol` — ERC-20 with public `mint(address, uint256)`
   - `contracts/ConfPayToken.sol` — Inherits `ERC20ToERC7984Wrapper`. Constructor takes `IERC20` address. Wizard-generated pattern, UNMODIFIED.

4. **Compile** — `npx hardhat compile` must succeed with zero errors.

5. **Create deploy script** — `scripts/deploy.js`
   - Deploy MockERC20
   - Deploy ConfPayToken(MockERC20.address)
   - Mint 10000 MockERC20 to deployer
   - Approve ConfPayToken to spend MockERC20
   - Call `wrap(deployer, 1000)` on ConfPayToken
   - Log all tx hashes and contract addresses

6. **Deploy to Arbitrum Sepolia** — `npx hardhat run scripts/deploy.js --network arbitrumSepolia`
   - Requires PRIVATE_KEY in environment or hardhat config
   - Requires Arbitrum Sepolia ETH (faucet: bridge from Sepolia)

7. **Write executor report** — `reports/phase-1-executor.md`
   - All contract addresses
   - All tx hashes (deploy MockERC20, deploy ConfPayToken, mint, approve, wrap)
   - Compilation output
   - Any issues encountered + resolution

## Acceptance Criteria (binary)
- [ ] `npx hardhat compile` succeeds
- [ ] MockERC20 deployed on Arbitrum Sepolia (tx hash)
- [ ] ConfPayToken deployed on Arbitrum Sepolia (tx hash)
- [ ] `wrap()` called successfully (tx hash)
- [ ] All tx hashes verifiable on sepolia.arbiscan.io

## Files to Create/Modify
- `code/package.json`
- `code/hardhat.config.js`
- `code/contracts/MockERC20.sol`
- `code/contracts/ConfPayToken.sol`
- `code/scripts/deploy.js`
- `reports/phase-1-executor.md`

## Constraints
- Do NOT modify the ERC7984 base contract code
- Do NOT add any AI/LLM calls in contracts
- Do NOT use Foundry
- Use only `@iexec-nox/nox-confidential-contracts` for ERC-7984 implementation — do NOT write custom ERC-7984 from scratch
