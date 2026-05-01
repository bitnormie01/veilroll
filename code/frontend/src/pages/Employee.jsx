import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { CONTRACTS, EXPLORER_URL } from '../config/contracts';
import { createEthersHandleClient } from '@iexec-nox/handle';

// Fee overrides for Arbitrum Sepolia — prevents MetaMask fee estimation issues
const TX_OVERRIDES = {
  maxFeePerGas: 500_000_000n,        // 0.5 gwei
  maxPriorityFeePerGas: 100_000_000n, // 0.1 gwei
};

export default function Employee() {
  const { account, signer, isCorrectChain, getContract, getReadContract, connect } = useWallet();

  const [confBalance, setConfBalance] = useState(null);
  const [decryptedBalance, setDecryptedBalance] = useState(null);
  const [erc20Balance, setErc20Balance] = useState(null);
  const [isEmployed, setIsEmployed] = useState(null);
  const [paymentCount, setPaymentCount] = useState(0);
  const [paymentHandles, setPaymentHandles] = useState([]);
  const [decryptedPayments, setDecryptedPayments] = useState({});
  const [loading, setLoading] = useState({});
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const setLoadingState = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  const fetchData = useCallback(async () => {
    if (!account) return;
    try {
      const confPay = getReadContract('ConfPayToken');
      const payroll = getReadContract('PayrollManager');
      const erc20 = getReadContract('MockERC20');

      const [confBal, employed, erc20Bal, pmtCount] = await Promise.all([
        confPay.confidentialBalanceOf(account),
        payroll.isEmployee(account),
        erc20.balanceOf(account),
        payroll.getPaymentCount(account),
      ]);

      setConfBalance(confBal.toString());
      setDecryptedBalance(null); // Reset on fetch
      setIsEmployed(employed);
      setErc20Balance(ethers.formatEther(erc20Bal));
      setPaymentCount(Number(pmtCount));

      // Fetch payment handles
      const handles = [];
      for (let i = 0; i < Number(pmtCount); i++) {
        const handle = await payroll.getPaymentHandle(account, i);
        handles.push(handle.toString());
      }
      setPaymentHandles(handles);
    } catch (err) {
      console.error('fetchData error:', err);
    }
  }, [account, getReadContract]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Decrypt Confidential Balance
  const handleDecryptBalance = async () => {
    if (!confBalance || confBalance === '0') return;
    setLoadingState('decryptBal', true);
    setError(null);
    try {
      const handleClient = await createEthersHandleClient(signer);
      const { value } = await handleClient.decrypt(confBalance);
      setDecryptedBalance(ethers.formatEther(value.toString()));
    } catch (err) {
      setError('Decryption failed: ' + (err.reason || err.message));
    }
    setLoadingState('decryptBal', false);
  };

  // Decrypt Specific Payment
  const handleDecryptPayment = async (handle, index) => {
    setLoadingState(`decrypt_${index}`, true);
    setError(null);
    try {
      const handleClient = await createEthersHandleClient(signer);
      const { value } = await handleClient.decrypt(handle);
      setDecryptedPayments(prev => ({ ...prev, [index]: ethers.formatEther(value.toString()) }));
    } catch (err) {
      setError(`Decryption for Payment #${index + 1} failed: ` + (err.reason || err.message));
    }
    setLoadingState(`decrypt_${index}`, false);
  };

  // Two-Step Unwrap
  const handleUnwrap = async () => {
    if (!confBalance || confBalance === '0') return;
    setLoadingState('unwrap', true);
    setError(null);
    try {
      const confPay = getContract('ConfPayToken');
      const handleClient = await createEthersHandleClient(signer);

      // Step 1: Request Unwrap
      // Signature: unwrap(address from, address to, euint256 amount) — euint256 = bytes32
      const tx1 = await confPay['unwrap(address,address,bytes32)'](account, account, confBalance, { gasLimit: 800_000n, ...TX_OVERRIDES });
      setTxHash(tx1.hash);
      const receipt = await tx1.wait();

      // Find the UnwrapRequested event to get the unwrapRequestId
      // event UnwrapRequested(address indexed receiver, euint256 amount)
      // amount is NOT indexed — it's in log.data
      const unwrapSig = ethers.id("UnwrapRequested(address,bytes32)");
      let unwrapRequestId = null;
      for (const log of receipt.logs) {
        if (log.topics[0] === unwrapSig) {
          unwrapRequestId = '0x' + log.data.slice(2, 66);
          break;
        }
      }
      if (!unwrapRequestId) {
        // Fallback: try any log with data
        for (const log of receipt.logs) {
          if (log.data && log.data.length >= 66) {
            unwrapRequestId = '0x' + log.data.slice(2, 66);
            break;
          }
        }
      }
      if (!unwrapRequestId) throw new Error("UnwrapRequested event not found in receipt");

      setLoadingState('unwrap', 'pending_decryption'); // Update UI status

      // Step 2: Public Decrypt with polling (Gateway needs ~10-15s to process)
      let decryptionProof = null;
      const maxWaitMs = 120000; // 2 min max
      const start = Date.now();
      // Initial wait for Gateway to process allowPublicDecryption
      await new Promise(r => setTimeout(r, 8000));
      
      while (Date.now() - start < maxWaitMs) {
        try {
          const result = await handleClient.publicDecrypt(unwrapRequestId);
          decryptionProof = result.decryptionProof;
          break;
        } catch (e) {
          if (e.message?.includes('does not exist or is not publicly decryptable')) {
            await new Promise(r => setTimeout(r, 3000));
            continue;
          }
          throw e;
        }
      }
      if (!decryptionProof) throw new Error("publicDecrypt timed out — Gateway may be busy");

      // Step 3: Finalize
      const tx2 = await confPay.finalizeUnwrap(unwrapRequestId, decryptionProof, { gasLimit: 600_000n, ...TX_OVERRIDES });
      setTxHash(tx2.hash);
      await tx2.wait();

      await fetchData();
    } catch (err) {
      setError('Unwrap failed: ' + (err.reason || err.message));
    }
    setLoadingState('unwrap', false);
  };

  if (!account) {
    return (
      <div>
        <div className="page-header">
          <h2>👤 Employee Dashboard</h2>
          <p>View your encrypted balance and payment history</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Connect MetaMask to continue</p>
          <button className="btn btn-primary" onClick={connect}>🦊 Connect Wallet</button>
        </div>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--error)' }}>⚠️ Please switch to Arbitrum Sepolia</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>👤 Employee Dashboard</h2>
        <p>View your confidential salary and payment history</p>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--error)', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>❌ {error}</p>
        </div>
      )}

      {txHash && (
        <div className="card" style={{ borderColor: 'var(--success)', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--success)' }}>✅ Last tx: </span>
          <a className="tx-hash" href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            {txHash.slice(0, 10)}…{txHash.slice(-6)}
          </a>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Employment Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Employment Status</div>
            {isEmployed !== null && (
              isEmployed ? (
                <span className="badge badge-success">✓ Active</span>
              ) : (
                <span className="badge badge-warning">Not Enrolled</span>
              )
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isEmployed
              ? 'You are registered in the payroll system. Your employer can send you confidential payments.'
              : 'You are not currently registered. Contact your employer to be added to the payroll roster.'}
          </p>
        </div>

        {/* Balances */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">💰 Balances</div>
            <button className="btn btn-secondary btn-sm" onClick={fetchData}>🔄</button>
          </div>
          <div className="stat-card" style={{ marginBottom: '0.75rem' }}>
            <div className="stat-label">ERC-20 (mUSDC)</div>
            <div className="stat-value">{erc20Balance ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Confidential Balance Handle</div>
            {confBalance && confBalance !== '0' ? (
              <>
                <div className="handle-display" style={{ marginBottom: '1rem' }}>{confBalance}</div>
                {decryptedBalance ? (
                  <div className="decrypted-value">{decryptedBalance} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>mUSDC</span></div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-success" onClick={handleDecryptBalance} disabled={loading.decryptBal}>
                      {loading.decryptBal ? <><span className="spinner"></span> Decrypting…</> : '🔓 Decrypt Balance'}
                    </button>
                    <button className="btn btn-primary" onClick={handleUnwrap} disabled={loading.unwrap}>
                      {loading.unwrap === true ? <><span className="spinner"></span> Unwrapping (Step 1/3)…</> : 
                       loading.unwrap === 'pending_decryption' ? <><span className="spinner"></span> TEE Decrypting (~15s)…</> :
                       '🔄 Unwrap to ERC-20'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="stat-value" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>No confidential balance</div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">📜 Payment History ({paymentCount} payments)</div>
          </div>
          {paymentHandles.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No payments received yet.</p>
          ) : (
            <ul className="tx-list">
              {paymentHandles.map((handle, i) => (
                <li key={i} className="tx-item" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: '1 1 min-content' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Payment #{i + 1}</span>
                    <div className="handle-display" style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>
                      {handle}
                    </div>
                  </div>
                  <div>
                    {decryptedPayments[i] ? (
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        +{decryptedPayments[i]} mUSDC
                      </span>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleDecryptPayment(handle, i)} disabled={loading[`decrypt_${i}`]}>
                        {loading[`decrypt_${i}`] ? <span className="spinner"></span> : '🔓 Decrypt'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
