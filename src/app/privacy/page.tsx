'use client';

import { motion } from 'framer-motion';
import { Lexend_Deca } from 'next/font/google';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export default function PrivacyPage() {
  return (
    <main className={`${lexendDeca.className} min-h-screen bg-black text-white pt-24 sm:pt-32 pb-20`}>
      <div className="px-3 sm:px-6 lg:px-36 max-w-4xl mx-auto">
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

          <h1 className="text-4xl sm:text-5xl font-light mb-4">Privacy Policy</h1>
          <p className="text-gray-400 mb-2">Last updated: {new Date().toLocaleDateString()}</p>
          <p className="text-gray-400 mb-12">
            This Privacy Policy describes how TITLEREG collects, uses, and protects your personal information when you use our blockchain-powered land title registration platform.
          </p>

          <div className="space-y-8 sm:space-y-10 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                We collect information that you provide directly to us when you use our platform. This includes:
              </p>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">1.1 Property Registration Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Survey number, plot number, and property identification details</li>
                <li>Property location information (village, taluka, district, state, pincode)</li>
                <li>Property area, dimensions, and unit of measurement</li>
                <li>Property description and characteristics</li>
                <li>Property photographs and related visual documentation</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">1.2 Personal Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Full name, father&apos;s name, and age</li>
                <li>Permanent and correspondence addresses</li>
                <li>Aadhar number and related identification documents</li>
                <li>PAN (Permanent Account Number) and tax identification</li>
                <li>Contact information (phone number, email address)</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">1.3 Transaction Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Transaction type (sale, purchase, transfer, etc.)</li>
                <li>Consideration amount and payment details</li>
                <li>Stamp duty and registration fees</li>
                <li>Sale agreement dates and transaction timelines</li>
                <li>Witness information (names, addresses, contact details, Aadhar numbers)</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">1.4 Documents and Records</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Sale deeds and property transfer documents</li>
                <li>Khata certificates and property tax receipts</li>
                <li>Encumbrance certificates and title verification documents</li>
                <li>Survey sketches and land maps</li>
                <li>Identity proofs (Aadhar, PAN cards)</li>
                <li>Other legal and regulatory documents as required</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">1.5 Blockchain and Technical Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Solana wallet addresses and public keys</li>
                <li>Blockchain transaction hashes and signatures</li>
                <li>Network interaction data and transaction history</li>
                <li>Platform usage patterns and analytics data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Property Registration:</strong> To process, verify, and record property transactions on the blockchain</li>
                <li><strong className="text-white">Ownership Verification:</strong> To establish and verify property ownership and transfer rights</li>
                <li><strong className="text-white">Document Management:</strong> To securely store and manage property-related documents</li>
                <li><strong className="text-white">Blockchain Recording:</strong> To create immutable records of property transactions</li>
                <li><strong className="text-white">Service Provision:</strong> To provide search, verification, and retrieval services for property records</li>
                <li><strong className="text-white">Legal Compliance:</strong> To comply with Indian land registration laws, real estate regulations, and government requirements</li>
                <li><strong className="text-white">Fraud Prevention:</strong> To detect and prevent fraudulent transactions and identity theft</li>
                <li><strong className="text-white">Platform Improvement:</strong> To analyze usage patterns and improve our services</li>
                <li><strong className="text-white">Customer Support:</strong> To respond to inquiries, provide support, and resolve issues</li>
                <li><strong className="text-white">Communication:</strong> To send important updates, notifications, and service-related communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">3. Blockchain Technology and Data Transparency</h2>
              <p className="mb-4">
                TITLEREG uses blockchain technology to ensure the security, immutability, and transparency of property records. 
                This technology has important implications for data privacy:
              </p>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">3.1 Immutability</h3>
              <p className="mb-4">
                Once information is recorded on the blockchain, it becomes permanent and cannot be altered or deleted. 
                This ensures the integrity of property records but also means that certain data cannot be removed once recorded.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">3.2 Public Accessibility</h3>
              <p className="mb-4">
                Blockchain records are publicly accessible, meaning that anyone can view transaction data. However, we implement 
                privacy-preserving techniques to protect sensitive personal information while maintaining transparency for property records.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">3.3 Privacy Measures</h3>
              <p className="mb-4">
                We use encryption and privacy-enhancing technologies to protect sensitive personal information. Property records 
                are designed to be visible to authorized parties only, while maintaining the transparency benefits of blockchain technology.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">4. Data Security</h2>
              <p className="mb-4">
                We are committed to protecting your information and implement comprehensive security measures:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Encryption:</strong> All sensitive data is encrypted both in transit and at rest using industry-standard encryption protocols</li>
                <li><strong className="text-white">Secure Wallet Connections:</strong> Wallet connections are secured using cryptographic protocols to prevent unauthorized access</li>
                <li><strong className="text-white">Access Controls:</strong> Strict access controls and authentication mechanisms limit who can view or modify your information</li>
                <li><strong className="text-white">Regular Security Audits:</strong> We conduct regular security audits and vulnerability assessments</li>
                <li><strong className="text-white">Secure Infrastructure:</strong> Our platform is built on secure, monitored infrastructure</li>
                <li><strong className="text-white">Staff Training:</strong> Our team is trained on data protection and privacy best practices</li>
              </ul>
              <p className="mb-4 text-gray-400 italic">
                While we implement robust security measures, no method of transmission over the internet or electronic storage is 100% secure. 
                We cannot guarantee absolute security, but we continuously work to improve our security practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">5. Data Sharing and Disclosure</h2>
              <p className="mb-4">
                We respect your privacy and do not sell your personal information. However, we may share information in the following circumstances:
              </p>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">5.1 Government and Regulatory Bodies</h3>
              <p className="mb-4">
                We may be required to share information with government authorities, land registration departments, and regulatory bodies 
                as mandated by Indian law and regulations. This includes compliance with the Registration Act, Transfer of Property Act, 
                and other applicable real estate laws.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">5.2 Legal Requirements</h3>
              <p className="mb-4">
                We may disclose information if required by law, court orders, legal processes, or to respond to government requests. 
                We may also share information to protect our rights, property, or safety, or that of our users or others.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">5.3 Transaction Parties</h3>
              <p className="mb-4">
                Information may be shared with authorized parties involved in property transactions, such as buyers, sellers, witnesses, 
                and legal representatives, as necessary to complete and verify transactions.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">5.4 Service Providers</h3>
              <p className="mb-4">
                We may share limited information with trusted third-party service providers who assist us in operating our platform, 
                conducting our business, or serving our users, provided they agree to keep this information confidential.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">6. Your Privacy Rights</h2>
              <p className="mb-4">
                Under applicable Indian privacy laws and regulations, you have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Right to Access:</strong> You can request access to your personal information that we hold</li>
                <li><strong className="text-white">Right to Correction:</strong> You can request correction of inaccurate, incomplete, or outdated information</li>
                <li><strong className="text-white">Right to Object:</strong> You can object to certain processing of your personal information</li>
                <li><strong className="text-white">Right to Restrict Processing:</strong> You can request restriction of processing in certain circumstances</li>
                <li><strong className="text-white">Right to Data Portability:</strong> You can request a copy of your data in a structured, machine-readable format</li>
              </ul>
              <p className="mb-4 text-gray-400 italic">
                <strong>Important Note:</strong> Due to the immutable nature of blockchain technology, information recorded on the blockchain 
                cannot be deleted or modified. However, we can update or correct information in our systems and prevent further processing 
                of incorrect data. We will assist you in exercising your rights to the fullest extent possible within the constraints of blockchain technology.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="mb-4">
                We use minimal cookies and similar tracking technologies to enhance your experience and analyze platform usage:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Essential Cookies:</strong> Required for the platform to function properly</li>
                <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
                <li><strong className="text-white">Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="mb-4">
                You can control cookies through your browser settings. However, disabling certain cookies may affect the functionality 
                of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">8. Data Retention</h2>
              <p className="mb-4">
                We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless 
                a longer retention period is required or permitted by law. Due to blockchain immutability, transaction records on 
                the blockchain are retained permanently.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">9. Children&apos;s Privacy</h2>
              <p className="mb-4">
                Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information 
                from children. If you believe we have inadvertently collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">10. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be processed and stored in servers located outside India. When we transfer data internationally, 
                we ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and 
                applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">11. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, 
                or other factors. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Posting the updated Privacy Policy on this page</li>
                <li>Updating the &quot;Last updated&quot; date at the top of this policy</li>
                <li>Sending notifications to registered users for significant changes</li>
              </ul>
              <p className="mb-4">
                Your continued use of our platform after any changes indicates your acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">12. Your Responsibilities</h2>
              <p className="mb-4">
                To protect your privacy, we recommend that you:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Keep your wallet credentials secure and never share them with others</li>
                <li>Use strong, unique passwords for any accounts associated with our platform</li>
                <li>Regularly review your account and transaction history</li>
                <li>Report any suspicious activity or security concerns immediately</li>
                <li>Keep your contact information up to date</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">13. Contact Us</h2>
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none space-y-2 ml-4 mb-4">
                <li>Through our <Link href="/feedback" className="text-white underline">Feedback</Link> page</li>
                <li>Through our <Link href="/help" className="text-white underline">Help Center</Link></li>
              </ul>
              <p className="mb-4">
                We will respond to your inquiries in a timely manner and work to address any privacy concerns you may have.
              </p>
            </section>

            <section className="bg-gray-900/30 border border-gray-800 rounded-lg p-4 sm:p-6 mt-12">
              <p className="text-gray-300 italic text-sm">
                By using TITLEREG, you acknowledge that you have read, understood, and agree to this Privacy Policy. 
                If you do not agree with any part of this policy, please do not use our platform.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
