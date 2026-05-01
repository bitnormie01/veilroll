import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, CHAIN_ID, CHAIN_NAME, RPC_URL } from '../config/contracts';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectChain = chainId === CHAIN_ID;

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      const signerInstance = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(signerInstance);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchChain = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + CHAIN_ID.toString(16) }],
      });
    } catch (err) {
      // Chain not added — add it
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x' + CHAIN_ID.toString(16),
            chainName: CHAIN_NAME,
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: [RPC_URL],
            blockExplorerUrls: ['https://sepolia.arbiscan.io'],
          }],
        });
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  }, []);

  const getContract = useCallback((name) => {
    if (!signer || !CONTRACTS[name]) return null;
    return new ethers.Contract(CONTRACTS[name].address, CONTRACTS[name].abi, signer);
  }, [signer]);

  const getReadContract = useCallback((name) => {
    const readProvider = new ethers.JsonRpcProvider(RPC_URL);
    if (!CONTRACTS[name]) return null;
    return new ethers.Contract(CONTRACTS[name].address, CONTRACTS[name].abi, readProvider);
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      setChainId(Number(chainIdHex));
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect]);

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    isCorrectChain,
    error,
    connect,
    switchChain,
    disconnect,
    getContract,
    getReadContract,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
