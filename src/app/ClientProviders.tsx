'use client';

import { ReactNode, useState, useEffect } from 'react';

import LayoutContent from "./LayoutContent";

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always render the provider structure to prevent context errors
  // Children will be rendered after mount to avoid Set serialization issues
  return (
    <>
      <LayoutContent>
        {mounted ? children : null}
      </LayoutContent>
    </>
  );
}

