# TitleReg - Blockchain-Based Land Title Registration System

## Overview

TitleReg is a modern, decentralized land title registration and verification system built on the Solana blockchain. This application provides a secure, transparent, and efficient platform for managing land titles, leveraging blockchain technology, IPFS for document storage, and a robust web interface built with Next.js.

## Features

- **Blockchain-Based Title Registration**: Secure and immutable record-keeping on the Solana blockchain
- **Decentralized Document Storage**: IPFS integration for storing property documents
- **Digital Identity Verification**: Wallet-based authentication using Solana wallets
- **Smart Contract Integration**: Rust-based smart contracts for automated title management
- **User-Friendly Interface**: Modern web interface built with Next.js and Tailwind CSS
- **Draft Management**: Save and resume registration process
- **QR Code Generation**: Easy sharing and verification of property details
- **Multi-Step Registration Process**: Guided process for complete property registration

## Technology Stack

- **Frontend**: Next.js 15.5, React 18.2, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Blockchain**: Solana (Web3.js, Anchor Framework)
- **Storage**: 
  - IPFS (Pinata SDK)
  - Supabase for relational data
- **Authentication**: Solana Wallet Adapter
- **Smart Contract**: Rust

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Solana CLI tools
- A Solana wallet (Phantom, Solflare, etc.)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DayalRepo/Telangana_v4.git
   cd Telangana_v4
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file with necessary configurations
   - Configure Supabase credentials
   - Set up Pinata API keys
   - Add Solana network endpoints

4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `/src/app`: Next.js application routes and pages
- `/src/components`: Reusable React components
- `/src/lib`: Core functionality modules
  - `/ipfs`: IPFS integration and file handling
  - `/solana`: Smart contract interactions
  - `/supabase`: Database operations
- `/public`: Static assets
- `titlereg-smart-contract.rs`: Solana smart contract implementation
- `database-schema.sql`: Database schema definitions

## Key Features in Detail

### Land Title Registration
- Multi-step form for comprehensive property details
- Document upload and IPFS storage
- Blockchain transaction creation and confirmation
- QR code generation for registered properties

### Title Search and Verification
- Search functionality for registered properties
- Verification of property ownership
- Historical transaction records
- Document authenticity verification

### Smart Contract Features
- Title registration and transfer
- Ownership verification
- Property detail updates
- Transaction history tracking

## Security Features

- Wallet-based authentication
- Smart contract security measures
- Encrypted data storage
- IPFS content addressing
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the terms specified in the LICENSE file.

## Support

For support and queries:
- Check the Help section in the application
- Visit the Feedback page
- Review documentation in the `/docs` directory

## Development Status

This is version 4.0 of the TitleReg system, featuring improved security, enhanced user interface, and optimized smart contract implementation.

---

*Note: This is a production-ready implementation of a land title registration system.*
