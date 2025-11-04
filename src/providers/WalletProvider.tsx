'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import dynamic from 'next/dynamic';

interface WalletProviderProps {
  children: ReactNode;
}

// Dynamically import the WalletModalProvider with no SSR
const WalletModalProvider = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletModalProvider,
  { ssr: false }
);

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  // You can also provide a custom RPC endpoint
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading
  // Ensure wallets have unique names to avoid duplicate key errors
  // Use plain object instead of Map to avoid serialization issues
  // Only create wallets on the client side to avoid Set serialization issues
  const wallets = useMemo(() => {
    // Only create wallets on the client side
    if (typeof window === 'undefined') {
      return [];
    }
    
    const walletAdapters = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ];
    
    // Use plain object to track unique wallets by name (avoids Map serialization issues)
    const uniqueWallets: Record<string, typeof walletAdapters[0]> = {};
    const result: typeof walletAdapters = [];
    
    walletAdapters.forEach(wallet => {
      const name = wallet.name || wallet.constructor.name;
      // Only add if we haven't seen this wallet name before
      if (!uniqueWallets[name]) {
        uniqueWallets[name] = wallet;
        result.push(wallet);
      } else {
        console.warn(`Duplicate wallet detected and filtered: ${name}`);
      }
    });
    
    return result;
  }, []);

  // Always render the provider structure, but wallets will be empty array during SSR
  // This prevents context errors while avoiding Set serialization
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={typeof window !== 'undefined'}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}; 