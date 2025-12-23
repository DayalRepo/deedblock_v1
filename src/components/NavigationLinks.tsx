'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, HelpCircle, MessageSquare, ChevronDown } from 'lucide-react';
import SignInButton from './SignInButton';


export default function NavigationLinks() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mobileMoreRef = useRef<HTMLDivElement>(null);
  const desktopMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(event.target as Node)) {
        setIsMobileMoreOpen(false);
      }
      if (desktopMoreRef.current && !desktopMoreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button and Sign Button */}
      <div className="sm:hidden flex items-center gap-2">
        <button
          onClick={toggleMenu}
          className="p-2 rounded-lg bg-white"
          aria-label="Toggle menu"
        >
          <Menu size={24} className="text-black" />
        </button>
        <SignInButton />
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 sm:hidden" onClick={toggleMenu} />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed top-0 right-0 w-full min-h-screen h-full bg-white z-50 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
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
          <div className="flex flex-col space-y-3 items-start">
            <Link
              href="/"
              className={` nav-link ${pathname === '/' ? 'nav-link-active' : ''
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>

            <Link
              href="/registration"
              className={` nav-link ${pathname === '/registration' ? 'nav-link-active' : ''
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Registry
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
          <div className="mt-4 mb-20 relative" ref={mobileMoreRef}>
            <button
              onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
              className={`more-button `}
            >
              <div className={`more-button-content ${isMobileMoreOpen ? 'text-gray-500' : 'text-gray-500'
                }`}>
                <div className="flex items-center gap-0.5">
                  More
                  <ChevronDown
                    size={12}
                    className={`transform transition-transform duration-200 ${isMobileMoreOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
            </button>
            {isMobileMoreOpen && (
              <div className="absolute top-full left-0 mt-2 w-36 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                <div className="flex justify-end px-2 pt-2 pb-1">
                  <button
                    onClick={() => setIsMobileMoreOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={16} className="text-black" />
                  </button>
                </div>
                <div className="border-b-2 border-dashed border-gray-200 mb-1"></div>

                <Link
                  href="/help"
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor" className="text-[#808080]">
                      <path d="M424-320q0-81 14.5-116.5T500-514q41-36 62.5-62.5T584-637q0-41-27.5-68T480-732q-51 0-77.5 31T365-638l-103-44q21-64 77-111t141-47q105 0 161.5 58.5T698-641q0 50-21.5 85.5T609-475q-49 47-59.5 71.5T539-320H424Zm56 240q-33 0-56.5-23.5T400-160q0-33 23.5-56.5T480-240q33 0 56.5 23.5T560-160q0 33-23.5 56.5T480-80Z" />
                    </svg>
                  </div>
                  <span className="text-sm font-normal text-black whitespace-nowrap">Help Center</span>
                </Link>
                <div className="border-b-2 border-dashed border-gray-200 mx-3"></div>

                <Link
                  href="/feedback"
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 mb-1"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <MessageSquare size={14} className="text-[#808080]" />
                  </div>
                  <span className="text-sm font-normal text-black">Feedback</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center justify-center space-x-8 w-full">

        <Link
          href="/registration"
          className={` ${pathname === '/registration' ? 'text-gray-500' : 'text-gray-500'} text-[17px] font-normal pb-1 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-gray-500 after:origin-center after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 ${pathname === '/registration' ? 'after:scale-x-100' : ''}
            }`}
        >
          Registry
        </Link>
        <Link
          href="/search"
          className={` ${pathname === '/search' ? 'text-gray-500' : 'text-gray-500'} text-[17px] font-normal pb-1 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-gray-500 after:origin-center after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 ${pathname === '/search' ? 'after:scale-x-100' : ''}
            }`}
        >
          Search
        </Link>
        <div className="relative flex items-center h-full" ref={desktopMoreRef}>
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={` ${isMoreOpen ? 'text-gray-500' : 'text-gray-500'} text-[17px] font-normal flex items-center gap-0.5 -mt-1`}
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
            <div className="absolute top-full right-[-60px] mt-2 w-36 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
              <div className="flex justify-end px-2 pt-2 pb-1">
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={16} className="text-black" />
                </button>
              </div>
              <div className="border-b-2 border-dashed border-gray-200 mb-1"></div>

              <Link
                href="/help"
                onClick={() => setIsMoreOpen(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor" className="text-[#808080]">
                    <path d="M424-320q0-81 14.5-116.5T500-514q41-36 62.5-62.5T584-637q0-41-27.5-68T480-732q-51 0-77.5 31T365-638l-103-44q21-64 77-111t141-47q105 0 161.5 58.5T698-641q0 50-21.5 85.5T609-475q-49 47-59.5 71.5T539-320H424Zm56 240q-33 0-56.5-23.5T400-160q0-33 23.5-56.5T480-240q33 0 56.5 23.5T560-160q0 33-23.5 56.5T480-80Z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-black whitespace-nowrap">Help Center</span>
              </Link>
              <div className="border-b-2 border-dashed border-gray-200 mx-3"></div>

              <Link
                href="/feedback"
                onClick={() => setIsMoreOpen(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 mb-1"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <MessageSquare size={14} className="text-[#808080]" />
                </div>
                <span className="text-sm font-medium text-black">Feedback</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 