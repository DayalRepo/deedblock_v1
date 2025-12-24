'use client';

import Header from "../components/Header";
import { DM_Sans } from 'next/font/google';
import { useMemo } from 'react';

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  // Extract only serializable className property using useMemo to ensure it's only computed on client
  const dmSansClassName = useMemo(() => dmSans.className, []);

  return (
    <div className="min-h-screen bg-white relative">
      <Header />
      {children}
    </div>
  );
}
