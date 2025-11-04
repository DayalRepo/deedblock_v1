'use client';

import { DM_Sans } from "next/font/google";
import { Lexend_Deca } from "next/font/google";
import { useEffect } from "react";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const lexendDeca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export default function ClientFontLoader() {
  useEffect(() => {
    // Apply font variables to the body element on the client side
    const dmSansVariable = dmSans.variable;
    const lexendDecaVariable = lexendDeca.variable;
    
    if (typeof document !== 'undefined') {
      const bodyClasses = document.body.className.split(' ').filter(Boolean);
      // Remove any existing font variable classes and add the new ones
      const filteredClasses = bodyClasses.filter(c => !c.startsWith('--font-'));
      const newClasses = [dmSansVariable, lexendDecaVariable, ...filteredClasses];
      document.body.className = newClasses.join(' ');
    }
  }, []);

  // Return null - fonts are injected automatically by Next.js
  // The useEffect handles applying the classes
  return null;
}

