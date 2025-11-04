import type { Metadata } from "next";
import { Suspense } from "react";
import ClientFontLoader from "./ClientFontLoader";
import ClientProviders from "./ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "TITLEREG",
  description: "Secure, transparent, and immutable property registration and verification system powered by blockchain technology for Indian land and real estate transactions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Material Symbols - using next/font/google for Lexend Deca, external for Material Symbols only */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=eye_tracking"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className="antialiased bg-black text-white transition-colors"
        suppressHydrationWarning
      >
        <ClientFontLoader />
        <ClientProviders>
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </ClientProviders>
      </body>
    </html>
  );
}
