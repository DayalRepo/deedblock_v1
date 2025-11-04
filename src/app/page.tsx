'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Lexend_Deca, DM_Sans } from 'next/font/google';

// Lazy load the GIF component for faster initial load
const VideoGif = dynamic(() => Promise.resolve(({ className }: { className?: string }) => (
  <img
    src="/video.gif"
    alt="Video demonstration"
    className={className}
    loading="lazy"
  />
)), { ssr: false });

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Title suffix typing animation component
function TitleSuffixAnimation() {
  const suffixes = ["REGISTER", "VERIFY", "SEARCH"];
  const [currentSuffixIndex, setCurrentSuffixIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentSuffix = suffixes[currentSuffixIndex];
    
    if (!isDeleting && currentIndex < currentSuffix.length) {
      // Typing
      const timeout = setTimeout(() => {
        setDisplayedText(currentSuffix.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timeout);
    } else if (!isDeleting && currentIndex === currentSuffix.length) {
      // Finished typing, wait before deleting
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentIndex > 0) {
      // Deleting
      const timeout = setTimeout(() => {
        setDisplayedText(currentSuffix.slice(0, currentIndex - 1));
        setCurrentIndex(prev => prev - 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentIndex === 0) {
      // Finished deleting, move to next suffix
      setIsDeleting(false);
      setCurrentSuffixIndex((prev) => (prev + 1) % suffixes.length);
    }
  }, [currentIndex, isDeleting, currentSuffixIndex]);

  return (
    <span className={`${dmSans.className} text-gray-400`}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// Typing animation component with looping every 5 seconds and 2 lines
function TypingAnimation({ lines, speed = 50 }: { lines: string[]; speed?: number }) {
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentLine < lines.length) {
      const currentLineText = lines[currentLine];
      
      if (currentIndex < currentLineText.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(prev => prev + currentLineText[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timeout);
      } else if (currentIndex === currentLineText.length && currentLine < lines.length - 1) {
        // Move to next line
        const nextLineTimeout = setTimeout(() => {
          setDisplayedText(prev => prev + '\n');
          setCurrentLine(prev => prev + 1);
          setCurrentIndex(0);
        }, 300); // Small delay between lines

        return () => clearTimeout(nextLineTimeout);
      } else {
        // All lines are complete, wait and reset after 5 seconds
        const resetTimeout = setTimeout(() => {
          setDisplayedText('');
          setCurrentLine(0);
          setCurrentIndex(0);
        }, 5000);

        return () => clearTimeout(resetTimeout);
      }
    }
  }, [currentLine, currentIndex, lines, speed]);

  return (
    <span className="whitespace-pre-line">
      <span className="text-gray-400 text-lg font-medium mr-2">{'{'}</span>
      {displayedText}
      <span className="animate-pulse">|</span>
      <span className="text-gray-400 text-lg font-medium ml-2">{'}'}</span>
    </span>
  );
}

export default function Home() {
  const descriptionLines = [
    "Secure land title registration and verification system",
    "powered by blockchain technology for transparent and legally compliant property transactions."
  ];

  return (
    <main className={`${lexendDeca.className} flex flex-col min-h-screen bg-black text-white pt-32 sm:pt-28 lg:pt-48`}>
      <div className="flex-1 px-3 sm:px-6 lg:px-36 pb-16">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 lg:gap-4">
          {/* Hero Section - Centered Below Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-[45%] flex flex-col items-center lg:items-start lg:pt-8"
          >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 w-full"
          >
            <h1 className={`${dmSans.className} text-4xl sm:text-5xl lg:text-6xl font-light mb-6 leading-tight text-center lg:text-left`}>
              <span className="text-white">TITLE</span>
              <TitleSuffixAnimation />
            </h1>
            
            {/* Feature Badges - Minimal Design */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-6"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                <div className="relative px-4 py-1.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg">
                  <span className={`${dmSans.className} text-xs font-medium text-gray-300 group-hover:text-green-400 transition-colors`}>
                    Immutable Records
                  </span>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                <div className="relative px-4 py-1.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg">
                  <span className={`${dmSans.className} text-xs font-medium text-gray-300 group-hover:text-blue-400 transition-colors`}>
                    IPFS Decentralized
                  </span>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                <div className="relative px-4 py-1.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg">
                  <span className={`${dmSans.className} text-xs font-medium text-gray-300 group-hover:text-purple-400 transition-colors`}>
                    Verified & Legal
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8 max-w-2xl"
          >
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed text-center lg:text-left">
              Powered by Project blockchain for revolutionizing Indian land and real estate transactions.
            </p>
          </motion.div>
          
          {/* Action Buttons - Centered, Same Size, Both White */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 items-center lg:items-start w-full"
          >
            <Link
              href="/registration"
              className="w-[160px] px-8 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all hover:scale-105 text-center shadow-lg"
            >
              Registration
            </Link>
            <Link
              href="/search"
              className="w-[160px] px-8 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all hover:scale-105 text-center shadow-lg"
            >
              Search
            </Link>
          </motion.div>
        </motion.div>
          
          {/* GIF Section - Centered Below Connect Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full lg:w-[45%] flex justify-center lg:justify-end items-center mt-8 lg:mt-0 lg:pt-8"
          >
            <Suspense fallback={<div className="w-full h-64 bg-gray-900 rounded-md animate-pulse" />}>
              <VideoGif className="rounded-md border-2 border-white/20 max-w-full h-auto lg:scale-110" />
            </Suspense>
          </motion.div>
        </div>
      </div>
      
      {/* Copyright Footer */}
      <footer className="mt-auto pt-6 sm:pt-8 pb-2 sm:pb-3 text-center">
        <p className="text-gray-500 text-xs sm:text-sm">
          © Copyrights Reserved 2025 | Powered by Project Blockchain
        </p>
      </footer>
    </main>
  );
}
