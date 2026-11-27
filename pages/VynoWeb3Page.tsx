import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import AnimateOnScroll from '../components/AnimateOnScroll';
import ConnectWalletModal from '../components/ConnectWalletModal';
import SeoHead from '../components/SeoHead';
import {
  ConnectedWalletState,
  Eip1193Provider,
  SUPPORTED_NETWORKS,
  WalletProviderId,
  createVerificationChallenge,
  formatEthBalance,
  formatShortAddress,
  getFriendlyNetworkName,
  resolveEip1193Provider,
  switchOrAddNetwork,
  verifyWalletSignature,
} from '../utils/web3Wallet';
import { BRAND_CONTACTS, buildWhatsAppDirectEnquiryUrl } from '../utils/utm';
import { useAuth } from '../contexts/AuthContext';
import { VynoAccountProfile, VynoLedgerEntry } from '../types';

interface VerifiedActivityRecord {
  id: string;
  action: string;
  signerAddress: string;
  recoveredAddress: string;
  signature: string;
  digestHash: string;
  chainId: number;
  timestamp: string;
  verified: boolean;
}

interface TxVerificationResult {
  hash: string;
  status: 'Confirmed' | 'Failed' | 'Pending';
  blockNumber: number | null;
  from: string;
  to: string | null;
  valueEth: string;
  gasUsed: string | null;
  networkLabel: string;
}

const INITIAL_WALLET_STATE: ConnectedWalletState = {
  connected: false,
  isDemo: false,
  providerId: null,
  providerName: '',
  address: '',
  shortAddress: '',
  ensName: null,
  chainId: 8453,
  networkName: 'Not Connected',
  nativeBalanceEth: '0.0000',
  verifiedSignature: null,
  verifiedChallenge: null,
  verifiedAt: null,
  signerVerified: false,
};

const PROVIDER_DISPLAY_NAMES: Record<WalletProviderId, string> = {
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
  phantom: 'Phantom EVM',
  browser: 'Browser Wallet',
  demo: 'Ephemeral ethers.Wallet',
};

