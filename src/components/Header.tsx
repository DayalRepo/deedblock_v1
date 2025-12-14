'use client';

import Image from "next/image";
import Link from "next/link";
import NavigationLinks from "./NavigationLinks";
import WalletConnectButton from "./WalletConnectButton";

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <Link href="/" className="logo-link">
            <img
              src="/logo2.png"
              alt="Logo"
              className="logo-image"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="desktop-nav">
          <NavigationLinks />
        </div>

        {/* Desktop Actions */}
        <div className="desktop-actions">
          <WalletConnectButton />
        </div>

        {/* Mobile Navigation */}
        <div className="mobile-nav">
          <NavigationLinks />
        </div>
      </div>
    </header>
  );
} 