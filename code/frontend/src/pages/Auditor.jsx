import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { createEthersHandleClient } from '@iexec-nox/handle';

export default function Auditor() {
  const { account, signer, isCorrectChain, getReadContract, connect } = useWallet();
  const [isAuditor, setIsAuditor] = useState(null);
  const [paidEmployees, setPaidEmployees] = useState([]);
  const [employeePayments, setEmployeePayments] = useState({});
  const [decryptedPayments, setDecryptedPayments] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  const setLoadingState = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  const fetchData = useCallback(async () => {
    if (!account) return;
    try {
      const payroll = getReadContract('PayrollManager');
      const [aud, paid] = await Promise.all([
        payroll.isAuditor(account),
        payroll.getPaidEmployees(),
      ]);
      setIsAuditor(aud);
      setPaidEmployees([...paid]);
      const pmts = {};
      for (const emp of paid) {
        const count = await payroll.getPaymentCount(emp);
        const handles = [];
        for (let i = 0; i < Number(count); i++) {
          const h = await payroll.getPaymentHandle(emp, i);
          handles.push(h.toString());
        }
        pmts[emp] = handles;
      }
      setEmployeePayments(pmts);
    } catch (err) { console.error(err); }
  }, [account, getReadContract]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDecryptPayment = async (handle, empIndex, pmtIndex) => {
    const key = `${empIndex}_${pmtIndex}`;
    setLoadingState(key, true);
    setError(null);
    try {
      const handleClient = await createEthersHandleClient(signer);
      const { value } = await handleClient.decrypt(handle);
      setDecryptedPayments(prev => ({ ...prev, [key]: ethers.formatEther(value.toString()) }));
    } catch (err) {
      setError(`Decryption failed: ` + (err.reason || err.message));
    }
    setLoadingState(key, false);
  };

  if (!account) return (
    <div>
      <div className="page-header"><h2>🔍 Auditor Dashboard</h2><p>Review disclosed payment handles</p></div>
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <button className="btn btn-primary" onClick={connect}>🦊 Connect Wallet</button>
      </div>
    </div>
  );

  if (!isCorrectChain) return <div className="card" style={{ textAlign: 'center', padding: '3rem' }}><p style={{ color: 'var(--error)' }}>⚠️ Switch to Arbitrum Sepolia</p></div>;

  return (
    <div>
      <div className="page-header"><h2>🔍 Auditor Dashboard</h2><p>Selectively disclosed payment records</p></div>
      
      {error && (
        <div className="card" style={{ borderColor: 'var(--error)', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>❌ {error}</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">🛡️ Auditor Status</div>
          {isAuditor !== null && (isAuditor ? <span className="badge badge-success">✓ Authorized</span> : <span className="badge badge-warning">Not Authorized</span>)}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isAuditor ? 'You have read-only decrypt access to all disclosed payment handles.' : 'You are not authorized. The employer must grant you access via grantAuditorAccess().'}
        </p>
      </div>

      {isAuditor && paidEmployees.length > 0 && (
        <div className="card">
          <div className="card-header"><div className="card-title">📊 Payment Records ({paidEmployees.length} employees)</div><button className="btn btn-secondary btn-sm" onClick={fetchData}>🔄</button></div>
          {paidEmployees.map((emp, i) => (
            <div key={i} style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                Employee: <span className="employee-address" style={{ marginLeft: '0.5rem', fontWeight: 'normal' }}>{emp}</span>
              </div>
              <ul className="tx-list">
                {(employeePayments[emp] || []).map((h, j) => {
                  const key = `${i}_${j}`;
                  return (
                    <li key={j} className="tx-item" style={{ flexWrap: 'wrap', gap: '1rem', borderTop: j > 0 ? '1px solid var(--border)' : 'none', paddingTop: j > 0 ? '0.75rem' : '0' }}>
                      <div style={{ flex: '1 1 min-content' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Payment #{j + 1}</span>
                        <div className="handle-display" style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>
                          {h}
                        </div>
                      </div>
                      <div>
                        {decryptedPayments[key] ? (
                          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                            {decryptedPayments[key]} mUSDC
                          </span>
                        ) : (
                          <button className="btn btn-success btn-sm" onClick={() => handleDecryptPayment(h, i, j)} disabled={loading[key]}>
                            {loading[key] ? <span className="spinner"></span> : '🔓 Decrypt'}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {isAuditor && paidEmployees.length === 0 && (
        <div className="card"><p style={{ color: 'var(--text-muted)' }}>No payments have been made yet.</p></div>
      )}
    </div>
  );
}
