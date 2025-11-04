'use client';

import { motion } from 'framer-motion';
import { Lexend_Deca } from 'next/font/google';
import { ArrowLeft, HelpCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Getting Started
  {
    question: "What is TITLEREG?",
    answer: "TITLEREG is a blockchain-powered platform designed for secure land title registration, verification, and search for Indian land and real estate transactions. We leverage Solana blockchain technology to provide transparency, immutability, and security in property transactions.",
    category: 'getting-started'
  },
  {
    question: "How do I get started with TITLEREG?",
    answer: "To get started, you need to: 1) Install a Solana-compatible wallet (like Phantom or Solflare), 2) Connect your wallet to the platform, 3) Navigate to the Registration page if you want to register a property, or use the Search page to find existing property records. Make sure you have all required documents ready before starting the registration process.",
    category: 'getting-started'
  },
  {
    question: "Is TITLEREG legal and compliant with Indian laws?",
    answer: "Yes, TITLEREG is designed to comply with Indian land registration laws, including the Registration Act, 1908, and Transfer of Property Act, 1882. However, blockchain recording serves as an additional layer of verification and transparency. Traditional registration processes with government authorities should still be followed as required by law.",
    category: 'getting-started'
  },
  {
    question: "What are the benefits of using blockchain for land registration?",
    answer: "Blockchain provides several key benefits: Immutability (records cannot be altered), Transparency (all transactions are verifiable), Security (cryptographically secured), Fraud Prevention (eliminates duplicate registrations), Permanent Record (no risk of document loss), and Quick Verification (instant access to property history).",
    category: 'getting-started'
  },

  // Wallet
  {
    question: "Do I need a cryptocurrency wallet?",
    answer: "Yes, you need a Solana-compatible cryptocurrency wallet to interact with TITLEREG. Popular options include Phantom, Solflare, Backpack, and other Solana wallet browser extensions. The wallet is required to sign blockchain transactions and pay network fees.",
    category: 'wallet'
  },
  {
    question: "How do I connect my wallet?",
    answer: "Click the 'Connect' button in the header, select your wallet provider from the list, and approve the connection request in your wallet extension. Make sure your wallet is unlocked and you grant the necessary permissions. Once connected, your wallet address will be displayed in the header.",
    category: 'wallet'
  },
  {
    question: "What if I lose access to my wallet?",
    answer: "If you lose access to your wallet (lost private keys or recovery phrase), you cannot recover it through TITLEREG. This is a security feature of blockchain technology. Always keep your wallet recovery phrase secure and in multiple safe locations. We recommend using hardware wallets for important accounts and never sharing your private keys with anyone.",
    category: 'wallet'
  },
  {
    question: "Do I need SOL tokens in my wallet?",
    answer: "Yes, you need SOL (Solana's native cryptocurrency) in your wallet to pay for blockchain transaction fees. These fees are minimal (typically less than $0.01 per transaction) and are paid directly to the Solana network, not to TITLEREG. Make sure you have a small amount of SOL (recommended: at least 0.1 SOL) in your wallet before starting any transaction.",
    category: 'wallet'
  },
  {
    question: "Can I use multiple wallets?",
    answer: "Yes, you can switch between different wallets. However, each wallet address is treated as a separate identity. Properties registered from different wallet addresses will be linked to those respective addresses. Make sure you're using the correct wallet for your property transactions.",
    category: 'wallet'
  },

  // Registration
  {
    question: "How do I register a property on TITLEREG?",
    answer: "To register a property: 1) Go to the Registration page and connect your wallet, 2) Fill in property details (survey number, plot number, location, area, etc.), 3) Provide transaction details (type, consideration amount, stamp duty, dates), 4) Enter seller and buyer information with all required details, 5) Upload required documents (all in PDF format), 6) Add witness information if applicable, 7) Review all information carefully, 8) Submit and confirm the blockchain transaction. Once confirmed, your property will be permanently recorded on the blockchain.",
    category: 'registration'
  },
  {
    question: "What documents are required for registration?",
    answer: "Required documents include: Sale Deed (mandatory), Khata certificate, Property tax receipts (recent), Encumbrance certificate, Survey sketch/map, Aadhar card (buyer and seller), PAN card (buyer and seller), and Witness identification documents. All documents should be in PDF format, clear, readable, and properly scanned. Ensure documents are not password-protected.",
    category: 'registration'
  },
  {
    question: "How long does property registration take?",
    answer: "The blockchain transaction itself is usually completed within seconds to a few minutes, depending on Solana network congestion. However, the complete registration process including data entry, document upload, and verification may take 15-30 minutes. You should receive a confirmation and registration ID once the transaction is recorded on the blockchain.",
    category: 'registration'
  },
  {
    question: "Can I register multiple properties?",
    answer: "Yes, you can register multiple properties. Each property requires a separate registration process. Simply start a new registration after completing the previous one. All your registered properties will be linked to your wallet address and can be accessed through your account history.",
    category: 'registration'
  },
  {
    question: "Can I update property information after registration?",
    answer: "Property information stored on blockchain is immutable and cannot be altered. To make changes (like ownership transfer, updating details), you'll need to create a new transaction that will be linked to the original record. This maintains a complete, transparent, and verifiable history of all property transactions.",
    category: 'registration'
  },
  {
    question: "What are the fees for registration?",
    answer: "TITLEREG charges minimal blockchain transaction fees (paid in SOL, typically $0.01 or less). These fees go directly to the Solana network. Additionally, you are responsible for all government-mandated fees including stamp duty (varies by state), registration fees (as per state regulations), and other charges as per Indian land registration laws.",
    category: 'registration'
  },
  {
    question: "What happens if my registration transaction fails?",
    answer: "If a blockchain transaction fails, no data is recorded and you won't be charged. Common causes include insufficient SOL balance, network congestion, or wallet disconnection. Check your SOL balance, ensure stable internet connection, and try again. Your form data is saved locally, so you won't need to re-enter everything.",
    category: 'registration'
  },
  {
    question: "Can I save my registration progress?",
    answer: "Currently, registration forms are saved locally in your browser session. If you need to complete registration later, try to finish it in the same browser session. For best results, complete the registration process in one sitting. We recommend having all documents ready before starting.",
    category: 'registration'
  },

  // Search
  {
    question: "How can I search for a property?",
    answer: "Use the Search page to find properties by various parameters: Registration ID (exact match), Survey Number (exact match), Plot Number (exact match), Owner Name (partial match), or Location (Village, Taluka, District - partial match). Enter your search criteria and click search. All matching property records from the blockchain will be displayed with detailed information.",
    category: 'search'
  },
  {
    question: "Can I search without connecting my wallet?",
    answer: "Yes, you can search for properties without connecting your wallet. Property records are publicly accessible on the blockchain, so anyone can search and view property information. However, wallet connection may be required for certain advanced features, viewing complete transaction history, or accessing additional details.",
    category: 'search'
  },
  {
    question: "How do I verify property ownership?",
    answer: "Search for the property using any available parameters. The search results will show the current owner as recorded on the blockchain, along with complete transaction history showing the chain of ownership. Verify the information matches physical documents, cross-reference with government records, and check the transaction timestamps for authenticity.",
    category: 'search'
  },
  {
    question: "What information is visible in search results?",
    answer: "Search results show: Property identification (Survey No., Plot No.), Property location (Village, Taluka, District, State, Pincode), Property area and dimensions, Current owner information, Transaction history with dates, Registration dates, Transaction types, and Document references. Personal sensitive information is protected while maintaining transparency of property records.",
    category: 'search'
  },
  {
    question: "Can I export property search results?",
    answer: "Yes, the Search page allows you to export search results in various formats. You can download property information, generate reports, and create PDF documents with property details for your records or verification purposes.",
    category: 'search'
  },
  {
    question: "What if a property doesn't appear in search results?",
    answer: "If a property doesn't appear, it may not be registered on TITLEREG yet. Verify your search criteria, check spelling, and try different search parameters. If you believe the property should exist, it may need to be registered first through the Registration page.",
    category: 'search'
  },

  // Security
  {
    question: "How does blockchain ensure security?",
    answer: "Blockchain technology ensures security through: Immutability (records cannot be altered or deleted once recorded), Cryptographic Security (all transactions are cryptographically signed and verified), Distributed Network (data stored across thousands of nodes, eliminating single points of failure), Consensus Mechanism (transactions verified by network participants), and Permanent Audit Trail (complete history visible and verifiable).",
    category: 'security'
  },
  {
    question: "Is my personal information secure?",
    answer: "Yes, we implement multiple security layers including end-to-end encryption, secure wallet connections, privacy-preserving technologies, and secure document storage. While blockchain ensures transaction transparency for property records, we protect sensitive personal information while maintaining the transparency benefits for property verification.",
    category: 'security'
  },
  {
    question: "Can property records be hacked or altered?",
    answer: "No, blockchain technology makes it virtually impossible to alter or hack property records once they're recorded. The distributed nature of blockchain means records exist on thousands of computers simultaneously. Cryptographic security ensures records cannot be changed without network consensus, which is computationally infeasible to manipulate. Even if one node is compromised, the network maintains integrity.",
    category: 'security'
  },
  {
    question: "What if someone makes a fraudulent registration?",
    answer: "While blockchain records cannot be altered, we have verification processes in place. If you suspect fraud, contact us immediately through the Feedback page. We will investigate and can flag suspicious records. However, blockchain immutability means the original record will remain visible for transparency. Always verify property information through multiple sources including government records.",
    category: 'security'
  },
  {
    question: "Who can see my property information?",
    answer: "Property records on blockchain are publicly accessible, meaning anyone can search and view property information. This ensures transparency and prevents fraud. However, we implement privacy measures to protect sensitive personal details while maintaining the transparency benefits of blockchain for property verification and ownership history.",
    category: 'security'
  },
  {
    question: "How is my wallet protected?",
    answer: "Your wallet security is your responsibility. We never have access to your private keys or wallet credentials. The platform only requests transaction signatures from your wallet - you must approve each transaction. Always use reputable wallet providers, keep your recovery phrase secure, use hardware wallets for important accounts, and never share your private keys.",
    category: 'security'
  },
];