const VynoWeb3Page: React.FC = () => {
  const [wallet, setWallet] = useState<ConnectedWalletState>(INITIAL_WALLET_STATE);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);
  const [isSigningAction, setIsSigningAction] = useState<boolean>(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState<boolean>(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  const rawProviderRef = useRef<Eip1193Provider | null>(null);
  const browserProviderRef = useRef<ethers.BrowserProvider | null>(null);
  const activeSignerRef = useRef<ethers.Signer | null>(null);

  const [verifiedLogs, setVerifiedLogs] = useState<VerifiedActivityRecord[]>([]);
  const [verifierTab, setVerifierTab] = useState<'tx' | 'sig'>('tx');
  const [txHashInput, setTxHashInput] = useState<string>('');
  const [isVerifyingTx, setIsVerifyingTx] = useState<boolean>(false);
  const [txVerifyError, setTxVerifyError] = useState<string | null>(null);
  const [txVerifyResult, setTxVerifyResult] = useState<TxVerificationResult | null>(null);

  const [sigMessageInput, setSigMessageInput] = useState<string>('');
  const [sigSignatureInput, setSigSignatureInput] = useState<string>('');
  const [sigExpectedAddress, setSigExpectedAddress] = useState<string>('');
  const [sigVerifyOutput, setSigVerifyOutput] = useState<{
    valid: boolean;
    recoveredAddress: string;
    digestHash: string;
  } | null>(null);
  const [sigVerifyError, setSigVerifyError] = useState<string | null>(null);

  const { user, token, updateProfile } = useAuth();
  const [vynoStatus, setVynoStatus] = useState<{
    tokenDistributionEnabled: boolean;
    complianceNotice: string;
    contractStatus?: { mode?: string; configured?: boolean; complianceApproved?: boolean };
  } | null>(null);
  const [vynoProfile, setVynoProfile] = useState<VynoAccountProfile | null>(null);
  const [vynoLedger, setVynoLedger] = useState<VynoLedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState<boolean>(false);
  const [walletSyncNotice, setWalletSyncNotice] = useState<string | null>(null);

  const appendVerifiedLog = useCallback((record: VerifiedActivityRecord) => {
    setVerifiedLogs((prev) => [record, ...prev].slice(0, 8));
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/vyno/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setVynoStatus(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const loadVynoParticipationProfile = useCallback(
    async (walletAddr?: string) => {
      const targetKey = walletAddr?.trim() || '';
      if (!targetKey && !token) {
        setVynoProfile(null);
        setVynoLedger([]);
        return;
      }
      setLoadingLedger(true);
      try {
        const params = new URLSearchParams();
        if (targetKey) {
          params.set('accountKey', targetKey);
          params.set('walletAddress', targetKey);
        }
        const res = await fetch(`/api/vyno/profile?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          setVynoProfile(data.profile || null);
          setVynoLedger(Array.isArray(data.ledger) ? data.ledger : []);
        }
      } catch {
        // non-blocking
      } finally {
        setLoadingLedger(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (wallet.connected && wallet.address) {
      loadVynoParticipationProfile(wallet.address);
    } else if (token) {
      loadVynoParticipationProfile(user?.walletAddress || undefined);
    } else {
      setVynoProfile(null);
      setVynoLedger([]);
    }
  }, [wallet.connected, wallet.address, token, user?.walletAddress, loadVynoParticipationProfile]);

  useEffect(() => {
    let cancelled = false;
    if (
      user &&
      token &&
      wallet.connected &&
      !wallet.isDemo &&
      wallet.address &&
      user.walletAddress?.toLowerCase() !== wallet.address.toLowerCase()
    ) {
      updateProfile({ walletAddress: wallet.address }).then((res) => {
        if (!cancelled && res.ok) {
          setWalletSyncNotice(`Linked ${formatShortAddress(wallet.address)} to ${user.email}.`);
        }
      });
    } else if (!wallet.connected || wallet.isDemo) {
      setWalletSyncNotice(null);
    }
    return () => {
      cancelled = true;
    };
  }, [user, token, wallet.connected, wallet.isDemo, wallet.address, updateProfile]);

  const hydrateEthersWallet = useCallback(
    async (
      rawProvider: Eip1193Provider,
      providerId: WalletProviderId,
      options?: { signOwnershipChallenge?: boolean }
    ) => {
      const browserProvider = new ethers.BrowserProvider(rawProvider);
      browserProviderRef.current = browserProvider;

      const signer = await browserProvider.getSigner();
      activeSignerRef.current = signer;

      const address = await signer.getAddress();
      const network = await browserProvider.getNetwork();
      const chainId = Number(network.chainId);
      const networkName = getFriendlyNetworkName(chainId, network.name);

      let nativeBalanceEth = '0.0000';
      try {
        const balanceWei = await browserProvider.getBalance(address);
        nativeBalanceEth = formatEthBalance(balanceWei);
      } catch {
        nativeBalanceEth = '0.0000';
      }

      let ensName: string | null = null;
      if (chainId === 1) {
        try {
          ensName = await browserProvider.lookupAddress(address);
        } catch {
          ensName = null;
        }
      }

      let verifiedSignature: string | null = null;
      let verifiedChallenge: string | null = null;
      let verifiedAt: string | null = null;
      let signerVerified = false;

      if (options?.signOwnershipChallenge) {
        const challenge = createVerificationChallenge({
          address,
          chainId,
          action: 'Link Wallet & Verify Ownership',
          details: 'Authenticate Vanhsya Web3 verification session',
        });
        const signature = await signer.signMessage(challenge);
        const verification = verifyWalletSignature(challenge, signature, address);

        verifiedSignature = signature;
        verifiedChallenge = challenge;
        verifiedAt = new Date().toLocaleTimeString();
        signerVerified = verification.valid;

        appendVerifiedLog({
          id: `SIG-${Date.now().toString().slice(-5)}`,
          action: 'Wallet Ownership Verification',
          signerAddress: address,
          recoveredAddress: verification.recoveredAddress,
          signature,
          digestHash: verification.digestHash,
          chainId,
          timestamp: verifiedAt,
          verified: verification.valid,
        });
      }

      setWallet({
        connected: true,
        isDemo: false,
        providerId,
        providerName: PROVIDER_DISPLAY_NAMES[providerId],
        address,
        shortAddress: formatShortAddress(address),
        ensName,
        chainId,
        networkName,
        nativeBalanceEth,
        verifiedSignature,
        verifiedChallenge,
        verifiedAt,
        signerVerified,
      });
    },
    [appendVerifiedLog]
  );

  useEffect(() => {
    const rawProvider = rawProviderRef.current;
    if (!wallet.connected || wallet.isDemo || !rawProvider?.on || !wallet.providerId) {
      return;
    }

    const activeProviderId = wallet.providerId;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        rawProviderRef.current = null;
        browserProviderRef.current = null;
        activeSignerRef.current = null;
        setWallet(INITIAL_WALLET_STATE);
        return;
      }
      try {
        await hydrateEthersWallet(rawProvider, activeProviderId, { signOwnershipChallenge: false });
      } catch (err) {
        console.error('Error refreshing account state:', err);
      }
    };

    const handleChainChanged = async () => {
      try {
        await hydrateEthersWallet(rawProvider, activeProviderId, { signOwnershipChallenge: false });
      } catch (err) {
        console.error('Error refreshing network state:', err);
      }
    };

    rawProvider.on('accountsChanged', handleAccountsChanged);
    rawProvider.on('chainChanged', handleChainChanged);

    return () => {
      rawProvider.removeListener?.('accountsChanged', handleAccountsChanged);
      rawProvider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [wallet.connected, wallet.isDemo, wallet.providerId, hydrateEthersWallet]);

  const handleSelectWalletProvider = async (providerId: WalletProviderId, verifyOnConnect: boolean) => {
    setWalletError(null);
    setIsConnectingWallet(true);

    try {
      if (providerId === 'demo') {
        const ephemeralWallet = ethers.Wallet.createRandom();
        activeSignerRef.current = ephemeralWallet;
        rawProviderRef.current = null;
        browserProviderRef.current = null;

        const address = await ephemeralWallet.getAddress();
        const challenge = createVerificationChallenge({
          address,
          chainId: 8453,
          action: 'Sandbox Wallet Ownership Proof',
          details: 'Local secp256k1 cryptographic verification session',
        });
        const signature = await ephemeralWallet.signMessage(challenge);
        const verification = verifyWalletSignature(challenge, signature, address);
        const timestamp = new Date().toLocaleTimeString();

        appendVerifiedLog({
          id: `SIG-${Date.now().toString().slice(-5)}`,
          action: 'Ephemeral Wallet Verification',
          signerAddress: address,
          recoveredAddress: verification.recoveredAddress,
          signature,
          digestHash: verification.digestHash,
          chainId: 8453,
          timestamp,
          verified: verification.valid,
        });

        setWallet({
          connected: true,
          isDemo: true,
          providerId: 'demo',
          providerName: PROVIDER_DISPLAY_NAMES.demo,
          address,
          shortAddress: formatShortAddress(address),
          ensName: null,
          chainId: 8453,
          networkName: 'Base Mainnet (Sandbox)',
          nativeBalanceEth: '0.0000',
          verifiedSignature: signature,
          verifiedChallenge: challenge,
          verifiedAt: timestamp,
          signerVerified: verification.valid,
        });

        setShowWalletModal(false);
        return;
      }

      const rawProvider = resolveEip1193Provider(providerId);
      if (!rawProvider) {
        const label = PROVIDER_DISPLAY_NAMES[providerId];
        setWalletError(
          `${label} extension was not detected in this browser. Install ${label}, unlock your extension, or choose the Ephemeral Sandbox Wallet below.`
        );
        return;
      }

      rawProviderRef.current = rawProvider;
      await rawProvider.request({ method: 'eth_requestAccounts' });
      await hydrateEthersWallet(rawProvider, providerId, {
        signOwnershipChallenge: verifyOnConnect,
      });

      setShowWalletModal(false);
    } catch (err: any) {
      if (err?.code === 4001 || err?.info?.error?.code === 4001) {
        setWalletError('Connection or signature request was rejected in your wallet.');
      } else if (err?.code === -32002) {
        setWalletError('A wallet request is already pending. Open your wallet extension to approve it.');
      } else {
        setWalletError(err?.shortMessage || err?.message || 'Unable to connect wallet.');
      }
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleDisconnectWallet = () => {
    rawProviderRef.current = null;
    browserProviderRef.current = null;
    activeSignerRef.current = null;
    setWallet(INITIAL_WALLET_STATE);
    setWalletError(null);
  };

  const handleVerifyOwnershipSignature = async () => {
    if (!wallet.connected || !activeSignerRef.current) {
      setShowWalletModal(true);
      return;
    }

    setIsSigningAction(true);
    setWalletError(null);

    try {
      const challenge = createVerificationChallenge({
        address: wallet.address,
        chainId: wallet.chainId,
        action: 'Verify Wallet Ownership',
        details: 'Vanhsya Web3 Cryptographic Verification',
      });
      const signature = await activeSignerRef.current.signMessage(challenge);
      const verification = verifyWalletSignature(challenge, signature, wallet.address);
      const timestamp = new Date().toLocaleTimeString();

      setWallet((prev) => ({
        ...prev,
        verifiedSignature: signature,
        verifiedChallenge: challenge,
        verifiedAt: timestamp,
        signerVerified: verification.valid,
      }));

      appendVerifiedLog({
        id: `SIG-${Date.now().toString().slice(-5)}`,
        action: 'Manual Ownership Proof',
        signerAddress: wallet.address,
        recoveredAddress: verification.recoveredAddress,
        signature,
        digestHash: verification.digestHash,
        chainId: wallet.chainId,
        timestamp,
        verified: verification.valid,
      });
    } catch (err: any) {
      if (err?.code === 4001 || err?.info?.error?.code === 4001) {
        setWalletError('Signature request canceled in wallet.');
      } else {
        setWalletError(err?.shortMessage || err?.message || 'Failed to sign verification message.');
      }
    } finally {
      setIsSigningAction(false);
    }
  };

  const handleSwitchNetwork = async (targetChainId: number) => {
    if (wallet.isDemo) {
      setWallet((prev) => ({
        ...prev,
        chainId: targetChainId,
        networkName: `${getFriendlyNetworkName(targetChainId)} (Sandbox)`,
      }));
      return;
    }

    if (!rawProviderRef.current || !wallet.providerId) return;

    setIsSwitchingChain(true);
    setWalletError(null);
    try {
      await switchOrAddNetwork(rawProviderRef.current, targetChainId);
      await hydrateEthersWallet(rawProviderRef.current, wallet.providerId, {
        signOwnershipChallenge: false,
      });
    } catch (err: any) {
      if (err?.code !== 4001) {
        setWalletError(err?.shortMessage || err?.message || 'Could not switch network.');
      }
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const handleCopyAddress = () => {
    if (!wallet.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleVerifyTransactionHash = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = txHashInput.trim();
    setTxVerifyError(null);
    setTxVerifyResult(null);

    if (!ethers.isHexString(cleaned, 32)) {
      setTxVerifyError('Enter a valid 66-character 32-byte EVM transaction hash (0x...).');
      return;
    }

    setIsVerifyingTx(true);
    try {
      const provider: ethers.Provider =
        browserProviderRef.current || new ethers.JsonRpcProvider('https://mainnet.base.org');

      const [tx, receipt, net] = await Promise.all([
        provider.getTransaction(cleaned),
        provider.getTransactionReceipt(cleaned),
        provider.getNetwork(),
      ]);

      if (!tx) {
        setTxVerifyError(
          `Transaction not found on ${getFriendlyNetworkName(Number(net.chainId), net.name)}. Switch to the chain where this transaction occurred.`
        );
        return;
      }

      let status: 'Confirmed' | 'Failed' | 'Pending' = 'Pending';
      if (receipt) {
        status = receipt.status === 1 ? 'Confirmed' : 'Failed';
      }

      setTxVerifyResult({
        hash: tx.hash,
        status,
        blockNumber: receipt?.blockNumber ?? tx.blockNumber ?? null,
        from: tx.from,
        to: tx.to,
        valueEth: formatEthBalance(tx.value),
        gasUsed: receipt?.gasUsed ? receipt.gasUsed.toString() : null,
        networkLabel: getFriendlyNetworkName(Number(net.chainId), net.name),
      });
    } catch (err: any) {
      setTxVerifyError(err?.shortMessage || err?.message || 'Unable to query transaction receipt from RPC.');
    } finally {
      setIsVerifyingTx(false);
    }
  };

  const handleVerifyMessageSignature = (e: React.FormEvent) => {
    e.preventDefault();
    setSigVerifyError(null);
    setSigVerifyOutput(null);

    if (!sigMessageInput.trim() || !sigSignatureInput.trim()) {
      setSigVerifyError('Provide both the original signed message and the 0x signature.');
      return;
    }

    try {
      const recovered = ethers.verifyMessage(sigMessageInput, sigSignatureInput.trim());
      const digestHash = ethers.hashMessage(sigMessageInput);
      const expected = sigExpectedAddress.trim();
      const valid = expected
        ? recovered.toLowerCase() === expected.toLowerCase()
        : ethers.isAddress(recovered);

      setSigVerifyOutput({
        valid,
        recoveredAddress: recovered,
        digestHash,
      });
    } catch (err: any) {
      setSigVerifyError(err?.shortMessage || err?.message || 'Invalid signature format or message mismatch.');
    }
  };

  const handleLoadLastVerifiedProof = () => {
    if (!wallet.verifiedChallenge || !wallet.verifiedSignature) return;
    setVerifierTab('sig');
    setSigMessageInput(wallet.verifiedChallenge);
    setSigSignatureInput(wallet.verifiedSignature);
    setSigExpectedAddress(wallet.address);
    setSigVerifyError(null);

    try {
      const result = verifyWalletSignature(wallet.verifiedChallenge, wallet.verifiedSignature, wallet.address);
      setSigVerifyOutput(result);
    } catch {
      // handled on submit
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-[#0A0A10] text-gray-200 selection:bg-[var(--accent-secondary)] selection:text-white">
      <SeoHead
        title="Web3 Wallet Verification | Vanhsya Global"
        description="Non-financial ethers.js wallet connection and cryptographic transaction/signature verification workbench for Vanhsya."
      />

      <section className="relative py-16 px-4 border-b border-white/10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-300 font-mono text-xs uppercase tracking-widest mb-6">
            <span>ethers.js Wallet & Cryptographic Verification</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black font-cinzel tracking-tight text-white mb-4">
            Web3 Verification Console
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Connect an EVM wallet via <code className="text-cyan-300">ethers.js</code> to sign ownership challenges and inspect public transaction receipts or ECDSA signatures.
          </p>

          {/* Compliance Gate Notice */}
          <div className="max-w-3xl mx-auto mb-10 p-5 rounded-2xl border border-amber-500/40 bg-amber-950/20 text-left">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              Compliance Review Notice
            </p>
            <p className="text-xs sm:text-sm text-amber-100/90 mt-1.5 leading-relaxed">
              Token-related financial promotions, staking programs, yield figures, and token distributions are disabled pending a separate regulatory compliance review. Only non-financial wallet verification tools remain active here. Looking for live events?{' '}
              <Link to="/social-club" className="underline text-white font-semibold">
                Join Vanhsya Social Club UAE →
              </Link>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {wallet.connected ? (
              <div className="flex flex-wrap items-center justify-center gap-3 px-5 py-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 font-mono text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">{wallet.providerName}</span>
                <span className="text-gray-400">•</span>
                <span>{wallet.ensName || wallet.shortAddress}</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 text-[10px]">
                  {wallet.networkName}
                </span>
                {wallet.signerVerified ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    ✓ Signer Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyOwnershipSignature}
                    disabled={isSigningAction}
                    className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold"
                  >
                    {isSigningAction ? 'Signing...' : 'Verify Ownership'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDisconnectWallet}
                  className="ml-1 text-gray-400 hover:text-white underline text-[11px]"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setWalletError(null);
                  setShowWalletModal(true);
                }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--accent-secondary)] to-cyan-500 text-white font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all"
              >
                Connect Wallet (ethers.js)
              </button>
            )}

            <Link
              to="/social-club"
              className="px-8 py-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs transition-all"
            >
              Vanhsya Social Club
            </Link>
          </div>

          {walletError && !showWalletModal && (
            <div className="mt-6 max-w-2xl mx-auto p-3 rounded-xl border border-red-500/40 bg-red-950/30 text-red-200 text-xs font-mono">
              {walletError}
            </div>
          )}

          {wallet.connected && (
            <div className="mt-8 max-w-4xl mx-auto p-5 rounded-2xl border border-emerald-500/30 bg-black/50 text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    ethers.js Connected Signer
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <code className="text-xs sm:text-sm font-mono text-white break-all">{wallet.address}</code>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono text-gray-200"
                    >
                      {copiedAddress ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div>
                    <p className="text-[10px] font-mono uppercase text-gray-400">Native Balance</p>
                    <p className="text-lg font-mono font-bold text-white">{wallet.nativeBalanceEth} ETH</p>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <p className="text-[10px] font-mono uppercase text-gray-400">Chain ID</p>
                    <p className="text-lg font-mono font-bold text-cyan-400">#{wallet.chainId}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-gray-400 mr-1">Switch Network:</span>
                  {Object.values(SUPPORTED_NETWORKS).map((net) => {
                    const isActive = wallet.chainId === net.chainIdDecimal;
                    return (
                      <button
                        key={net.chainIdDecimal}
                        type="button"
                        disabled={isSwitchingChain || isActive}
                        onClick={() => handleSwitchNetwork(net.chainIdDecimal)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                          isActive
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {net.chainName.replace(' Mainnet', '')}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {wallet.signerVerified && wallet.verifiedSignature ? (
                    <>
                      <span className="text-[11px] font-mono text-emerald-300">
                        Sig: {wallet.verifiedSignature.slice(0, 14)}... ({wallet.verifiedAt})
                      </span>
                      <button
                        type="button"
                        onClick={handleLoadLastVerifiedProof}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono text-emerald-300"
                      >
                        Inspect Proof ↓
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVerifyOwnershipSignature}
                      disabled={isSigningAction}
                      className="px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-xs font-mono text-purple-300"
                    >
                      {isSigningAction ? 'Waiting for Wallet...' : 'Sign Ownership Challenge'}
                    </button>
                  )}
                </div>
              </div>
              {walletSyncNotice && (
                <div className="mt-3 pt-3 border-t border-white/10 text-[11px] font-mono text-emerald-300">
                  ✓ {walletSyncNotice}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-10">
        {(vynoProfile || loadingLedger) && (
          <AnimateOnScroll>
            <div className="p-6 md:p-8 rounded-3xl border border-purple-500/30 bg-[#120D1F] space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-amber-400/40 bg-amber-950/30 text-amber-200 text-[11px] font-mono font-bold uppercase tracking-wider">
                    {vynoStatus?.tokenDistributionEnabled
                      ? 'Contract Compliance Verified'
                      : 'Token Payouts Disabled Pending Compliance Review'}
                  </span>
                  <h2 className="text-2xl font-cinzel font-bold text-white mt-3">
                    Connected Wallet Participation Ledger
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {vynoProfile
                      ? `Account Key: ${vynoProfile.accountKey}${
                          vynoProfile.walletAddress ? ` • Wallet: ${formatShortAddress(vynoProfile.walletAddress)}` : ''
                        }`
                      : 'Loading participation ledger...'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/daily-rewards"
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    Participation Arcade →
                  </Link>
                  <Link
                    to="/refer-and-earn"
                    className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-semibold"
                  >
                    Refer Friends (+50 pts)
                  </Link>
                </div>
              </div>

              {vynoProfile && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                      <p className="text-gray-400 uppercase text-[10px] font-mono">Participation Balance</p>
                      <p className="text-2xl font-black text-purple-300 mt-1">
                        {vynoProfile.pointsBalance} <span className="text-xs font-normal text-gray-400">PTS</span>
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                      <p className="text-gray-400 uppercase text-[10px] font-mono">Lifetime Points</p>
                      <p className="text-2xl font-black text-white mt-1">{vynoProfile.lifetimePoints}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                      <p className="text-gray-400 uppercase text-[10px] font-mono">Check-In Streak</p>
                      <p className="text-2xl font-black text-emerald-300 mt-1">{vynoProfile.checkinStreak}d</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                      <p className="text-gray-400 uppercase text-[10px] font-mono">Referral Code</p>
                      <p className="text-sm font-mono font-bold text-cyan-300 mt-2">{vynoProfile.referralCode}</p>
                    </div>
                  </div>

                  {vynoLedger.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                        Recent Server-Recorded Activity ({vynoLedger.length})
                      </p>
                      <div className="space-y-2">
                        {vynoLedger.slice(0, 5).map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <span className="font-mono text-purple-300 mr-2">{entry.entryRef}</span>
                              <span className="text-white">{entry.description}</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                              <span className={entry.pointsDelta >= 0 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                                {entry.pointsDelta >= 0 ? `+${entry.pointsDelta}` : entry.pointsDelta} PTS
                              </span>
                              <span className="text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-black/30 border border-dashed border-white/10 text-xs text-gray-400">
                      No participation points recorded yet for this wallet or account. Visit the{' '}
                      <Link to="/daily-rewards" className="text-purple-300 underline">
                        Participation Points Arcade
                      </Link>{' '}
                      to earn verified daily points.
                    </div>
                  )}
                </>
              )}
            </div>
          </AnimateOnScroll>
        )}
        <AnimateOnScroll>
          <div id="tx-verifier" className="p-6 md:p-10 rounded-3xl border border-cyan-500/25 bg-[#0F1018] space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-cyan-400">
                  ethers.js Security Console
                </span>
                <h2 className="text-2xl md:text-4xl font-black font-cinzel text-white mt-2">
                  Transaction & Signature Verification
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Verify EVM transaction receipts or recover signer addresses from ECDSA signatures.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-black/50 p-1 rounded-xl border border-white/10 self-start">
                <button
                  type="button"
                  onClick={() => setVerifierTab('tx')}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold ${
                    verifierTab === 'tx'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tx Hash Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setVerifierTab('sig')}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold ${
                    verifierTab === 'sig'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Signature Proof
                </button>
              </div>
            </div>

            {verifierTab === 'tx' ? (
              <form onSubmit={handleVerifyTransactionHash} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={txHashInput}
                    onChange={(e) => setTxHashInput(e.target.value)}
                    placeholder="Paste 66-char EVM Tx Hash (0x...)"
                    className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingTx}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold uppercase tracking-wider text-xs disabled:opacity-60 shrink-0"
                  >
                    {isVerifyingTx ? 'Querying RPC...' : 'Verify Tx Receipt'}
                  </button>
                </div>

                {txVerifyError && (
                  <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/30 text-red-200 text-xs font-mono">
                    {txVerifyError}
                  </div>
                )}

                {txVerifyResult && (
                  <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <p className="text-gray-400 uppercase text-[10px]">Status</p>
                      <p className="text-emerald-400 font-bold text-sm mt-0.5">{txVerifyResult.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[10px]">Network & Block</p>
                      <p className="text-white mt-0.5">
                        {txVerifyResult.networkLabel} • #{txVerifyResult.blockNumber ?? 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[10px]">Native Value</p>
                      <p className="text-cyan-300 font-bold mt-0.5">{txVerifyResult.valueEth} ETH</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[10px]">From</p>
                      <p className="text-gray-200 truncate mt-0.5">{txVerifyResult.from}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[10px]">To</p>
                      <p className="text-gray-200 truncate mt-0.5">{txVerifyResult.to || 'Contract Creation'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[10px]">Gas Used</p>
                      <p className="text-gray-200 mt-0.5">{txVerifyResult.gasUsed || '—'}</p>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleVerifyMessageSignature} className="space-y-4">
                <textarea
                  rows={4}
                  value={sigMessageInput}
                  onChange={(e) => setSigMessageInput(e.target.value)}
                  placeholder="Original signed challenge message..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={sigSignatureInput}
                    onChange={(e) => setSigSignatureInput(e.target.value)}
                    placeholder="ECDSA Signature (0x...)"
                    className="bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                  />
                  <input
                    type="text"
                    value={sigExpectedAddress}
                    onChange={(e) => setSigExpectedAddress(e.target.value)}
                    placeholder="Expected Signer Address (optional 0x...)"
                    className="bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-secondary)] to-cyan-500 text-white font-bold uppercase tracking-wider text-xs"
                >
                  Verify Cryptographic Signature
                </button>

                {sigVerifyError && (
                  <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/30 text-red-200 text-xs font-mono">
                    {sigVerifyError}
                  </div>
                )}

                {sigVerifyOutput && (
                  <div
                    className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                      sigVerifyOutput.valid
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                        : 'border-red-500/40 bg-red-950/30 text-red-200'
                    }`}
                  >
                    <p className="font-bold text-sm">
                      {sigVerifyOutput.valid
                        ? '✓ Signature Valid — Signer Recovered & Verified'
                        : '✕ Verification Failed — Signer Does Not Match Expected Address'}
                    </p>
                    <p className="break-all">Recovered Signer: {sigVerifyOutput.recoveredAddress}</p>
                    <p className="break-all text-gray-400">EIP-191 Digest: {sigVerifyOutput.digestHash}</p>
                  </div>
                )}
              </form>
            )}

            {verifiedLogs.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">
                  Recent Verified Session Proofs ({verifiedLogs.length})
                </h3>
                <div className="space-y-2">
                  {verifiedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-white/10 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div className="min-w-0">
                        <span className="text-emerald-400 font-bold mr-2">✓ {log.id}</span>
                        <span className="text-white">{log.action}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 shrink-0">
                        <span>Signer: {formatShortAddress(log.recoveredAddress)}</span>
                        <span>Digest: {log.digestHash.slice(0, 10)}...</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AnimateOnScroll>

        {/* Official Channels & Ecosystem Strip */}
        <div className="mt-10 p-6 rounded-3xl border border-white/10 bg-[#120D1F] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
              Vanhsya Platform & Direct Support
            </p>
            <p className="text-xs text-gray-400">
              Need booking assistance or Web3 verification support? Reach our concierge or explore The Blueprint & MeetUps.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <Link
              to="/treasure-hunt"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-white font-semibold"
            >
              The Blueprint
            </Link>
            <Link
              to="/whitepaper"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-white font-semibold"
            >
              Whitepaper
            </Link>
            <a
              href={buildWhatsAppDirectEnquiryUrl('Hello Vanhsya Web3 & Concierge Desk, I need help with wallet verification or bookings.')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              WhatsApp {BRAND_CONTACTS.whatsappDisplay}
            </a>
            <a
              href={BRAND_CONTACTS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-purple-600/25 border border-purple-400/40 hover:bg-purple-600/40 text-purple-200 font-semibold"
            >
              {BRAND_CONTACTS.instagramHandle}
            </a>
            <a
              href={BRAND_CONTACTS.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-gray-200 font-semibold"
            >
              {BRAND_CONTACTS.websiteDisplay}
            </a>
          </div>
        </div>
      </div>

      <ConnectWalletModal
        isOpen={showWalletModal}
        isConnecting={isConnectingWallet}
        error={walletError}
        onClose={() => setShowWalletModal(false)}
        onSelectProvider={handleSelectWalletProvider}
      />
    </div>
  );
};

export default VynoWeb3Page;
