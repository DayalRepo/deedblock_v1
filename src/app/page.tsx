'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import localFont from 'next/font/local';

const punktFont = localFont({
  src: './fonts/Punkt-Bold.woff2',
  display: 'swap',
});

// Typing animation component removed


export default function Home() {

  return (
    <main className={`flex flex-col min-h-screen bg-white text-black`}>
      <div className="flex-1 px-3 sm:px-6 lg:px-36 pb-16 pt-32 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          {/* Centered Header Section */}
          <div className="flex flex-col items-center text-center space-y-12 mb-16">
            <div className="flex flex-col items-center space-y-6">
              {/* Beta Banner */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs sm:text-sm text-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Beta Release • Running on Blockchain</span>
              </div>

              <div>
                <h1 className={`${punktFont.className} text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-1`}>
                  <span className="text-emerald-600">D</span>eed<span className="text-emerald-600">B</span>lock
                </h1>
                <p className={`font-sans text-sm sm:text-base text-gray-500 font-medium tracking-tighter`}>
                  Powered by <span className="underline decoration-1 underline-offset-4">Project BlockChain</span>
                </p>
              </div>

              {/* Get Started Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="pt-4"
              >
                <Link
                  href="/registration"
                  className="group relative inline-flex items-center justify-center px-8 py-3 bg-black text-white rounded-full font-medium transition-all hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span className="mr-2">Get Started</span>
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </div>

            {/* Feature Grid (Centered below title) */}

          </div>


        </motion.div>
      </div>

      {/* Copyright Footer */}
      <footer className="mt-auto pt-6 sm:pt-8 pb-2 sm:pb-3 text-center">
        <p className="text-gray-500 text-xs sm:text-sm">
          DeedBlock | Powered by <span className="underline decoration-1 underline-offset-4">Project BlockChain</span>
        </p>
      </footer>
    </main>
  );
}
