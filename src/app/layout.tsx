import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, DM_Mono } from "next/font/google";
import ClientProviders from "./ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeedBlock",
  description: "Powered By Project BlockChain",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "DeedBlock",
    description: "Powered By Project BlockChain",
    type: "website",
    siteName: "DeedBlock",
    images: ["/logo2.png"],
  },
  twitter: {
    card: "summary",
    title: "DeedBlock",
    description: "Powered By Project BlockChain",
    images: ["/logo2.png"],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"), // Set base URL for metadata resolving
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        {/* Material Symbols - using next/font/google for Lexend Deca, external for Material Symbols only */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=eye_tracking&display=block"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${dmSans.variable} ${dmMono.variable} antialiased bg-white text-black transition-colors font-sans`}
        suppressHydrationWarning
      >
        <ClientProviders>
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </ClientProviders>
      </body>
    </html>
  );
}
