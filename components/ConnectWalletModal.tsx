import React, { useMemo, useState } from 'react';
import {
  detectAvailableProviders,
  WalletProviderId,
} from '../utils/web3Wallet';

interface ConnectWalletModalProps {
  isOpen: boolean;
  isConnecting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSelectProvider: (providerId: WalletProviderId, verifyOnConnect: boolean) => Promise<void>;
}

const WALLET_OPTIONS: Array<{
  id: WalletProviderId;
  name: string;
  desc: string;
  badge: string;
}> = [
  {
    id: 'metamask',
    name: 'MetaMask',
    desc: 'Browser Extension & Mobile EVM Wallet',
    badge: 'EIP-1193',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    desc: 'Base L2 & Ethereum Smart Wallet',
    badge: 'EVM / L2',
  },
  {
    id: 'phantom',
    name: 'Phantom (EVM)',
    desc: 'Multi-chain Ethereum & L2 Provider',
    badge: 'Multi-Chain',
  },
  {
    id: 'browser',
    name: 'Injected Browser Wallet',
    desc: 'Rabby, Trust, Frame, or Brave Wallet',
    badge: 'window.ethereum',
  },
];

const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  isConnecting,
  errorMessage,
  onClose,
  onSelectProvider,
}) => {
  const [verifyOnConnect, setVerifyOnConnect] = useState<boolean>(true);
  const [activeAttempt, setActiveAttempt] = useState<WalletProviderId | null>(null);

  const available = useMemo(() => {
    if (!isOpen) {
      return { metamask: false, coinbase: false, phantom: false, browser: false, demo: true };
    }
    return detectAvailableProviders();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (id: WalletProviderId) => {
    setActiveAttempt(id);
    try {
      await onSelectProvider(id, verifyOnConnect);
    } finally {
      setActiveAttempt(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-wallet-heading"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#111118] p-6 shadow-[0_0_50px_rgba(138,43,226,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
              ethers.js v6 • EIP-1193
            </span>
            <h3 id="connect-wallet-heading" className="text-xl font-bold font-cinzel text-white">
              Connect Web3 Wallet
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isConnecting}
            className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            aria-label="Close wallet modal"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Link MetaMask or an EVM-compatible wallet via <code className="text-cyan-300">ethers.BrowserProvider</code> to verify ownership, check live gas balances, and sign staking or governance proofs.
        </p>

        {/* Ownership Signature Option */}
        <label className="flex items-start gap-3 p-3 rounded-xl border border-purple-500/25 bg-purple-950/20 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={verifyOnConnect}
            onChange={(e) => setVerifyOnConnect(e.target.checked)}
            disabled={isConnecting}
            className="mt-0.5 accent-[var(--accent-secondary)]"
          />
          <div>
            <p className="text-xs font-bold text-white">
              Request cryptographic ownership signature
            </p>
            <p className="text-[11px] text-gray-400">
              Prompts a gas-free <code className="text-purple-300">signMessage</code> verified locally with <code className="text-purple-300">ethers.verifyMessage</code>.
            </p>
          </div>
        </label>

        {/* Inline Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/40 bg-red-950/40 text-red-200 text-xs font-mono leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Wallet Providers */}
        <div className="space-y-2.5">
          {WALLET_OPTIONS.map((w) => {
            const isDetected = available[w.id];
            const isLoadingThis = isConnecting && activeAttempt === w.id;

            return (
              <button
                key={w.id}
                type="button"
                disabled={isConnecting}
                onClick={() => handleSelect(w.id)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/10 hover:border-[var(--accent-secondary)] bg-white/5 hover:bg-white/10 transition-all text-left group disabled:opacity-60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
                    {w.id === 'metamask' && (
                      <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.5 3L13 8.6l1.4-3.3L20.5 3zM3.5 3l7.4 5.7L9.6 5.3 3.5 3zm14.3 13.7l-2 3.1 4.3 1.2 1.2-4.2-3.5-.1zm-15.1.1l1.2 4.2 4.3-1.2-2-3.1-3.5.1zM8.5 11.1L7.3 13l4.2.2-.1-4.6-2.9 2.5zm7 0l-3-2.6-.1 4.7 4.2-.2-1.1-1.9z" />
                      </svg>
                    )}
                    {w.id === 'coinbase' && (
                      <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="9" opacity="0.25" />
                        <rect x="9" y="9" width="6" height="6" rx="1.2" />
                      </svg>
                    )}
                    {w.id === 'phantom' && (
                      <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3a8 8 0 00-8 8v7c0 1.1 1.2 1.7 2.1 1.1l2.2-1.5c.6-.4 1.4-.4 2 0l1.1.8c.4.3 1 .3 1.4 0l1.1-.8c.6-.4 1.4-.4 2 0l2.2 1.5c.9.6 2.1 0 2.1-1.1v-7a8 8 0 00-8-8zm-2.5 8a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm5 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
                      </svg>
                    )}
                    {w.id === 'browser' && (
                      <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="6" width="18" height="12" rx="2" />
                        <path d="M16 12h2" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white group-hover:text-[var(--accent-primary)] transition-colors truncate">
                        {w.name}
                      </p>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border ${
                          isDetected
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                            : 'border-white/10 bg-white/5 text-gray-500'
                        }`}
                      >
                        {isDetected ? 'Detected' : w.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono truncate">{w.desc}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors ml-2 shrink-0">
                  {isLoadingThis ? 'Connecting...' : '→'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sandbox Demo Wallet Option for environments without extensions */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => handleSelect('demo')}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-950/15 hover:bg-cyan-950/30 transition-all text-left group disabled:opacity-60"
          >
            <div>
              <p className="text-xs font-bold text-cyan-300">
                Vanhsya Ephemeral Sandbox Wallet (No Extension)
              </p>
              <p className="text-[11px] text-gray-400 font-mono">
                Generates a real local ethers.Wallet keypair to test cryptographic signing & verification.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300 ml-2 shrink-0">
              {isConnecting && activeAttempt === 'demo' ? '...' : 'Test →'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;
