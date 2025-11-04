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
    <div className="min-h-screen bg-black relative">
      {/* Beta-116 Badge - Top Left */}
      <div className={`${dmSansClassName} fixed top-0 left-0 z-50 px-2 sm:px-3 py-1 text-gray-400 text-[10px] sm:text-sm font-medium`}>
        Beta-116
      </div>
      <Header />
      {children}
    </div>
  );
} 