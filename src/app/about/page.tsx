'use client';

import { motion } from 'framer-motion';
import { Lexend_Deca } from 'next/font/google';
import { ArrowLeft, Shield, Database, Lock, Users, Target, Zap } from 'lucide-react';
import Link from 'next/link';

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const features = [
  {
    icon: Shield,
    title: "Secure & Immutable",
    description: "Blockchain technology ensures that once recorded, property information cannot be altered or tampered with."
  },
  {
    icon: Database,
    title: "Transparent Records",
    description: "All property transactions are stored on a public blockchain, providing complete transparency and auditability."
  },
  {
    icon: Lock,
    title: "Privacy Protected",
    description: "Advanced encryption and privacy measures protect sensitive personal information while maintaining transaction transparency."
  },
  {
    icon: Zap,
    title: "Fast & Efficient",
    description: "Streamlined registration process reduces paperwork and processing time for property transactions."
  },
  {
    icon: Users,
    title: "User-Friendly",
    description: "Intuitive interface designed for easy property registration, verification, and search."
  },
  {
    icon: Target,
    title: "Compliance Ready",
    description: "Built to comply with Indian land and real estate regulations and legal requirements."
  }
];

export default function AboutPage() {
  return (
    <main className={`${lexendDeca.className} min-h-screen bg-black text-white pt-32 pb-20`}>
      <div className="px-3 sm:px-36 max-w-6xl mx-auto">
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

          <div className="mb-16">
            <h1 className="text-4xl sm:text-5xl font-light mb-6">About TITLEREG</h1>
            <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
              TITLEREG is a revolutionary blockchain-powered platform designed to transform Indian land and real estate 
              transactions. We leverage cutting-edge blockchain technology to provide secure, transparent, and immutable 
              property registration, verification, and search capabilities.
            </p>
          </div>

          {/* Mission */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-light text-white mb-6">Our Mission</h2>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <p className="text-gray-300 leading-relaxed text-lg">
                To revolutionize land title registration and verification in India by leveraging blockchain technology 
                for transparent, secure, and legally compliant property transactions. We aim to eliminate fraud, reduce 
                disputes, and build trust in the real estate ecosystem.
              </p>
            </div>
          </motion.section>

          {/* Features */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-light text-white mb-8">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
                >
                  <feature.icon className="text-white mb-4" size={32} />
                  <h3 className="text-xl font-light text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* How It Works */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-light text-white mb-8">How It Works</h2>
            <div className="space-y-6">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-medium">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-light text-white mb-2">Property Registration</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Users register property details including survey number, plot number, location, transaction details, 
                    and upload required documents. All information is verified before blockchain recording.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-medium">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-light text-white mb-2">Blockchain Recording</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Verified property information is recorded on the blockchain, creating an immutable and permanent 
                    record that cannot be altered or deleted.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-medium">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-light text-white mb-2">Verification & Search</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Anyone can search and verify property records using various parameters, ensuring transparency and 
                    building trust in property transactions.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Technology */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-light text-white mb-6">Technology</h2>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <p className="text-gray-300 leading-relaxed mb-4">
                TITLEREG is built on Solana blockchain, chosen for its high throughput, low transaction costs, and 
                environmental efficiency. The platform uses smart contracts to ensure secure and automated property 
                registration processes.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Solana Blockchain for secure transaction recording</li>
                <li>Smart Contracts for automated verification</li>
                <li>IPFS for decentralized document storage</li>
                <li>Advanced encryption for data protection</li>
              </ul>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center"
          >
            <h3 className="text-2xl font-light text-white mb-4">Ready to Get Started?</h3>
            <p className="text-gray-400 mb-6">Join us in revolutionizing Indian land and real estate transactions</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/registration"
                className="px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Register Property
              </Link>
              <Link
                href="/search"
                className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                Search Properties
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

