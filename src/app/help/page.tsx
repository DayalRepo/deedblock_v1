'use client';

import { motion } from 'framer-motion';
import { DM_Sans, DM_Mono } from 'next/font/google';
import { ArrowLeft, HelpCircle, Search, ChevronDown, ChevronUp, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
});

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // About DeedBlock
  {
    question: "What is DeedBlock?",
    answer: "DeedBlock is a digital-first land registry platform designed to modernize property administration. We are currently in **Beta**, testing the core concepts of decentralized storage and instant verification to solve issues like land record tampering and bureaucratic friction.",
    category: 'about'
  },
  {
    question: "What technology powers DeedBlock?",
    answer: "Our platform is built on a dual-layer architecture:\n\n1. **Hyperledger Fabric (Production):** For our upcoming official release, we will use this **permissioned blockchain** to store sensitive citizen data and land titles securely. This ensures compliance with government regulations and data privacy laws.\n\n2. **IPFS (Beta/Storage):** Currently, for this Beta version, we use the **InterPlanetary File System (IPFS)** as an off-chain decentralized storage layer. This ensures that documents (deeds, maps) are tamper-proof and improved availability.",
    category: 'technology'
  },
  {
    question: "Why Hyperledger Fabric instead of public crypto blockchains?",
    answer: "Public blockchains (like Solana or Ethereum) are great for cryptocurrencies, but government records require **privacy, permissioned access, and compliance**. Hyperledger Fabric allows us to build a private, secure network where only authorized government bodies and verified citizens can participate, without the volatility or anonymity of crypto markets.",
    category: 'technology'
  },

  // User Flows & Usage
  {
    question: "How do I Sign In?",
    answer: "We have simplified access for the Beta:\n• Click **'Sign In'** in the navigation bar.\n• You can use your Google or GitHub account for quick access.\n• In the future Production version, this will integrate with **Government IDs (like Aadhaar)** for secure citizen authentication.",
    category: 'usage'
  },
  {
    question: "How does the Registration Process work?",
    answer: "Registering a property is a streamlined 4-step process:\n1. **Sign In:** Log in to your account.\n2. **Enter Details:** Fill in property information (Survey No, Location) and transaction details (Seller/Buyer info).\n3. **Upload Documents:** Upload your Sale Deed, Maps, and IDs. in the current Beta, these are secured on **IPFS**.\n4. **Submit:** Confirm the data. In the future, this action will write a permanent record to the **Hyperledger Fabric** ledger.",
    category: 'usage'
  },
  {
    question: "How do I Search and Verify a property?",
    answer: "Verification is public and instant:\n1. Go to the **Search** page.\n2. Enter a unique identifier (Registration ID, Survey No, or Owner Name).\n3. The system queries our decentralized storage to fetch the immutable record.\n4. You can view the full history and download verified documents.",
    category: 'usage'
  },

  {
    question: "Is the data on the Beta version permanent?",
    answer: "Data on the Beta version is for testing and demonstration purposes. While IPFS links are permanent, the Beta registry may be reset as we upgrade towards the production Hyperledger Fabric network. Please do not use this for official legal registration yet.",
    category: 'about'
  },
];

