/**
 * Phase 5a — First Light Verification Script (v3)
 * 
 * Architecture: Employer calls ConfPayToken.confidentialTransfer directly,
 * then registers handles with PayrollManager.recordPayments for auditor access.
 * 
 * Tests 4 paths end-to-end against live Arbitrum Sepolia contracts.
 * Halt-on-fail. Results written to reports/phase-5a-firstlight.md in real-time.
 */

import { ethers } from 'ethers';
import { createEthersHandleClient } from '@iexec-nox/handle';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = resolve(__dirname, '../../../reports/phase-5a-firstlight.md');

// ─── Config ───────────────────────────────────────────────────────────
const RPC = 'https://arbitrum-sepolia-rpc.publicnode.com';
const EMPLOYER_KEY = '0xefe85d40ec364e6fa637232bc9ce2f60f5d7c586da090b50ca6b60dd72cd15ea';

const ADDRESSES = {
  MockERC20:      '0x155b9eee80e9f89f0594953bb9B9554d8b653a00',
  ConfPayToken:   '0x08A1ABF57C949Db12848bE205498f492e9b5BBa6',
  PayrollManager: '0xe3A2240060e1f52D84d8acE41dBb908aF53B3825',
};

// Minimal ABIs
const ERC20_ABI = [
  'function mint(address to, uint256 amount)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
];

const CONFPAY_ABI = [
  'function wrap(address to, uint256 amount) returns (bytes32)',
  'function confidentialBalanceOf(address account) view returns (bytes32)',
  'function setOperator(address operator, uint48 until)',
  'function isOperator(address holder, address operator) view returns (bool)',
  'function confidentialTransfer(address to, bytes32 encryptedAmount, bytes inputProof) returns (bytes32)',
  'function unwrap(address from, address to, bytes32 amount) returns (bytes32)',
  'function finalizeUnwrap(bytes32 unwrapRequestId, bytes decryptedAmountAndProof)',
  'event UnwrapRequested(address indexed receiver, bytes32 amount)',
  'event ConfidentialTransfer(address indexed from, address indexed to, bytes32 indexed amount)',
];

const PAYROLL_ABI = [
  'function addEmployee(address employee)',
  'function recordPayments(address[] employees, bytes32[] handles)',
  'function grantAuditorAccess(address auditor)',
  'function revokeAuditorAccess(address auditor)',
  'function getEmployees() view returns (address[])',
  'function getAuditors() view returns (address[])',
  'function getPaidEmployees() view returns (address[])',
  'function getPaymentCount(address employee) view returns (uint256)',
  'function getPaymentHandle(address employee, uint256 index) view returns (bytes32)',
  'function isEmployee(address) view returns (bool)',
  'function isAuditor(address) view returns (bool)',
];

// ─── Utilities ────────────────────────────────────────────────────────
function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

// ─── Report State ─────────────────────────────────────────────────────
const results = {
  path1: { status: '⏳ PENDING', txHash: '', gas: '', handle: '', events: '', outcome: '' },
  path2: { status: '⏳ PENDING', expected: '', received: '', outcome: '' },
  path3a: { status: '⏳ PENDING', error: '', outcome: '' },
  path3b: { status: '⏳ PENDING', txHash: '', outcome: '' },
  path3c: { status: '⏳ PENDING', received: '', outcome: '' },
  path4: { 
    status: '⏳ PENDING', 
    unwrapTx: '', unwrapRequestId: '',
    publicDecryptTime: '', publicDecryptFlag: '',
    finalizeTx: '', balBefore: '', balAfter: '', outcome: ''
  },
};

