import { useWallet } from '../context/WalletContext';
import { CHAIN_NAME } from '../config/contracts';

export default function Navbar() {
  const { account, isConnecting, isCorrectChain, chainId, connect, switchChain, disconnect } = useWallet();

  const shortAddr = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a href="/" className="navbar-brand">
          <div className="logo-icon">🔐</div>
          <h1>Veilroll</h1>
        </a>

        <div className="navbar-links">
          <a href="/" className={location.pathname === '/' ? 'active' : ''}>Home</a>
          <a href="/employer" className={location.pathname === '/employer' ? 'active' : ''}>Employer</a>
          <a href="/employee" className={location.pathname === '/employee' ? 'active' : ''}>Employee</a>
          <a href="/auditor" className={location.pathname === '/auditor' ? 'active' : ''}>Auditor</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {account && (
            <div className="network-pill">
              <span className={`network-dot ${isCorrectChain ? '' : 'wrong'}`}></span>
              {isCorrectChain ? CHAIN_NAME : 'Wrong Network'}
            </div>
          )}

          {!account ? (
            <button className="btn btn-primary btn-sm" onClick={connect} disabled={isConnecting}>
              {isConnecting ? <><span className="spinner"></span> Connecting…</> : '🦊 Connect'}
            </button>
          ) : !isCorrectChain ? (
            <button className="btn btn-danger btn-sm" onClick={switchChain}>
              Switch to {CHAIN_NAME}
            </button>
          ) : (
            <button className="wallet-btn connected" onClick={disconnect}>
              <span className="network-dot"></span>
              <span className="wallet-address">{shortAddr}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
