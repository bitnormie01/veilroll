/**
 * Flag 3 — Unwrap latency sampling (3 additional runs)
 * Adds 10s initial wait after unwrap (Nox Gateway needs time to process allowPublicDecryption).
 * Then polls publicDecrypt every 3s.
 */
import { ethers } from 'ethers';
import { createEthersHandleClient } from '@iexec-nox/handle';

const RPC = 'https://arbitrum-sepolia-rpc.publicnode.com';
const EMPLOYER_KEY = '0xefe85d40ec364e6fa637232bc9ce2f60f5d7c586da090b50ca6b60dd72cd15ea';
const CONFPAY = '0x08A1ABF57C949Db12848bE205498f492e9b5BBa6';
const MOCKERC20 = '0x155b9eee80e9f89f0594953bb9B9554d8b653a00';

const ERC20_ABI = [
  'function mint(address to, uint256 amount)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
];
const CONFPAY_ABI = [
  'function wrap(address to, uint256 amount) returns (bytes32)',
  'function confidentialBalanceOf(address account) view returns (bytes32)',
  'function confidentialTransfer(address to, bytes32 encryptedAmount, bytes inputProof) returns (bytes32)',
  'function unwrap(address from, address to, bytes32 amount) returns (bytes32)',
  'function finalizeUnwrap(bytes32 unwrapRequestId, bytes decryptedAmountAndProof)',
];