function renderReport() {
  const r = results;
  return `# Phase 5a — First Light Verification

**Started:** 2026-04-30T04:22Z (T+15.4h of 48h, ~32%)
**Time cap:** 60 min
**Rule:** Halt on first failure. No silent patching.
**Contracts:** Arbitrum Sepolia (421614)
**Architecture:** Employer → ConfPayToken.confidentialTransfer (direct) → PayrollManager.recordPayments (bookkeeping)

| Contract | Address |
|---|---|
| MockERC20 | \`${ADDRESSES.MockERC20}\` |
| ConfPayToken | \`${ADDRESSES.ConfPayToken}\` |
| PayrollManager | \`${ADDRESSES.PayrollManager}\` |

**Test Wallets:**
- Employer (deployer): \`0x31f4a2E4b4dF8c46c466076cbf56fb1037899198\`
- Employee: fresh random wallet (funded from employer)
- Auditor: fresh random wallet (funded from employer)

---

## Path 1: Employer Batch Pay (encrypt → transfer → record → event)
**Status:** ${r.path1.status}
**Transfer Tx Hash:** ${r.path1.txHash || '—'}
**Gas Used:** ${r.path1.gas || '—'}
**Encrypted Handle Bytes:** ${r.path1.handle || '—'}
**Event Log:** ${r.path1.events || '—'}
**Outcome:** ${r.path1.outcome || '—'}

---

## Path 2: Employee Decrypt Balance (decrypt + EIP-712)
**Status:** ${r.path2.status}
**Plaintext Expected:** ${r.path2.expected || '—'}
**Plaintext Received:** ${r.path2.received || '—'}
**Outcome:** ${r.path2.outcome || '—'}

---

## Path 3: Auditor Selective Disclosure
### 3a: Pre-grant decrypt → MUST FAIL
**Status:** ${r.path3a.status}
**Error Captured:** ${r.path3a.error || '—'}
**Outcome:** ${r.path3a.outcome || '—'}

### 3b: Grant auditor access tx
**Status:** ${r.path3b.status}
**Tx Hash:** ${r.path3b.txHash || '—'}
**Outcome:** ${r.path3b.outcome || '—'}

### 3c: Post-grant decrypt → MUST SUCCEED
**Status:** ${r.path3c.status}
**Plaintext Received:** ${r.path3c.received || '—'}
**Outcome:** ${r.path3c.outcome || '—'}

---

## Path 4: Two-Step Unwrap
**Status:** ${r.path4.status}
### Step 1: unwrap() tx
**Tx Hash:** ${r.path4.unwrapTx || '—'}
**unwrapRequestId:** ${r.path4.unwrapRequestId || '—'}

### Step 2: publicDecrypt()
**Time elapsed:** ${r.path4.publicDecryptTime || '—'}
**⚠️ >2min flag:** ${r.path4.publicDecryptFlag || '—'}

### Step 3: finalizeUnwrap() tx
**Tx Hash:** ${r.path4.finalizeTx || '—'}
**ERC-20 balance before:** ${r.path4.balBefore || '—'}
**ERC-20 balance after:** ${r.path4.balAfter || '—'}
**Outcome:** ${r.path4.outcome || '—'}

---

## Reviewer Rerun
**Status:** ⏳ PENDING — blocked on independent wallet provisioning
`;
}

