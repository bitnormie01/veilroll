# Phase 1 Executor Report — Scaffold + Deploy Base Token

**Status:** ✅ COMPLETE
**Time spent:** ~45 min of 4h cap (remainder banked)
**Executor:** PM (self-executing per approved plan)

---

## Deployment Summary — Arbitrum Sepolia

| Item | Value |
|---|---|
| **Network** | Arbitrum Sepolia (chainId 421614) |
| **Deployer** | `0x31f4a2E4b4dF8c46c466076cbf56fb1037899198` |
| **MockERC20** | `0x155b9eee80e9f89f0594953bb9B9554d8b653a00` |
| **ConfPayToken** | `0x08A1ABF57C949Db12848bE205498f492e9b5BBa6` |
| **ERC-7984 (ERC-165)** | `supportsInterface(0x4958f2a4)` = **true** |

## Transaction Hashes (all verifiable on sepolia.arbiscan.io)

| Step | Tx Hash |
|---|---|
| MockERC20 deploy | `0x41647572830d234ede49a18e13d2e568dae959e93d7173bd7a0cbc80de0baf2a` |
| ConfPayToken deploy | `0xe7b3efe25b6c7ab79a887aef517f3316dfb65a91c97b77127559a4eaa5c6836e` |
| Mint 10000 mUSDC | `0x139ae0e34733fe32bc09151dc77ee5864631ff2262c51a9ab5999f13611fa9b1` |
| Approve | `0x940d1396e1522e501c19a592e324320b383b1969fdecc2c336bbf95df283b602` |
| **Wrap 1000 mUSDC → CPAY** | `0x8dd5b5ae3c96310a6ae66298a73f638cf9bb63fee1f8dc5d232fd87a750b4b32` |

## Wrap Roundtrip Proof

- **Wrapped amount:** 1000 mUSDC (1000 × 10^18 wei)
- **Confidential balance handle:** `0x0000066eee2301c7f96d155e665d43ccb8a27e76efd518e44436b170cd7bd034`
- **Handle is non-zero:** true
- **Remaining ERC-20 balance:** 9000.0 mUSDC (confirms tokens locked in wrapper)
- **Wrap block:** 263864923

## Acceptance Criteria Verification

- [x] `npx hardhat compile` succeeds — **27 Solidity files compiled, zero errors**
- [x] MockERC20 deployed on Arbitrum Sepolia — `0x155b9eee80e9f89f0594953bb9B9554d8b653a00`
- [x] ConfPayToken deployed on Arbitrum Sepolia — `0x08A1ABF57C949Db12848bE205498f492e9b5BBa6`
- [x] `wrap()` called successfully — `0x8dd5b5ae3c96310a6ae66298a73f638cf9bb63fee1f8dc5d232fd87a750b4b32`
- [x] All tx hashes verifiable on sepolia.arbiscan.io

## Technical Issues Resolved

1. **Hardhat 3 vs 2:** `npm install hardhat` pulled v3.4.2 which has incompatible config API (`defineConfig()`, ESM-only). Downgraded to `hardhat@2` with `@nomicfoundation/hardhat-toolbox@hh2`.

2. **Solidity diamond inheritance:** `ConfPayToken is ERC20ToERC7984Wrapper` requires explicitly calling `ERC7984("ConfPayToken", "CPAY", "")` in the constructor modifier list, even though `ERC7984` is an indirect base (via `ERC20ToERC7984Wrapper`). Without this, Solidity throws "No arguments passed to the base constructor."

3. **RPC socket error:** Default `https://sepolia-rollup.arbitrum.io/rpc` dropped connections (`UND_ERR_SOCKET`). Switched to `https://arbitrum-sepolia-rpc.publicnode.com` — resolved immediately.

4. **BLOCKER-002 confirmed:** `Nox.toEuint256()` reverts on local Hardhat network. All encrypted operations require Arbitrum Sepolia (Nox infrastructure). Local tests limited to non-encrypted logic.

## Files Created
| File | Status |
|---|---|
| `code/package.json` | ✅ |
| `code/hardhat.config.js` | ✅ |
| `code/contracts/MockERC20.sol` | ✅ |
| `code/contracts/ConfPayToken.sol` | ✅ |
| `code/scripts/deploy.js` | ✅ |
| `code/.env` | ✅ |
| `code/.env.example` | ✅ |
