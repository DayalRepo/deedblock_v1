'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';


// Dynamically import the WalletMultiButton with no SSR
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function WalletConnectButton() {
  const { connected, publicKey } = useWallet();

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 3)}...${address.slice(-3)}`;
  };

  return (
    <div>
      <WalletMultiButton
        style={{
          backgroundColor: 'black',
          fontWeight: 400,
          color: 'white'
        }}
        className={`text-white w-24 px-3 py-0.5 text-xs sm:w-32 sm:px-4 sm:py-1.5 sm:text-sm rounded-full transition-colors tracking-tighter font-normal hover:bg-gray-800`}
      >
        {connected && publicKey ? formatAddress(publicKey.toString()) : 'Connect'}
      </WalletMultiButton>
    </div>
  );
} 