export default function HelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <main className={lexendDeca.className + " min-h-screen bg-black text-white pt-24 sm:pt-32 pb-20"}>
      <div className="px-3 sm:px-6 lg:px-36 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="text-white" size={40} />
            <h1 className="text-4xl sm:text-5xl font-light">Help Center</h1>
          </div>
          <p className="text-gray-400 mb-12 text-lg">
            Get answers, guides, and support for using TITLEREG.
          </p>

          {/* Search Bar */}
          <div className="mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help topics, questions, or keywords..."
                className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
              />
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-white">
                Frequently Asked Questions
              </h2>
              {searchQuery && (
                <p className="text-gray-400 text-sm">
                  {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            {filteredFAQs.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-12 text-center">
                <p className="text-gray-400 text-lg mb-2">No results found</p>
                <p className="text-gray-500 text-sm">Try adjusting your search query.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => {
                  const actualIndex = faqs.findIndex(f => f.question === faq.question);
                  return (
                    <motion.div
                      key={actualIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFAQ(openFAQ === actualIndex ? null : actualIndex)}
                        className="w-full text-left p-4 sm:p-6 flex items-center justify-between hover:bg-gray-900/70 transition-colors"
                      >
                        <span className="text-white font-light pr-2 sm:pr-4 flex-1 text-sm sm:text-base">{faq.question}</span>
                        {openFAQ === actualIndex ? (
                          <ChevronUp className="text-gray-400 flex-shrink-0" size={18} />
                        ) : (
                          <ChevronDown className="text-gray-400 flex-shrink-0" size={18} />
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
                          <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-gray-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step-by-Step Guides */}
          <div className="mb-16">
            <h2 className="text-2xl font-light text-white mb-6">Step-by-Step Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-8">
                <h3 className="text-xl font-light text-white mb-6 pb-4 border-b border-gray-800">
                  Property Registration Guide
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-300">
                  <li>Install and set up a Solana-compatible wallet (Phantom, Solflare, etc.)</li>
                  <li>Connect your wallet to TITLEREG using the Connect button</li>
                  <li>Navigate to the Registration page</li>
                  <li>Fill in property details (survey number, plot number, location, area)</li>
                  <li>Enter transaction details (type, amount, stamp duty, dates)</li>
                  <li>Provide seller and buyer information (names, addresses, IDs)</li>
                  <li>Upload all required documents in PDF format</li>
                  <li>Add witness information if applicable</li>
                  <li>Review all information carefully for accuracy</li>
                  <li>Submit and approve the blockchain transaction in your wallet</li>
                  <li>Wait for confirmation and save your registration ID</li>
                </ol>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-8">
                <h3 className="text-xl font-light text-white mb-6 pb-4 border-b border-gray-800">
                  Property Search & Verification Guide
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-300">
                  <li>Navigate to the Search page (wallet connection optional)</li>
                  <li>Select your search parameter (Registration ID, Survey No., Plot No., Owner Name, or Location)</li>
                  <li>Enter your search criteria accurately</li>
                  <li>Review the search results displayed</li>
                  <li>Click on any property card for detailed information</li>
                  <li>Examine the transaction history and ownership chain</li>
                  <li>Verify information matches physical documents</li>
                  <li>Cross-reference with government records when necessary</li>
                  <li>Export or save property information if needed</li>
                  <li>Contact support if you find discrepancies or need clarification</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mb-16">
            <h2 className="text-2xl font-light text-white mb-6">Troubleshooting Common Issues</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-light text-white mb-4 pb-2 border-b border-gray-800">Wallet Connection Issues</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Ensure your wallet extension is installed and updated to the latest version</li>
                  <li>Make sure your wallet is unlocked before attempting to connect</li>
                  <li>Try disconnecting and reconnecting your wallet</li>
                  <li>Check if your wallet supports Solana network</li>
                  <li>Try a different browser if issues persist</li>
                  <li>Clear browser cache and reload the page</li>
                  <li>Ensure browser extensions aren&apos;t blocking wallet connections</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-light text-white mb-4 pb-2 border-b border-gray-800">Transaction Failed</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Check if you have sufficient SOL in your wallet for transaction fees</li>
                  <li>Verify your internet connection is stable and strong</li>
                  <li>Wait for network congestion to clear (check Solana network status)</li>
                  <li>Try the transaction again after a few minutes</li>
                  <li>Increase the transaction priority if your wallet supports it</li>
                  <li>Ensure your wallet hasn't been disconnected</li>
                  <li>Check wallet logs for specific error messages</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-light text-white mb-4 pb-2 border-b border-gray-800">Search Not Finding Results</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Double-check spelling and formatting of search terms</li>
                  <li>Try different search parameters (e.g., use Survey No. instead of Plot No.)</li>
                  <li>Verify the property is registered on the platform</li>
                  <li>Use partial matches for owner names or locations</li>
                  <li>Clear search filters and try again</li>
                  <li>Check if you&apos;re searching in the correct format</li>
                  <li>Contact support if you believe the property should exist</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-light text-white mb-4 pb-2 border-b border-gray-800">Document Upload Issues</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Ensure all documents are in PDF format</li>
                  <li>Check file size (recommended under 10MB per file)</li>
                  <li>Verify documents are not password-protected</li>
                  <li>Ensure documents are clear, readable, and properly scanned</li>
                  <li>Try converting images to PDF if needed</li>
                  <li>Check your internet connection for stable upload</li>
                  <li>Try uploading documents one at a time</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="mb-16">
            <h2 className="text-2xl font-light text-white mb-6">Additional Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-light text-white mb-3">Document Requirements</h3>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Learn about all required documents for property registration, their formats, and verification standards.
                </p>
                <Link href="/registration" className="text-white underline text-sm hover:text-gray-300">
                  View Registration Page →
                </Link>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-light text-white mb-3">Legal Information</h3>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Understand the legal framework, compliance requirements, and how TITLEREG aligns with Indian property laws.
                </p>
                <Link href="/terms" className="text-white underline text-sm hover:text-gray-300">
                  Read Terms & Conditions →
                </Link>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-light text-white mb-3">Privacy & Security</h3>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Learn how we protect your data and maintain privacy while ensuring blockchain transparency.
                </p>
                <Link href="/privacy" className="text-white underline text-sm hover:text-gray-300">
                  View Privacy Policy →
                </Link>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </main>
  );
}
