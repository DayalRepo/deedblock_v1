'use client';

import { useEffect } from 'react';

/**
 * Suppresses the duplicate MetaMask key error from @solana/wallet-adapter-react-ui
 * This is a known library issue where WalletModal auto-detects MetaMask twice
 */
export default function WalletErrorSuppressor() {
  useEffect(() => {
    const originalError = console.error;
    
    console.error = (...args: any[]) => {
      const errorMessage = args.join(' ');
      // Suppress the specific duplicate key error for MetaMask
      if (errorMessage.includes('Encountered two children with the same key') && 
          errorMessage.includes('MetaMask')) {
        return; // Suppress this specific error
      }
      originalError.apply(console, args);
    };

    // Restore original console.error on unmount
    return () => {
      console.error = originalError;
    };
  }, []);

  return null; // This component doesn't render anything
}