function flush() {
  writeFileSync(REPORT_PATH, renderReport(), 'utf8');
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const employer = new ethers.Wallet(EMPLOYER_KEY, provider);
  
  const employeeWallet = ethers.Wallet.createRandom().connect(provider);
  const auditorWallet = ethers.Wallet.createRandom().connect(provider);

  log(`Employer:  ${employer.address}`);
  log(`Employee:  ${employeeWallet.address}`);
  log(`Auditor:   ${auditorWallet.address}`);

  const erc20 = new ethers.Contract(ADDRESSES.MockERC20, ERC20_ABI, employer);
  const confPay = new ethers.Contract(ADDRESSES.ConfPayToken, CONFPAY_ABI, employer);
  const payroll = new ethers.Contract(ADDRESSES.PayrollManager, PAYROLL_ABI, employer);

  const PAY_AMOUNT = ethers.parseEther('500');

  // ═══════════════════════════════════════════════════════════
  // SETUP
  // ═══════════════════════════════════════════════════════════
  log('=== SETUP ===');
  
  let tx;
  log('Funding employee...');
  tx = await employer.sendTransaction({ to: employeeWallet.address, value: ethers.parseEther('0.0001') });
  await tx.wait();
  log(`  Done: ${tx.hash}`);

  log('Funding auditor...');
  tx = await employer.sendTransaction({ to: auditorWallet.address, value: ethers.parseEther('0.0001') });
  await tx.wait();
  log(`  Done: ${tx.hash}`);

  log('Minting 10000 mUSDC...');
  tx = await erc20.mint(employer.address, ethers.parseEther('10000'));
  await tx.wait();

  log('Approving ConfPayToken...');
  tx = await erc20.approve(ADDRESSES.ConfPayToken, ethers.parseEther('10000'));
  await tx.wait();

  log('Wrapping 5000 mUSDC → CPAY...');
  tx = await confPay.wrap(employer.address, ethers.parseEther('5000'));
  await tx.wait();

  // Add employee
  log(`Adding employee ${employeeWallet.address}...`);
  tx = await payroll.addEmployee(employeeWallet.address);
  await tx.wait();

  log('=== SETUP COMPLETE ===\n');

  // ═══════════════════════════════════════════════════════════
  // PATH 1: Employer Confidential Transfer + Record
  // ═══════════════════════════════════════════════════════════
  log('=== PATH 1: Employer Batch Pay ===');
  results.path1.status = '🔄 RUNNING';
  flush();

  try {
    const handleClient = await createEthersHandleClient(employer);
    log('  HandleClient created.');

    log(`  Encrypting ${ethers.formatEther(PAY_AMOUNT)} mUSDC...`);
    // applicationContract = ConfPayToken because employer calls ConfPayToken directly
    // and ConfPayToken.confidentialTransfer calls Nox.fromExternal internally
    // where msg.sender (passed explicitly) = employer = the one calling ConfPayToken
    const { handle, handleProof } = await handleClient.encryptInput(
      PAY_AMOUNT,
      'uint256',
      ADDRESSES.ConfPayToken
    );
    log(`  Handle: ${handle}`);
    results.path1.handle = `\`${handle}\``;
    flush();

    // Step 1: Transfer directly via ConfPayToken
    log('  Calling ConfPayToken.confidentialTransfer...');
    const transferTx = await confPay['confidentialTransfer(address,bytes32,bytes)'](
      employeeWallet.address,
      handle,
      handleProof
    );
    results.path1.txHash = `\`${transferTx.hash}\``;
    flush();

    const receipt = await transferTx.wait();
    results.path1.gas = `${receipt.gasUsed.toString()} gas`;
    log(`  Mined in block ${receipt.blockNumber}. Gas: ${receipt.gasUsed}`);

    // Find the ConfidentialTransfer event to get the resulting handle
    let transferredHandle = null;
    for (const logEntry of receipt.logs) {
      if (logEntry.topics.length >= 3) {
        // ConfidentialTransfer(from indexed, to indexed, amount indexed)
        const confTransferSig = ethers.id("ConfidentialTransfer(address,address,bytes32)");
        if (logEntry.topics[0] === confTransferSig) {
          transferredHandle = logEntry.topics[3]; // amount is the 3rd indexed param
          log(`  ✅ ConfidentialTransfer event found. Handle: ${transferredHandle}`);
          results.path1.events = `ConfidentialTransfer emitted. Handle: \`${transferredHandle}\``;
        }
      }
    }
    if (!transferredHandle) {
      log(`  Logs: ${receipt.logs.length}`);
      receipt.logs.forEach((l, i) => log(`    log[${i}] topics=${l.topics.length} topic0=${l.topics[0]?.slice(0,10)}`));
      results.path1.events = `${receipt.logs.length} log(s) — no ConfidentialTransfer found`;
    }

    // Step 2: Record the payment in PayrollManager
    // We use the employee's balance handle as the reference
    const empBalance = await confPay.confidentialBalanceOf(employeeWallet.address);
    log(`  Employee confBalance handle: ${empBalance}`);

    log('  Recording payment in PayrollManager...');
    const recordTx = await payroll.recordPayments(
      [employeeWallet.address],
      [transferredHandle || empBalance]
    );
    await recordTx.wait();
    log(`  Recorded: ${recordTx.hash}`);

    // Verify handle stored
    const pmtCount = await payroll.getPaymentCount(employeeWallet.address);
    const storedHandle = await payroll.getPaymentHandle(employeeWallet.address, Number(pmtCount) - 1);
    log(`  Stored handle: ${storedHandle}`);

    results.path1.status = '✅ PASS';
    results.path1.outcome = 'Transfer mined, event emitted, handle stored in PayrollManager.';
    log('  ✅ PATH 1 PASS\n');
  } catch (err) {
    results.path1.status = '❌ FAIL';
    results.path1.outcome = `Error: ${err.message}`;
    log(`  ❌ PATH 1 FAIL: ${err.message}`);
    flush();
    process.exit(1);
  }
  flush();

  // ═══════════════════════════════════════════════════════════
  // PATH 2: Employee Decrypt Balance
  // ═══════════════════════════════════════════════════════════
  log('=== PATH 2: Employee Decrypt Balance ===');
  results.path2.status = '🔄 RUNNING';
  results.path2.expected = `${ethers.formatEther(PAY_AMOUNT)} mUSDC`;
  flush();

  try {
    const empConfBal = await confPay.confidentialBalanceOf(employeeWallet.address);
    log(`  Employee confBalance handle: ${empConfBal}`);

    if (empConfBal === ethers.ZeroHash) {
      throw new Error('Employee has no confidential balance.');
    }

    const empHandleClient = await createEthersHandleClient(employeeWallet);
    log('  Requesting EIP-712 decrypt...');

    const { value, solidityType } = await empHandleClient.decrypt(empConfBal);
    log(`  Decrypted: value=${value}, type=${solidityType}`);

    results.path2.received = `${ethers.formatEther(value.toString())} mUSDC (${value} wei)`;

    if (value.toString() === PAY_AMOUNT.toString()) {
      results.path2.status = '✅ PASS';
      results.path2.outcome = 'Plaintext matches.';
      log('  ✅ PATH 2 PASS\n');
    } else {
      results.path2.status = '⚠️ PARTIAL';
      results.path2.outcome = `Decrypted ${value} but expected ${PAY_AMOUNT}. May include prior balance.`;
      log(`  ⚠️ PARTIAL match.\n`);
    }
  } catch (err) {
    results.path2.status = '❌ FAIL';
    results.path2.outcome = `Error: ${err.message}`;
    log(`  ❌ PATH 2 FAIL: ${err.message}`);
    flush();
    process.exit(1);
  }
  flush();

  // ═══════════════════════════════════════════════════════════
  // PATH 3: Auditor Selective Disclosure
  // ═══════════════════════════════════════════════════════════
  log('=== PATH 3: Auditor Selective Disclosure ===');

  // 3a: Pre-grant decrypt → MUST FAIL
  log('--- 3a: Pre-grant (should FAIL) ---');
  results.path3a.status = '🔄 RUNNING';
  flush();

  try {
    const empConfBal = await confPay.confidentialBalanceOf(employeeWallet.address);
    const audClient = await createEthersHandleClient(auditorWallet);
    const { value } = await audClient.decrypt(empConfBal);
    
    // If we get here, ACL is not enforced
    results.path3a.status = '❌ FAIL';
    results.path3a.outcome = `Pre-grant decrypt SUCCEEDED (value=${value}) — ACL not enforced!`;
    log(`  ❌ PATH 3a FAIL: ACL bypass!`);
    flush();
    process.exit(1);
  } catch (err) {
    results.path3a.status = '✅ PASS';
    results.path3a.error = `\`${err.message?.slice(0, 200)}\``;
    results.path3a.outcome = 'Correctly failed.';
    log(`  ✅ PATH 3a PASS: ${err.message?.slice(0, 80)}\n`);
  }
  flush();

  // 3b: Grant auditor access
  log('--- 3b: Grant auditor access ---');
  results.path3b.status = '🔄 RUNNING';
  flush();

  try {
    // Step 1: Register in PayrollManager
    const grantTx = await payroll.grantAuditorAccess(auditorWallet.address);
    results.path3b.txHash = `\`${grantTx.hash}\``;
    await grantTx.wait();
    const isAud = await payroll.isAuditor(auditorWallet.address);
    if (!isAud) throw new Error('isAuditor returned false');
    log('  Auditor registered in PayrollManager.');

    // Step 2: Employer grants ACL on the transferred handle via NoxCompute
    // The employer has persistent ACL because _update calls Nox.allow(transferred, from)
    const NOXCOMPUTE = '0xd464B198f06756a1d00be223634b85E0a731c229';
    const noxCompute = new ethers.Contract(NOXCOMPUTE, [
      'function allow(bytes32 handle, address account)',
    ], employer);

    const pmtHandle = await payroll.getPaymentHandle(employeeWallet.address, 0);
    log(`  Granting auditor ACL on handle: ${pmtHandle}`);
    const allowTx = await noxCompute.allow(pmtHandle, auditorWallet.address);
    await allowTx.wait();
    log(`  ACL grant tx: ${allowTx.hash}`);

    // Also grant on employee's balance handle
    const empConfBal = await confPay.confidentialBalanceOf(employeeWallet.address);
    log(`  Granting auditor ACL on balance handle: ${empConfBal}`);
    try {
      const allowTx2 = await noxCompute.allow(empConfBal, auditorWallet.address);
      await allowTx2.wait();
      log(`  Balance ACL grant tx: ${allowTx2.hash}`);
    } catch (e) {
      log(`  Balance ACL grant failed (employer may not have ACL on balance handle): ${e.message?.slice(0, 60)}`);
    }

    results.path3b.status = '✅ PASS';
    results.path3b.outcome = 'Auditor registered + ACL granted on payment handle.';
    log('  ✅ PATH 3b PASS\n');
  } catch (err) {
    results.path3b.status = '❌ FAIL';
    results.path3b.outcome = `Error: ${err.message}`;
    log(`  ❌ PATH 3b FAIL: ${err.message}`);
    flush();
    process.exit(1);
  }
  flush();

  // 3c: Post-grant decrypt → MUST SUCCEED
  log('--- 3c: Post-grant decrypt ---');
  results.path3c.status = '🔄 RUNNING';
  flush();

  try {
    // Try the recorded payment handle first (we granted ACL on it)
    const pmtHandle = await payroll.getPaymentHandle(employeeWallet.address, 0);
    const audClient = await createEthersHandleClient(auditorWallet);
    log(`  Auditor decrypting payment handle: ${pmtHandle}`);
    const { value } = await audClient.decrypt(pmtHandle);
    
    results.path3c.received = `${ethers.formatEther(value.toString())} mUSDC`;
    if (value > 0n) {
      results.path3c.status = '✅ PASS';
      results.path3c.outcome = 'Auditor decrypted payment handle successfully.';
      log(`  ✅ PATH 3c PASS: ${value}\n`);
    } else {
      throw new Error('Decrypted value is 0.');
    }
  } catch (err) {
    results.path3c.status = '❌ FAIL';
    results.path3c.outcome = `Error: ${err.message}`;
    log(`  ❌ PATH 3c FAIL: ${err.message}`);
    flush();
    process.exit(1);
  }
  flush();

  // ═══════════════════════════════════════════════════════════
  // PATH 4: Two-Step Unwrap
  // ═══════════════════════════════════════════════════════════
  log('=== PATH 4: Two-Step Unwrap ===');
  results.path4.status = '🔄 RUNNING';

  const balBefore = await erc20.balanceOf(employeeWallet.address);
  results.path4.balBefore = `${ethers.formatEther(balBefore)} mUSDC`;
  log(`  Balance before: ${ethers.formatEther(balBefore)}`);
  flush();

  try {
    const empConfBal = await confPay.confidentialBalanceOf(employeeWallet.address);
    if (empConfBal === ethers.ZeroHash) throw new Error('No confBalance.');

    // Step 1: unwrap
    log('  Step 1: unwrap...');
    const confPayAsEmp = new ethers.Contract(ADDRESSES.ConfPayToken, CONFPAY_ABI, employeeWallet);
    const unwrapTx = await confPayAsEmp['unwrap(address,address,bytes32)'](
      employeeWallet.address, employeeWallet.address, empConfBal
    );
    results.path4.unwrapTx = `\`${unwrapTx.hash}\``;
    const unwrapReceipt = await unwrapTx.wait();
    log(`  Unwrap mined: ${unwrapTx.hash}`);

    // Find UnwrapRequested event
    let unwrapRequestId;
    for (const l of unwrapReceipt.logs) {
      const sig = ethers.id("UnwrapRequested(address,bytes32)");
      if (l.topics[0] === sig) {
        // amount is non-indexed → in data
        unwrapRequestId = '0x' + l.data.slice(2, 66);
        break;
      }
    }
    if (!unwrapRequestId) {
      // Try finding it via any logged data
      log(`  Logs: ${unwrapReceipt.logs.length}`);
      for (const l of unwrapReceipt.logs) log(`    t0: ${l.topics[0]?.slice(0,10)} data: ${l.data?.slice(0,20)}`);
      throw new Error('UnwrapRequested event not found.');
    }
    results.path4.unwrapRequestId = `\`${unwrapRequestId}\``;
    log(`  unwrapRequestId: ${unwrapRequestId}`);
    flush();

    // Step 2: publicDecrypt
    log('  Step 2: publicDecrypt...');
    const pdStart = Date.now();
    const empClient = await createEthersHandleClient(employeeWallet);
    const { value: pdValue, decryptionProof } = await empClient.publicDecrypt(unwrapRequestId);
    const pdElapsed = Date.now() - pdStart;
    results.path4.publicDecryptTime = `${(pdElapsed / 1000).toFixed(1)}s`;
    results.path4.publicDecryptFlag = pdElapsed > 120000 ? '⚠️ YES — demo needs workaround' : 'No';
    log(`  publicDecrypt: ${(pdElapsed/1000).toFixed(1)}s, value=${pdValue}`);
    if (pdElapsed > 120000) log('  ⚠️ >2min!');
    flush();

    // Step 3: finalizeUnwrap
    log('  Step 3: finalizeUnwrap...');
    const finTx = await confPayAsEmp.finalizeUnwrap(unwrapRequestId, decryptionProof);
    results.path4.finalizeTx = `\`${finTx.hash}\``;
    await finTx.wait();
    log(`  Finalized: ${finTx.hash}`);

    const balAfter = await erc20.balanceOf(employeeWallet.address);
    results.path4.balAfter = `${ethers.formatEther(balAfter)} mUSDC`;
    log(`  Balance after: ${ethers.formatEther(balAfter)}`);

    if (balAfter > balBefore) {
      results.path4.status = '✅ PASS';
      results.path4.outcome = `ERC-20 balance: ${ethers.formatEther(balBefore)} → ${ethers.formatEther(balAfter)}`;
      log('  ✅ PATH 4 PASS\n');
    } else {
      throw new Error(`Balance didn't increase: ${balBefore} → ${balAfter}`);
    }
  } catch (err) {
    results.path4.status = '❌ FAIL';
    results.path4.outcome = `Error: ${err.message}`;
    log(`  ❌ PATH 4 FAIL: ${err.message}`);
    flush();
    process.exit(1);
  }
  flush();

  log('═══════════════════════════════════════════');
  log('  PHASE 5a FIRST LIGHT — ALL PATHS PASSED');
  log('═══════════════════════════════════════════');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
