'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, HelpCircle, MessageSquare } from 'lucide-react';
import WalletConnectButton from './WalletConnectButton';


export default function NavigationLinks() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button and Sign Button */}
      <div className="sm:hidden flex items-center gap-2">
        <button
          onClick={toggleMenu}
          className="p-2 rounded-lg bg-[#FAF9F6]"
          aria-label="Toggle menu"
        >
          <Menu size={20} className="text-black" />
        </button>
        <WalletConnectButton />
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 sm:hidden" onClick={toggleMenu} />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed top-0 right-0 w-full min-h-screen h-full bg-[#FAF9F6] z-50 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          } transition-transform duration-500 ease-in-out sm:hidden overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-dashed border-gray-200">
          <div></div>
          <button
            onClick={toggleMenu}
            className="p-2"
            aria-label="Close menu"
          >
            <X size={20} className="text-black" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="px-4 py-4">
          {/* Navigation Links */}
          <div className="flex flex-col space-y-3">
            <Link
              href="/registration"
              className={` nav-link ${pathname === '/registration' ? 'nav-link-active' : ''
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Registration
            </Link>
            <Link
              href="/search"
              className={` nav-link ${pathname === '/search' ? 'nav-link-active' : ''
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Search
            </Link>
          </div>

          {/* More Section */}
          <div className="mt-4 mb-20">
            <button
              onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
              className={`more-button `}
            >
              <div className={`more-button-content ${isMobileMoreOpen ? 'nav-link-active' : ''
                }`}>
                <div className="flex items-center gap-0.5">
                  More
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transform transition-transform duration-200 ${isMobileMoreOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </button>
            {isMobileMoreOpen && (
              <div className="more-dropdown">
                <div className="py-1">
                  <div className="dropdown-header">

                    <button
                      onClick={() => setIsMobileMoreOpen(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X size={18} className="text-black" />
                    </button>
                  </div>

                  <Link
                    href="/help"
                    onClick={() => {
                      setIsMobileMoreOpen(false);
                      setIsMenuOpen(false);
                    }}
                    className="dropdown-item block no-underline"
                  >
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor" className="text-black">
                        <path d="M424-320q0-81 14.5-116.5T500-514q41-36 62.5-62.5T584-637q0-41-27.5-68T480-732q-51 0-77.5 31T365-638l-103-44q21-64 77-111t141-47q105 0 161.5 58.5T698-641q0 50-21.5 85.5T609-475q-49 47-59.5 71.5T539-320H424Zm56 240q-33 0-56.5-23.5T400-160q0-33 23.5-56.5T480-240q33 0 56.5 23.5T560-160q0 33-23.5 56.5T480-80Z" />
                      </svg>
                      <div className="dropdown-title">Help Center</div>
                    </div>
                    <div className="dropdown-description ml-6">Get support and answers</div>
                  </Link>

                  <Link
                    href="/feedback"
                    onClick={() => {
                      setIsMobileMoreOpen(false);
                      setIsMenuOpen(false);
                    }}
                    className="dropdown-item rounded-b-lg block no-underline"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-black" />
                      <div className="dropdown-title">Feedback</div>
                    </div>
                    <div className="dropdown-description ml-6">Share your thoughts with us</div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center justify-center space-x-8 w-full">
        <Link
          href="/registration"
          className={` text-black text-[17px] ${pathname === '/registration' ? 'font-medium' : 'font-normal'
            } hover:text-black relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-black after:origin-center after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 pb-1 ${pathname === '/registration' ? 'after:scale-x-100' : ''
            }`}
        >
          Registration
        </Link>
        <Link
          href="/search"
          className={` text-black text-[17px] ${pathname === '/search' ? 'font-medium' : 'font-normal'
            } hover:text-black relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-black after:origin-center after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 pb-1 ${pathname === '/search' ? 'after:scale-x-100' : ''
            }`}
        >
          Search
        </Link>
        <div className="relative flex items-center h-full">
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={` text-black text-[17px] font-normal flex items-center gap-0.5 hover:text-black -mt-1`}
          >
            More
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transform transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {isMoreOpen && (
            <div className="absolute top-full right-[-130px] mt-2 w-48 bg-[#FAF9F6] rounded-lg shadow-lg py-1 z-50 border border-gray-200">
              <div className="dropdown-header">

                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} className="text-black" />
                </button>
              </div>

              <Link
                href="/help"
                onClick={() => setIsMoreOpen(false)}
                className="dropdown-item block no-underline"
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor" className="text-black">
                    <path d="M424-320q0-81 14.5-116.5T500-514q41-36 62.5-62.5T584-637q0-41-27.5-68T480-732q-51 0-77.5 31T365-638l-103-44q21-64 77-111t141-47q105 0 161.5 58.5T698-641q0 50-21.5 85.5T609-475q-49 47-59.5 71.5T539-320H424Zm56 240q-33 0-56.5-23.5T400-160q0-33 23.5-56.5T480-240q33 0 56.5 23.5T560-160q0 33-23.5 56.5T480-80Z" />
                  </svg>
                  <div className="dropdown-title">Help Center</div>
                </div>
                <div className="dropdown-description ml-6">Get support and answers</div>
              </Link>

              <Link
                href="/feedback"
                onClick={() => setIsMoreOpen(false)}
                className="dropdown-item block no-underline"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-black" />
                  <div className="dropdown-title">Feedback</div>
                </div>
                <div className="dropdown-description ml-6">Share your thoughts with us</div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 