const RUNS = 3;
const PAY_AMOUNT = ethers.parseEther('50');
const latencies = [];

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Poll publicDecrypt — wait 10s, then retry every 3s up to 120s total */
async function timedPublicDecrypt(handleClient, requestId) {
  const start = Date.now();
  log(`    Waiting 10s for Gateway to process allowPublicDecryption...`);
  await sleep(10000);
  
  const maxTime = 120000; // 2 min total
  let attempt = 0;
  while (Date.now() - start < maxTime) {
    attempt++;
    try {
      const result = await handleClient.publicDecrypt(requestId);
      const elapsed = Date.now() - start;
      return { ...result, elapsed, attempts: attempt };
    } catch (e) {
      if (e.message?.includes('does not exist or is not publicly decryptable')) {
        log(`    Attempt ${attempt}: not ready (${((Date.now() - start) / 1000).toFixed(1)}s elapsed), retrying in 3s...`);
        await sleep(3000);
        continue;
      }
      throw e;
    }
  }
  const elapsed = Date.now() - start;
  return { elapsed, attempts: attempt, timedOut: true };
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC, undefined, { staticNetwork: true, batchMaxCount: 1 });
  await provider.getNetwork();
  const employer = new ethers.Wallet(EMPLOYER_KEY, provider);
  const erc20 = new ethers.Contract(MOCKERC20, ERC20_ABI, employer);
  const confPay = new ethers.Contract(CONFPAY, CONFPAY_ABI, employer);

  log(`Employer: ${employer.address}`);
  log(`Running ${RUNS} unwrap latency samples...\n`);

  // Pre-mint and wrap
  log('Pre-minting...');
  let tx = await erc20.mint(employer.address, ethers.parseEther('500'));
  await tx.wait();
  tx = await erc20.approve(CONFPAY, ethers.parseEther('500'));
  await tx.wait();
  tx = await confPay.wrap(employer.address, ethers.parseEther('500'));
  await tx.wait();
  log('Pre-wrap done.\n');

  for (let run = 1; run <= RUNS; run++) {
    log(`=== RUN ${run}/${RUNS} ===`);
    await sleep(3000);

    const emp = ethers.Wallet.createRandom().connect(provider);
    log(`  Employee: ${emp.address}`);

    tx = await employer.sendTransaction({ to: emp.address, value: ethers.parseEther('0.00003') });
    await tx.wait();
    await sleep(1000);

    const hc = await createEthersHandleClient(employer);
    const { handle, handleProof } = await hc.encryptInput(PAY_AMOUNT, 'uint256', CONFPAY);
    tx = await confPay['confidentialTransfer(address,bytes32,bytes)'](emp.address, handle, handleProof);
    await tx.wait();
    log(`  Transferred ${ethers.formatEther(PAY_AMOUNT)} CPAY`);
    await sleep(1000);

    const empConfBal = await confPay.confidentialBalanceOf(emp.address);
    const empConfPay = new ethers.Contract(CONFPAY, CONFPAY_ABI, emp);
    const unwrapTx = await empConfPay['unwrap(address,address,bytes32)'](emp.address, emp.address, empConfBal);
    const unwrapReceipt = await unwrapTx.wait();
    log(`  Unwrap mined: ${unwrapTx.hash}`);

    // Parse requestId from UnwrapRequested event
    let requestId;
    const unwrapSig = ethers.id("UnwrapRequested(address,bytes32)");
    for (const l of unwrapReceipt.logs) {
      if (l.topics[0] === unwrapSig) {
        requestId = '0x' + l.data.slice(2, 66);
        break;
      }
    }
    if (!requestId) {
      // Fallback: try any log with data
      for (const l of unwrapReceipt.logs) {
        if (l.data && l.data.length >= 66) {
          requestId = '0x' + l.data.slice(2, 66);
          break;
        }
      }
    }
    if (!requestId) { log('  ❌ No requestId found'); continue; }
    log(`  RequestId: ${requestId}`);

    // publicDecrypt with extended polling
    const empHc = await createEthersHandleClient(emp);
    const result = await timedPublicDecrypt(empHc, requestId);
    
    if (result.timedOut) {
      log(`  ⚠️ TIMED OUT after ${(result.elapsed / 1000).toFixed(1)}s (${result.attempts} attempts)`);
      latencies.push(result.elapsed);
    } else {
      latencies.push(result.elapsed);
      log(`  publicDecrypt: ${(result.elapsed / 1000).toFixed(2)}s (value=${result.value}, attempts=${result.attempts})`);

      // Finalize
      try {
        const finTx = await empConfPay.finalizeUnwrap(requestId, result.decryptionProof);
        await finTx.wait();
        const bal = await erc20.balanceOf(emp.address);
        log(`  Finalized. ERC-20: ${ethers.formatEther(bal)}`);
      } catch (e) {
        log(`  Finalize failed: ${e.message?.slice(0, 80)}`);
      }
    }
    log('');
  }

  // Summary
  log('═══════════════════════════════════════════');
  log('  LATENCY SUMMARY (publicDecrypt)');
  log('═══════════════════════════════════════════');
  const allLatencies = [900, ...latencies]; // Run 0 = 0.9s from firstlight
  allLatencies.forEach((ms, i) => log(`  Run ${i} (${i === 0 ? 'firstlight' : `latency-${i}`}): ${(ms / 1000).toFixed(2)}s${ms >= 120000 ? ' ⚠️ TIMEOUT' : ''}`));
  const successLatencies = allLatencies.filter(l => l < 120000);
  const timeouts = allLatencies.filter(l => l >= 120000).length;
  if (successLatencies.length > 0) {
    const avg = successLatencies.reduce((a, b) => a + b, 0) / successLatencies.length;
    const max = Math.max(...successLatencies);
    const min = Math.min(...successLatencies);
    log(`  Successful: Mean=${(avg / 1000).toFixed(2)}s | Min=${(min / 1000).toFixed(2)}s | Max=${(max / 1000).toFixed(2)}s`);
  }
  if (timeouts > 0) {
    log(`  ⚠️ ${timeouts}/${allLatencies.length} runs timed out (>2min)`);
    log('  RECOMMENDATION: Demo recording must include "Decrypting..." UI state');
    log('  RECOMMENDATION: Pre-warm the unwrap before hitting record, or cut to next scene');
  } else {
    log('  ✅ All runs completed — safe for live demo');
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
