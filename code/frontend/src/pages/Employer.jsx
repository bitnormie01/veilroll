import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { CONTRACTS, EXPLORER_URL } from '../config/contracts';
import { createEthersHandleClient } from '@iexec-nox/handle';

// Fee overrides for Arbitrum Sepolia — prevents MetaMask fee estimation issues
const TX_OVERRIDES = {
  maxFeePerGas: 500_000_000n,        // 0.5 gwei — generous for Arb Sepolia
  maxPriorityFeePerGas: 100_000_000n, // 0.1 gwei
};

export default function Employer() {
  const { account, signer, isCorrectChain, getContract, getReadContract, connect } = useWallet();

  // State
  const [erc20Balance, setErc20Balance] = useState(null);
  const [confBalance, setConfBalance] = useState(null);
  const [wrapAmount, setWrapAmount] = useState('');
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState('');
  const [auditors, setAuditors] = useState([]);
  const [newAuditor, setNewAuditor] = useState('');
  const [isOperator, setIsOperator] = useState(false);
  const [loading, setLoading] = useState({});
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  // Batch Pay State
  const [paymentAmounts, setPaymentAmounts] = useState({});

  const setLoadingState = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  // Fetch balances
  const fetchData = useCallback(async () => {
    if (!account) return;
    try {
      const erc20 = getReadContract('MockERC20');
      const confPay = getReadContract('ConfPayToken');
      const payroll = getReadContract('PayrollManager');

      const [bal, confBal, emps, auds, isOp] = await Promise.all([
        erc20.balanceOf(account),
        confPay.confidentialBalanceOf(account),
        payroll.getEmployees(),
        payroll.getAuditors(),
        confPay.isOperator(account, CONTRACTS.PayrollManager.address),
      ]);

      setErc20Balance(ethers.formatEther(bal));
      setConfBalance(confBal.toString());
      setEmployees([...emps]);
      setAuditors([...auds]);
      setIsOperator(isOp);
    } catch (err) {
      console.error('fetchData error:', err);
    }
  }, [account, getReadContract]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Mint test tokens
  const handleMint = async () => {
    setLoadingState('mint', true);
    setError(null);
    try {
      const erc20 = getContract('MockERC20');
      const tx = await erc20.mint(account, ethers.parseEther('10000'), { gasLimit: 200_000n, ...TX_OVERRIDES });
      setTxHash(tx.hash);
      await tx.wait();
      await fetchData();
    } catch (err) {
      setError(err.reason || err.message);
    }
    setLoadingState('mint', false);
  };

  // Approve + Wrap
  const handleWrap = async () => {
    if (!wrapAmount || Number(wrapAmount) <= 0) return;
    setLoadingState('wrap', true);
    setError(null);
    try {
      const erc20 = getContract('MockERC20');
      const confPay = getContract('ConfPayToken');
      const amount = ethers.parseEther(wrapAmount);

      // Check existing allowance — skip approve if sufficient
      const currentAllowance = await erc20.allowance(account, CONTRACTS.ConfPayToken.address);
      if (currentAllowance < amount) {
        // Approve max so future wraps don't need re-approval
        const approveTx = await erc20.approve(CONTRACTS.ConfPayToken.address, ethers.MaxUint256, { gasLimit: 100_000n, ...TX_OVERRIDES });
        await approveTx.wait();
      }

      const wrapTx = await confPay.wrap(account, amount, { gasLimit: 800_000n, ...TX_OVERRIDES });
      setTxHash(wrapTx.hash);
      await wrapTx.wait();

      setWrapAmount('');
      await fetchData();
    } catch (err) {
      setError(err.reason || err.message);
    }
    setLoadingState('wrap', false);
  };

  // Set operator for PayrollManager
  const handleSetOperator = async () => {
    setLoadingState('operator', true);
    setError(null);
    try {
      const confPay = getContract('ConfPayToken');
      const tx = await confPay.setOperator(CONTRACTS.PayrollManager.address, 1893456000, { gasLimit: 250_000n, ...TX_OVERRIDES });
      setTxHash(tx.hash);
      await tx.wait();
      await fetchData();
    } catch (err) {
      setError(err.reason || err.message);
    }
    setLoadingState('operator', false);
  };

  // Add employee
  const handleAddEmployee = async () => {
    if (!newEmployee || !ethers.isAddress(newEmployee)) return;
    setLoadingState('addEmp', true);
    setError(null);
    try {
      const payroll = getContract('PayrollManager');
      const tx = await payroll.addEmployee(newEmployee, { gasLimit: 200_000n, ...TX_OVERRIDES });
      setTxHash(tx.hash);
      await tx.wait();
      setNewEmployee('');
      await fetchData();
    } catch (err) {
      setError(err.reason || err.message);
    }
    setLoadingState('addEmp', false);
  };

  // Remove employee
  const handleRemoveEmployee = async (addr) => {
    setLoadingState('removeEmp', true);
    setError(null);
    try {
      const payroll = getContract('PayrollManager');
      const tx = await payroll.removeEmployee(addr, { gasLimit: 200_000n, ...TX_OVERRIDES });
      setTxHash(tx.hash);
      await tx.wait();
      await fetchData();
    } catch (err) {
      setError(err.reason || err.message);
    }
    setLoadingState('removeEmp', false);
  };

  // Batch Pay Employees (post-5a architecture: direct transfer + bookkeeping)
  const handleBatchPay = async () => {
    if (employees.length === 0) return;
    
    // Validate all inputs
    for (const emp of employees) {
      if (!paymentAmounts[emp] || Number(paymentAmounts[emp]) <= 0) {
        setError('Please enter a valid payment amount for all employees.');
        return;
      }
    }

    setLoadingState('batchPay', true);
    setError(null);
    try {
      const handleClient = await createEthersHandleClient(signer);
      const confPay = getContract('ConfPayToken');
      const payroll = getContract('PayrollManager');

      const transferredHandles = [];
      const transferredEmployees = [];

      // Step 1: For each employee, encrypt + confidentialTransfer directly
      for (const emp of employees) {
        const amountWei = ethers.parseEther(paymentAmounts[emp]);
        // Proof targets ConfPayToken — employer is msg.sender calling ConfPayToken
        const { handle, handleProof } = await handleClient.encryptInput(
          amountWei,
          'uint256',
          CONTRACTS.ConfPayToken.address
        );

        const tx = await confPay['confidentialTransfer(address,bytes32,bytes)'](
          emp, handle, handleProof, { gasLimit: 1_200_000n, ...TX_OVERRIDES }
        );
        setTxHash(tx.hash);
        const receipt = await tx.wait();

        // Extract the transferred handle from ConfidentialTransfer event
        const transferSig = ethers.id("ConfidentialTransfer(address,address,bytes32)");
        let transferredHandle = null;
        for (const log of receipt.logs) {
          if (log.topics[0] === transferSig) {
            transferredHandle = log.topics[3]; // amount is indexed
            break;
          }
        }
        if (transferredHandle) {
          transferredHandles.push(transferredHandle);
          transferredEmployees.push(emp);
        }
      }

      // Step 2: Record all payments in PayrollManager for auditor disclosure
      if (transferredEmployees.length > 0) {
        const recordTx = await payroll.recordPayments(transferredEmployees, transferredHandles, { gasLimit: 400_000n, ...TX_OVERRIDES });
        setTxHash(recordTx.hash);
        await recordTx.wait();
      }

      // Step 3: Grant any existing auditors ACL on the new handles
      const currentAuditors = await payroll.getAuditors();
      if (currentAuditors.length > 0 && transferredHandles.length > 0) {
        const NOX_COMPUTE = '0xd464B198f06756a1d00be223634b85E0a731c229';
        const noxABI = ['function allow(bytes32 handle, address account)'];
        const noxCompute = new ethers.Contract(NOX_COMPUTE, noxABI, signer);
        for (const handle of transferredHandles) {
          for (const auditor of currentAuditors) {
            try {
              const allowTx = await noxCompute.allow(handle, auditor, { gasLimit: 300_000n, ...TX_OVERRIDES });
              await allowTx.wait();
            } catch (e) {
              console.warn(`ACL grant failed for ${auditor} on ${handle}:`, e.message);
            }
          }
        }
      }
      
      // Clear inputs
      setPaymentAmounts({});
      await fetchData();
    } catch (err) {
      setError(err.reason || err.message);
    }
    setLoadingState('batchPay', false);
  };

  // Grant auditor (register + grant ACL on all existing payment handles)
  const handleGrantAuditor = async () => {
    if (!newAuditor || !ethers.isAddress(newAuditor)) return;
    setLoadingState('grantAudit', true);
    setError(null);
    try {
      const payroll = getContract('PayrollManager');

      // Step 1: Register auditor in PayrollManager
      const tx = await payroll.grantAuditorAccess(newAuditor, { gasLimit: 300_000n, ...TX_OVERRIDES });
      setTxHash(tx.hash);
      await tx.wait();

      // Step 2: Grant NoxCompute.allow on all existing payment handles
      const paidEmployees = await payroll.getPaidEmployees();
      if (paidEmployees.length > 0) {
        const NOX_COMPUTE = '0xd464B198f06756a1d00be223634b85E0a731c229';
        const noxABI = ['function allow(bytes32 handle, address account)'];
        const noxCompute = new ethers.Contract(NOX_COMPUTE, noxABI, signer);
        
        for (const emp of paidEmployees) {
          const count = await payroll.getPaymentCount(emp);
          for (let i = 0; i < Number(count); i++) {
            const handle = await payroll.getPaymentHandle(emp, i);
            try {
              const allowTx = await noxCompute.allow(handle, newAuditor, { gasLimit: 300_000n, ...TX_OVERRIDES });
              await allowTx.wait();
            } catch (e) {
              console.warn(`ACL grant failed for handle ${i} of ${emp}:`, e.message);
            }
          }
        }
      }

      setNewAuditor('');
      await fetchData();
    } catch (err) {
      setError(err.reason || err.message);
    }
    setLoadingState('grantAudit', false);
  };

  // Revoke auditor
  const handleRevokeAuditor = async (addr) => {
    setLoadingState('revokeAudit', true);
    setError(null);
    try {
      const payroll = getContract('PayrollManager');
      const tx = await payroll.revokeAuditorAccess(addr);
      setTxHash(tx.hash);
      await tx.wait();
      await fetchData();
    } catch (err) {
      setError(err.reason || err.message);
    }
    setLoadingState('revokeAudit', false);
  };

  if (!account) {
    return (
      <div>
        <div className="page-header">
          <h2>🏢 Employer Dashboard</h2>
          <p>Connect your wallet to manage payroll</p>
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
        <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>⚠️ Please switch to Arbitrum Sepolia</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>🏢 Employer Dashboard</h2>
        <p>Wrap tokens, manage employees, configure auditors</p>
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
        {/* Token Balances */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">💰 Token Balances</div>
          </div>
          <div className="stat-card" style={{ marginBottom: '0.75rem' }}>
            <div className="stat-label">MockERC20 (mUSDC)</div>
            <div className="stat-value">{erc20Balance ?? '—'}</div>
          </div>
          <div className="stat-card" style={{ marginBottom: '1rem' }}>
            <div className="stat-label">Confidential Balance Handle</div>
            <div className="stat-value encrypted">{confBalance && confBalance !== '0' ? confBalance : 'No balance'}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleMint} disabled={loading.mint} style={{ marginRight: '0.5rem' }}>
            {loading.mint ? <><span className="spinner"></span> Minting…</> : '🪙 Mint 10k mUSDC'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={fetchData}>🔄 Refresh</button>
        </div>

        {/* Wrap Tokens */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔐 Wrap ERC-20 → Confidential</div>
          </div>
          <div className="input-group">
            <label>Amount (mUSDC)</label>
            <input
              className="input-field"
              type="number"
              placeholder="e.g. 1000"
              value={wrapAmount}
              onChange={e => setWrapAmount(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleWrap} disabled={loading.wrap || !wrapAmount}>
            {loading.wrap ? <><span className="spinner"></span> Wrapping…</> : '🔐 Approve & Wrap'}
          </button>
        </div>

        {/* Operator Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚙️ PayrollManager Operator</div>
            {isOperator ? (
              <span className="badge badge-success">✓ Active</span>
            ) : (
              <span className="badge badge-warning">Not Set</span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Optional: Set PayrollManager as operator if using advanced transfer flows. Not required for direct encrypted payments.
          </p>
          {!isOperator && (
            <button className="btn btn-primary" onClick={handleSetOperator} disabled={loading.operator}>
              {loading.operator ? <><span className="spinner"></span> Setting…</> : '✅ Set Operator'}
            </button>
          )}
        </div>

        {/* Employee Management & Batch Pay */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">👥 Employees & Payroll ({employees.length})</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', maxWidth: '500px' }}>
            <input
              className="input-field"
              placeholder="0x… employee address"
              value={newEmployee}
              onChange={e => setNewEmployee(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={handleAddEmployee} disabled={loading.addEmp}>
              {loading.addEmp ? <span className="spinner"></span> : '+ Add'}
            </button>
          </div>
          
          {employees.length > 0 && (
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Batch Payment Run</h4>
                <button 
                  className="btn btn-success btn-sm" 
                  onClick={handleBatchPay} 
                  disabled={loading.batchPay}
                >
                  {loading.batchPay ? <><span className="spinner"></span> Encrypting & Paying…</> : '💸 Pay All (Encrypted)'}
                </button>
              </div>

              
              <ul className="employee-list">
                {employees.map((emp, i) => (
                  <li key={i} className="employee-item" style={{ background: 'var(--bg-card)' }}>
                    <span className="employee-address">{emp.slice(0, 10)}…{emp.slice(-6)}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        className="input-field"
                        style={{ width: '120px', padding: '0.4rem 0.75rem' }}
                        type="number"
                        placeholder="Amount"
                        value={paymentAmounts[emp] || ''}
                        onChange={e => setPaymentAmounts({ ...paymentAmounts, [emp]: e.target.value })}
                      />
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemoveEmployee(emp)} disabled={loading.removeEmp}>
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {employees.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No employees added.</p>
          )}
        </div>

        {/* Auditor Management */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔍 Auditors ({auditors.length})</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              className="input-field"
              placeholder="0x… auditor address"
              value={newAuditor}
              onChange={e => setNewAuditor(e.target.value)}
            />
            <button className="btn btn-success btn-sm" onClick={handleGrantAuditor} disabled={loading.grantAudit}>
              {loading.grantAudit ? <span className="spinner"></span> : '🔓 Grant'}
            </button>
          </div>
          <ul className="employee-list">
            {auditors.map((aud, i) => (
              <li key={i} className="employee-item">
                <span className="employee-address">{aud.slice(0, 10)}…{aud.slice(-6)}</span>
                <button className="btn btn-danger btn-sm" onClick={() => handleRevokeAuditor(aud)} disabled={loading.revokeAudit}>
                  🔒 Revoke
                </button>
              </li>
            ))}
            {auditors.length === 0 && (
              <li style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem' }}>No auditors granted</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
