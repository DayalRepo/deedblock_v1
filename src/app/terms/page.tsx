'use client';

import { motion } from 'framer-motion';
import { Lexend_Deca } from 'next/font/google';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export default function TermsPage() {
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

          <h1 className="text-4xl sm:text-5xl font-light mb-4">Terms & Conditions</h1>
          <p className="text-gray-400 mb-2">Last updated: {new Date().toLocaleDateString()}</p>
          <p className="text-gray-400 mb-12">
            These Terms & Conditions govern your use of TITLEREG, a blockchain-powered platform for land title registration, 
            verification, and search services in India. Please read these terms carefully before using our platform.
          </p>

          <div className="space-y-8 sm:space-y-10 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing, browsing, or using TITLEREG (&quot;the Platform&quot;, &quot;our Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you acknowledge 
                that you have read, understood, and agree to be bound by these Terms & Conditions and our Privacy Policy. 
                If you do not agree with any part of these terms, you must not use our Platform.
              </p>
              <p className="mb-4">
                These terms constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and TITLEREG. 
                Your use of the Platform indicates your acceptance of these terms and your commitment to comply with all applicable 
                laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">2. Service Description</h2>
              <p className="mb-4">
                TITLEREG is a blockchain-powered platform designed to revolutionize land title registration, verification, and 
                search for Indian land and real estate transactions. Our services include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Property Registration:</strong> Secure registration of property titles and transactions on the blockchain</li>
                <li><strong className="text-white">Verification Services:</strong> Verification of property ownership, title clarity, and transaction authenticity</li>
                <li><strong className="text-white">Search Services:</strong> Search and retrieval of property records using various parameters</li>
                <li><strong className="text-white">Document Management:</strong> Secure storage and management of property-related documents</li>
                <li><strong className="text-white">Transaction Recording:</strong> Immutable recording of property transactions on the Solana blockchain</li>
              </ul>
              <p className="mb-4">
                We reserve the right to modify, suspend, or discontinue any aspect of our services at any time, with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">3. Eligibility and Registration</h2>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">3.1 Age Requirement</h3>
              <p className="mb-4">
                You must be at least 18 years of age to use our Platform. By using TITLEREG, you represent and warrant that you 
                are of legal age to enter into a binding contract and have the legal capacity to do so.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">3.2 Wallet Connection</h3>
              <p className="mb-4">
                To use our Platform, you must connect a compatible Solana wallet (such as Phantom, Solflare, or other Solana-compatible wallets). 
                You are solely responsible for maintaining the security of your wallet credentials and private keys.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">3.3 Account Responsibility</h3>
              <p className="mb-4">
                You are responsible for all activities that occur under your wallet address. We are not liable for any loss or damage 
                arising from unauthorized use of your wallet or failure to maintain its security.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">4. User Responsibilities and Obligations</h2>
              <p className="mb-4">As a user of TITLEREG, you agree to:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong className="text-white">Accurate Information:</strong> Provide accurate, complete, and truthful information during property registration and all transactions</li>
                <li><strong className="text-white">Document Authenticity:</strong> Ensure all documents uploaded are authentic, legally obtained, and properly authorized</li>
                <li><strong className="text-white">Legal Compliance:</strong> Comply with all applicable Indian laws, regulations, and real estate statutes, including but not limited to the Registration Act, 1908, Transfer of Property Act, 1882, and state-specific land registration laws</li>
                <li><strong className="text-white">Wallet Security:</strong> Maintain the confidentiality and security of your wallet credentials, private keys, and any authentication information</li>
                <li><strong className="text-white">Prohibited Activities:</strong> Not engage in any fraudulent, illegal, or unauthorized activities, including but not limited to:
                  <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
                    <li>Submitting false or misleading property information</li>
                    <li>Attempting to register fraudulent property claims</li>
                    <li>Interfering with or disrupting the Platform&apos;s operations</li>
                    <li>Attempting to reverse or alter blockchain transactions</li>
                    <li>Unauthorized access to other users&apos; accounts or data</li>
                  </ul>
                </li>
                <li><strong className="text-white">Property Verification:</strong> Independently verify the authenticity and legality of property documents and transactions</li>
                <li><strong className="text-white">Transaction Fees:</strong> Pay all applicable fees, including blockchain transaction fees, stamp duty, and registration fees as required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">5. Blockchain Technology and Transactions</h2>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">5.1 Understanding Blockchain</h3>
              <p className="mb-4">
                TITLEREG operates on the Solana blockchain network. You acknowledge and understand that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Blockchain transactions are immutable and cannot be reversed once recorded</li>
                <li>Blockchain records are publicly accessible, though we implement privacy measures for sensitive data</li>
                <li>Transaction processing times may vary based on network conditions</li>
                <li>Blockchain fees are determined by network conditions and are beyond our control</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">5.2 Transaction Irreversibility</h3>
              <p className="mb-4">
                Once a property registration or transaction is recorded on the blockchain, it becomes permanent and cannot be 
                altered, deleted, or reversed. You accept full responsibility for all transactions initiated from your wallet 
                and acknowledge that you cannot cancel or reverse blockchain transactions.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">5.3 Network Conditions</h3>
              <p className="mb-4">
                We are not responsible for delays, failures, or errors caused by blockchain network congestion, outages, or 
                other network-related issues. You understand that blockchain networks may experience downtime or performance issues.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">5.4 Smart Contracts</h3>
              <p className="mb-4">
                Property registrations are processed through smart contracts deployed on the Solana blockchain. You acknowledge 
                that smart contracts operate automatically and cannot be modified once deployed. We are not liable for any 
                issues arising from smart contract operations.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">6. Property Registration and Verification</h2>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">6.1 Registration Requirements</h3>
              <p className="mb-4">
                To register a property, you must provide complete and accurate information, including property details, ownership 
                information, transaction documents, and all required legal documents. Incomplete or inaccurate information may 
                result in registration delays or rejection.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">6.2 Document Verification</h3>
              <p className="mb-4">
                While we facilitate property registration, we do not guarantee the authenticity, validity, or legality of documents 
                submitted by users. You are solely responsible for ensuring that all documents are authentic and legally obtained. 
                We reserve the right to verify documents and may reject registrations with suspicious or invalid documentation.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">6.3 No Title Guarantee</h3>
              <p className="mb-4">
                TITLEREG does not provide title insurance or guarantee property titles. Our Platform facilitates the recording of 
                property information on the blockchain but does not verify or guarantee the legal validity of property ownership, 
                title clarity, or freedom from encumbrances. Users should conduct independent title verification through legal 
                professionals.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">6.4 Third-Party Verification</h3>
              <p className="mb-4">
                Property records on our Platform are based on information provided by users and third parties. We are not responsible 
                for errors, omissions, or inaccuracies in information provided by users or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">7. Fees and Payments</h2>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">7.1 Service Fees</h3>
              <p className="mb-4">
                We may charge fees for certain services. All fees will be clearly disclosed before you complete a transaction. 
                Fees may include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Blockchain transaction fees (network fees paid to the Solana network)</li>
                <li>Platform service fees for registration and verification services</li>
                <li>Document storage and management fees</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">7.2 Government Fees</h3>
              <p className="mb-4">
                You are responsible for all government-mandated fees, including stamp duty, registration fees, and any other 
                charges required by Indian law. These fees are separate from our service fees and are determined by applicable 
                government regulations.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">7.3 Payment Methods</h3>
              <p className="mb-4">
                Payments for blockchain transactions are processed using your connected Solana wallet. Fees are typically paid 
                in SOL (Solana&apos;s native cryptocurrency) or other supported tokens.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">7.4 Refunds</h3>
              <p className="mb-4">
                Due to the irreversible nature of blockchain transactions, fees paid for blockchain transactions cannot be refunded. 
                Service fees may be refunded only in exceptional circumstances at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">8. Intellectual Property Rights</h2>
              <p className="mb-4">
                All content, features, functionality, and technology of the TITLEREG Platform, including but not limited to software, 
                designs, text, graphics, logos, and other materials, are owned by TITLEREG and are protected by copyright, trademark, 
                patent, trade secret, and other intellectual property laws.
              </p>
              <p className="mb-4">
                You are granted a limited, non-exclusive, non-transferable, and revocable license to access and use the Platform 
                for its intended purposes. You may not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Copy, modify, or create derivative works of the Platform</li>
                <li>Reverse engineer, decompile, or disassemble the Platform</li>
                <li>Remove or alter any copyright, trademark, or proprietary notices</li>
                <li>Use the Platform for any commercial purpose without our written consent</li>
                <li>Use automated systems to access the Platform without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">9. Privacy and Data Protection</h2>
              <p className="mb-4">
                Your privacy is important to us. Our collection, use, and protection of your personal information is governed by 
                our Privacy Policy, which forms an integral part of these Terms & Conditions. By using the Platform, you consent 
                to our Privacy Policy.
              </p>
              <p className="mb-4">
                Please review our <Link href="/privacy" className="text-white underline">Privacy Policy</Link> to understand how 
                we handle your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">10. Limitation of Liability and Disclaimers</h2>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">10.1 No Warranty</h3>
              <p className="mb-4">
                THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
                We disclaim all warranties, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
                <li>Warranties regarding the accuracy, completeness, or reliability of information on the Platform</li>
                <li>Warranties that the Platform will be uninterrupted, error-free, or secure</li>
                <li>Warranties regarding property titles, ownership, or legal validity</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">10.2 Limitation of Liability</h3>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TITLEREG SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Damages arising from unauthorized access to or use of your wallet</li>
                <li>Errors, inaccuracies, or omissions in property records</li>
                <li>Property disputes, title issues, or legal conflicts</li>
                <li>Blockchain network issues, delays, or failures</li>
                <li>Losses resulting from third-party actions or government regulations</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">10.3 Maximum Liability</h3>
              <p className="mb-4">
                Our total liability to you for any claims arising from or related to your use of the Platform shall not exceed 
                the total fees paid by you to us in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">11. Indemnification</h2>
              <p className="mb-4">
                You agree to indemnify, defend, and hold harmless TITLEREG, its officers, directors, employees, agents, and 
                affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including 
                reasonable attorney&apos;s fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Your use or misuse of the Platform</li>
                <li>Your violation of these Terms & Conditions</li>
                <li>Your violation of any law or regulation</li>
                <li>Your submission of false, inaccurate, or fraudulent information</li>
                <li>Property disputes or title issues related to your registered properties</li>
                <li>Any claims by third parties related to your use of the Platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">12. Termination</h2>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">12.1 Termination by You</h3>
              <p className="mb-4">
                You may stop using the Platform at any time. However, property records already recorded on the blockchain cannot 
                be deleted due to blockchain immutability.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">12.2 Termination by Us</h3>
              <p className="mb-4">
                We reserve the right to suspend or terminate your access to the Platform, with or without notice, for any reason, 
                including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Violation of these Terms & Conditions</li>
                <li>Fraudulent or illegal activities</li>
                <li>Submission of false or misleading information</li>
                <li>Non-payment of fees</li>
                <li>Any other conduct we deem harmful to the Platform or other users</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">12.3 Effect of Termination</h3>
              <p className="mb-4">
                Upon termination, your right to access and use the Platform will immediately cease. However, blockchain records 
                of your transactions will remain on the blockchain permanently, and provisions of these Terms that by their nature 
                should survive termination will remain in effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">13. Governing Law and Dispute Resolution</h2>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">13.1 Governing Law</h3>
              <p className="mb-4">
                These Terms & Conditions shall be governed by and construed in accordance with the laws of India, without regard 
                to its conflict of law provisions. Any disputes arising from these terms shall be subject to the exclusive 
                jurisdiction of the courts in India.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">13.2 Dispute Resolution</h3>
              <p className="mb-4">
                In the event of any dispute, controversy, or claim arising out of or relating to these Terms, we encourage you 
                to contact us first to seek an amicable resolution. If a resolution cannot be reached, disputes shall be resolved 
                through arbitration in accordance with the Arbitration and Conciliation Act, 2015.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">14. Modifications to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify, amend, or update these Terms & Conditions at any time at our sole discretion. 
                We will notify users of material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Posting the updated terms on this page</li>
                <li>Updating the &quot;Last updated&quot; date</li>
                <li>Sending notifications to registered users for significant changes</li>
              </ul>
              <p className="mb-4">
                Your continued use of the Platform after any changes constitutes your acceptance of the modified Terms & Conditions. 
                If you do not agree with the modifications, you must discontinue using the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">15. Severability and Waiver</h2>
              
              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">15.1 Severability</h3>
              <p className="mb-4">
                If any provision of these Terms & Conditions is found to be invalid, illegal, or unenforceable, the remaining 
                provisions shall continue in full force and effect, and the invalid provision shall be modified to the minimum 
                extent necessary to make it valid and enforceable.
              </p>

              <h3 className="text-lg sm:text-xl font-light text-white mb-3 mt-6">15.2 Waiver</h3>
              <p className="mb-4">
                Our failure to enforce any provision of these Terms shall not constitute a waiver of that provision or any other 
                provision. Any waiver must be in writing and signed by us.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">16. Entire Agreement</h2>
              <p className="mb-4">
                These Terms & Conditions, together with our Privacy Policy, constitute the entire agreement between you and TITLEREG 
                regarding your use of the Platform and supersede all prior agreements, understandings, or communications, whether 
                written or oral.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-4">17. Contact Information</h2>
              <p className="mb-4">
                If you have any questions, concerns, or requests regarding these Terms & Conditions, please contact us:
              </p>
              <ul className="list-none space-y-2 ml-4 mb-4">
                <li>Through our <Link href="/feedback" className="text-white underline">Feedback</Link> page</li>
                <li>Through our <Link href="/help" className="text-white underline">Help Center</Link></li>
              </ul>
              <p className="mb-4">
                We will make reasonable efforts to respond to your inquiries in a timely manner.
              </p>
            </section>

            <section className="bg-gray-900/30 border border-gray-800 rounded-lg p-4 sm:p-6 mt-12">
              <p className="text-gray-300 italic text-sm mb-2">
                <strong className="text-white">Acknowledgment:</strong> By using TITLEREG, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms & Conditions.
              </p>
              <p className="text-gray-300 italic text-sm">
                If you do not agree with any part of these terms, you must not use our Platform. Your use of the Platform 
                indicates your acceptance of these terms and your commitment to comply with all applicable laws and regulations.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