export default function HelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <main className={dmSans.className + " min-h-screen bg-white text-black pt-20 sm:pt-32 pb-16 sm:pb-20"}>
      <div className="px-4 sm:px-6 lg:px-36 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-6 sm:mb-8 text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <HelpCircle className="text-black w-8 h-8 sm:w-10 sm:h-10" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light">Help Center</h1>
          </div>
          <p className="text-gray-600 mb-8 sm:mb-12 text-base sm:text-lg max-w-2xl">
            Learn about DeedBlock's technology, including Hyperledger Fabric and IPFS.
          </p>

          {/* Search Bar */}
          <div className="mb-8 sm:mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (e.g., 'Hyperledger', 'IPFS')..."
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border border-gray-200 rounded-lg text-black text-base placeholder-gray-500 focus:outline-none focus:border-black transition-colors shadow-sm"
                aria-label="Search FAQs"
              />
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-12 sm:mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl font-light text-black">
                Frequently Asked Questions
              </h2>
              {searchQuery && (
                <p className="text-gray-600 text-sm">
                  {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            {filteredFAQs.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-12 text-center">
                <p className="text-gray-600 text-lg mb-2">No results found</p>
                <p className="text-gray-500 text-sm">Try adjusting your search query.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredFAQs.map((faq, index) => {
                  const actualIndex = faqs.findIndex(f => f.question === faq.question);
                  return (
                    <motion.div
                      key={actualIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
                    >
                      <button
                        onClick={() => setOpenFAQ(openFAQ === actualIndex ? null : actualIndex)}
                        className="w-full text-left p-4 sm:p-6 flex items-start sm:items-center justify-between hover:bg-gray-50 transition-colors"
                        aria-expanded={openFAQ === actualIndex}
                      >
                        <span className="text-black font-medium pr-2 sm:pr-4 flex-1 text-base leading-snug">{faq.question}</span>
                        {openFAQ === actualIndex ? (
                          <ChevronUp className="text-gray-600 flex-shrink-0 mt-1 sm:mt-0" size={18} />
                        ) : (
                          <ChevronDown className="text-gray-600 flex-shrink-0 mt-1 sm:mt-0" size={18} />
                        )}
                      </button>
                      {openFAQ === actualIndex && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base border-t border-gray-100 mt-2 pt-4">
                            {faq.answer.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                              part.match(/^https?:\/\//) ?
                                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{part}</a> :
                                part
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Journey Guides */}
          <div className="mb-12 sm:mb-16">
            <h2 className="text-xl sm:text-2xl font-light text-black mb-4 sm:mb-6">User Flow Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-8 hover:shadow-md transition-shadow">
                <h3 className="text-lg sm:text-xl font-medium text-black mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                  Registration Flow
                </h3>
                <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                  <li><strong>Sign In</strong> using Email/Social Login.</li>
                  <li>Click <strong>"Register New Deed"</strong>.</li>
                  <li>Fill in <strong>Property & Owner Details</strong>.</li>
                  <li>Upload Documents (Secured on <strong>IPFS</strong>).</li>
                  <li><strong>Submit</strong> to create an immutable record.</li>
                </ol>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-8 hover:shadow-md transition-shadow">
                <h3 className="text-lg sm:text-xl font-medium text-black mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                  Search & Verification
                </h3>
                <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                  <li>Visit <strong>Search Page</strong> (No login required).</li>
                  <li>Enter <strong>Document ID</strong> or <strong>Owner Name</strong>.</li>
                  <li>System retrieves data from <strong>Decentralized Storage</strong>.</li>
                  <li>View ownership history & download <strong>Verified Copies</strong>.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Beta Banner */}
          <div className="mb-12 sm:mb-16">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 sm:p-8">
              <h3 className="text-base sm:text-lg font-medium text-blue-900 mb-2">Technical Note: Beta vs Production</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                We are currently in <strong>Beta</strong>. This version demonstrates our "Off-Chain Decentralized Storage" using <strong>IPFS</strong>.
                Our team is actively building the Native <strong>Hyperledger Fabric</strong> blockchain network for the Production release, which will bring full government-grade compliance and security.
              </p>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="mb-12 sm:mb-16 border-t border-gray-100 pt-10">
            <h2 className="text-lg sm:text-xl font-light text-black mb-4">Legal Disclaimer</h2>
            <p className="text-gray-500 text-sm leading-relaxed text-justify">
              DeedBlock is a technological demonstration platform. Records created on this Beta version are <strong>not legally binding</strong> and do not replace official registration with the Government Sub-Registrar or Revenue Department.
              Users should continue to follow all standard legal procedures for property registration. DeedBlock assumes no liability for disputes arising from the use of this beta platform.
            </p>
          </div>

          {/* Contact & Support */}
          <div className="mb-16">
            <div className="bg-black text-white rounded-2xl p-6 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-light mb-4">Have Questions?</h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto text-sm sm:text-base">
                Whether you're a government official, developer, or beta tester, we'd love to hear your feedback on our new blockchain infrastructure.
              </p>
              <a
                href="mailto:support@deedblock.com"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium text-sm sm:text-base hover:bg-gray-100 transition-colors"
              >
                <span>Contact Support</span>
                <ArrowUp size={18} className="rotate-45" />
              </a>
            </div>
          </div>

        </motion.div>
      </div>

      {/* Back to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-50"
          aria-label="Back to top"
        >
          <ArrowUp size={20} className="sm:w-6 sm:h-6" />
        </motion.button>
      )}
    </main>
  );
}
