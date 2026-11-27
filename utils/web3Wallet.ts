import { ethers } from 'ethers';

export interface Eip1193Provider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isPhantom?: boolean;
  isBraveWallet?: boolean;
  isRabby?: boolean;
  providers?: Eip1193Provider[];
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
    phantom?: {
      ethereum?: Eip1193Provider;
    };
  }
}

export type WalletProviderId = 'metamask' | 'coinbase' | 'phantom' | 'browser' | 'demo';

export interface ConnectedWalletState {
  connected: boolean;
  isDemo: boolean;
  providerId: WalletProviderId | null;
  providerName: string;
  address: string;
  shortAddress: string;
  ensName: string | null;
  chainId: number;
  networkName: string;
  nativeBalanceEth: string;
  verifiedSignature: string | null;
  verifiedChallenge: string | null;
  verifiedAt: string | null;
  signerVerified: boolean;
}

export interface TargetNetworkConfig {
  chainIdHex: string;
  chainIdDecimal: number;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorerUrls: string[];
}

export const SUPPORTED_NETWORKS: Record<number, TargetNetworkConfig> = {
  1: {
    chainIdHex: '0x1',
    chainIdDecimal: 1,
    chainName: 'Ethereum Mainnet',
    rpcUrls: ['https://cloudflare-eth.com'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://etherscan.io'],
  },
  8453: {
    chainIdHex: '0x2105',
    chainIdDecimal: 8453,
    chainName: 'Base Mainnet',
    rpcUrls: ['https://mainnet.base.org'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://basescan.org'],
  },
  42161: {
    chainIdHex: '0xa4b1',
    chainIdDecimal: 42161,
    chainName: 'Arbitrum One',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  11155111: {
    chainIdHex: '0xaa36a7',
    chainIdDecimal: 11155111,
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://rpc.sepolia.org'],
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
};

export const formatShortAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getFriendlyNetworkName = (chainId: number, fallbackName?: string): string => {
  if (SUPPORTED_NETWORKS[chainId]) {
    return SUPPORTED_NETWORKS[chainId].chainName;
  }
  const extraNames: Record<number, string> = {
    10: 'OP Mainnet',
    137: 'Polygon',
    56: 'BNB Smart Chain',
    43114: 'Avalanche C-Chain',
    31337: 'Hardhat Local',
    1337: 'Local Testnet',
  };
  if (extraNames[chainId]) return extraNames[chainId];
  if (fallbackName && fallbackName !== 'unknown') {
    return fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
  }
  return `Chain #${chainId}`;
};

export const detectAvailableProviders = (): Record<WalletProviderId, boolean> => {
  if (typeof window === 'undefined') {
    return { metamask: false, coinbase: false, phantom: false, browser: false, demo: true };
  }

  const eth = window.ethereum;
  const subProviders = Array.isArray(eth?.providers) ? eth!.providers : eth ? [eth] : [];

  const hasMetaMask = subProviders.some((p) => p.isMetaMask && !p.isBraveWallet && !p.isRabby);
  const hasCoinbase = subProviders.some((p) => p.isCoinbaseWallet);
  const hasPhantom = Boolean(window.phantom?.ethereum) || subProviders.some((p) => p.isPhantom);
  const hasBrowser = Boolean(eth);

  return {
    metamask: hasMetaMask,
    coinbase: hasCoinbase,
    phantom: hasPhantom,
    browser: hasBrowser,
    demo: true,
  };
};

export const resolveEip1193Provider = (walletId: WalletProviderId): Eip1193Provider | null => {
  if (typeof window === 'undefined') return null;

  if (walletId === 'phantom' && window.phantom?.ethereum) {
    return window.phantom.ethereum;
  }

  const eth = window.ethereum;
  if (!eth) return null;

  const subProviders = Array.isArray(eth.providers) ? eth.providers : [eth];

  if (walletId === 'metamask') {
    return (
      subProviders.find((p) => p.isMetaMask && !p.isBraveWallet && !p.isRabby) ||
      (eth.isMetaMask ? eth : null)
    );
  }

  if (walletId === 'coinbase') {
    return subProviders.find((p) => p.isCoinbaseWallet) || (eth.isCoinbaseWallet ? eth : null);
  }

  if (walletId === 'phantom') {
    return subProviders.find((p) => p.isPhantom) || null;
  }

  return eth;
};

export const createVerificationChallenge = (params: {
  address: string;
  chainId: number;
  action: string;
  details?: string;
}): string => {
  const nonce = ethers.hexlify(ethers.randomBytes(8));
  const issuedAt = new Date().toISOString();

  return [
    'Vanhsya Web3 Protocol — Secure Verification',
    `Action: ${params.action}`,
    params.details ? `Details: ${params.details}` : null,
    `Wallet Address: ${params.address}`,
    `Chain ID: ${params.chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ]
    .filter(Boolean)
    .join('\n');
};

export const verifyWalletSignature = (
  message: string,
  signature: string,
  expectedAddress: string
): { valid: boolean; recoveredAddress: string; digestHash: string } => {
  const recoveredAddress = ethers.verifyMessage(message, signature);
  const digestHash = ethers.hashMessage(message);
  return {
    valid: recoveredAddress.toLowerCase() === expectedAddress.toLowerCase(),
    recoveredAddress,
    digestHash,
  };
};

export const formatEthBalance = (wei: bigint): string => {
  const ethStr = ethers.formatEther(wei);
  const num = Number(ethStr);
  if (Number.isNaN(num)) return '0.0000';
  if (num === 0) return '0.0000';
  if (num < 0.0001) return '<0.0001';
  return num.toFixed(4);
};

export const switchOrAddNetwork = async (
  rawProvider: Eip1193Provider,
  targetChainId: number
): Promise<void> => {
  const config = SUPPORTED_NETWORKS[targetChainId];
  if (!config) {
    throw new Error(`Unsupported target chain ID: ${targetChainId}`);
  }

  try {
    await rawProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: config.chainIdHex }],
    });
  } catch (switchErr: any) {
    // 4902 = Chain not added to wallet yet
    if (switchErr?.code === 4902 && targetChainId !== 1) {
      await rawProvider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: config.chainIdHex,
            chainName: config.chainName,
            rpcUrls: config.rpcUrls,
            nativeCurrency: config.nativeCurrency,
            blockExplorerUrls: config.blockExplorerUrls,
          },
        ],
      });
    } else {
      throw switchErr;
    }
  }
};
