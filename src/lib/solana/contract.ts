import { PublicKey, Connection, SystemProgram, Transaction, TransactionInstruction, Keypair } from '@solana/web3.js';
import { uploadJSONToIPFS } from '../ipfs/pinata';

// Solana Program Configuration
const programId = process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || 'GNiHMQxQZwT1u3vKs3z5Nq5RjYjThoeFhD5EUQ6ZL1Y3';
export const SOLANA_PROGRAM_ID = new PublicKey(programId);
export const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
export const connection = new Connection(SOLANA_RPC_URL);

// Calculate minimum account size for registration data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateAccountSize(registrationData: any, documentsIpfsHash: string, photosIpfsHash: string): number {
  const baseSize = 1 + 32; // initialized flag + authority pubkey
  let stringSize = 0;
  
  // Add sizes for all string fields
  const stringFields = [
    registrationData.registration_id,
    registrationData.survey_number,
    registrationData.plot_number,
    registrationData.village,
    registrationData.taluka,
    registrationData.district,
    registrationData.state,
    registrationData.pincode,
    registrationData.property_type,
    registrationData.area,
    registrationData.area_unit,
    registrationData.transaction_type,
    registrationData.consideration_amount,
    registrationData.stamp_duty,
    registrationData.registration_fee,
    registrationData.sale_agreement_date,
    registrationData.seller_name,
    registrationData.seller_father_name,
    registrationData.buyer_name,
    registrationData.buyer_father_name,
    documentsIpfsHash,
    photosIpfsHash,
  ];
  
  stringFields.forEach(str => {
    const length = str ? Buffer.from(str, 'utf8').length : 0;
    stringSize += 4 + length; // 4 bytes for length + string bytes
  });
  
  return baseSize + stringSize + 1 + 8; // + status + timestamp
}

// Helper function to pack string for Solana instruction
function packString(str: string): Buffer {
  const strBytes = Buffer.from(str, 'utf8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(strBytes.length, 0);
  return Buffer.concat([lengthBuffer, strBytes]);
}

// Helper function to create Initialize Registration instruction
function createInitializeRegistrationInstruction(
  documentsIpfsHash: string,
  photosIpfsHash: string,
  data: {
    registration_id: string;
    survey_number: string;
    plot_number: string;
    village: string;
    taluka: string;
    district: string;
    state: string;
    pincode: string;
    property_type: string;
    area: string;
    area_unit: string;
    transaction_type: string;
    consideration_amount: string;
    stamp_duty: string;
    registration_fee: string;
    sale_agreement_date: string;
    seller_name: string;
    seller_father_name: string;
    buyer_name: string;
    buyer_father_name: string;
  }
): Buffer {
  let instructionData = Buffer.from([0]); // Variant: 0 = InitializeRegistration
  
  instructionData = Buffer.concat([
    instructionData,
    packString(data.registration_id),
    packString(data.survey_number),
    packString(data.plot_number),
    packString(data.village),
    packString(data.taluka),
    packString(data.district),
    packString(data.state),
    packString(data.pincode),
    packString(data.property_type),
    packString(data.area),
    packString(data.area_unit),
    packString(data.transaction_type),
    packString(data.consideration_amount),
    packString(data.stamp_duty),
    packString(data.registration_fee),
    packString(data.sale_agreement_date),
    packString(data.seller_name),
    packString(data.seller_father_name),
    packString(data.buyer_name),
    packString(data.buyer_father_name),
    packString(documentsIpfsHash),
    packString(photosIpfsHash),
  ]);
  
  return instructionData;
}

// Initialize registration on Solana blockchain
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function initializeRegistrationOnSolana(
  wallet: any, // Wallet from useWallet hook
  sendTransactionFn: (transaction: Transaction, connection: Connection) => Promise<string>, // sendTransaction from useWallet hook
  documents: Record<string, { name: string; ipfsHash: string; mimeType: string }>,
  photos: Array<{ name: string; ipfsHash: string; mimeType: string }>,
  registrationData: {
    registration_id: string;
    survey_number: string;
    plot_number: string;
    village: string;
    taluka: string;
    district: string;
    state: string;
    pincode: string;
    property_type: string;
    area: string;
    area_unit: string;
    transaction_type: string;
    consideration_amount: string;
    stamp_duty: string;
    registration_fee: string;
    sale_agreement_date: string;
    seller_name: string;
    seller_father_name: string;
    buyer_name: string;
    buyer_father_name: string;
  }
): Promise<{ signature: string; accountAddress: string; solscanUrl: string }> {
  try {
    // Check if wallet is connected and has publicKey
    // The wallet object from useWallet might have adapter.publicKey or just publicKey
    const walletPublicKey = wallet?.adapter?.publicKey || wallet?.publicKey;
    if (!wallet || !walletPublicKey) {
      throw new Error('Wallet not connected');
    }
    
    console.log('📦 Uploading IPFS manifests...');
    
    // Upload documents manifest to IPFS
    const documentsIpfsHash = documents && Object.keys(documents).length > 0
      ? (await uploadJSONToIPFS(documents, 'documents_manifest.json')).hash
      : '';
    
    // Upload photos manifest to IPFS
    const photosIpfsHash = photos && photos.length > 0
      ? (await uploadJSONToIPFS(photos, 'photos_manifest.json')).hash
      : '';
    
    console.log('✅ IPFS manifests uploaded:', {
      documents: documentsIpfsHash,
      photos: photosIpfsHash,
    });
    
    // Create a unique registration account keypair
    const registrationAccount = Keypair.generate();
    
    // Calculate account size
    const accountSize = calculateAccountSize(registrationData, documentsIpfsHash, photosIpfsHash);
    const rentExemptionAmount = await connection.getMinimumBalanceForRentExemption(accountSize);
    
    console.log('📝 Creating Solana transaction...');
    
    // Create instruction data
    const instructionData = createInitializeRegistrationInstruction(
      documentsIpfsHash,
      photosIpfsHash,
      registrationData
    );
    
    // Create the transaction
    const transaction = new Transaction();
    
    // Add instruction to create and initialize the account
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: walletPublicKey,
      newAccountPubkey: registrationAccount.publicKey,
      lamports: rentExemptionAmount,
      space: accountSize,
      programId: SOLANA_PROGRAM_ID,
    });
    
    // Add the initialize instruction
    const initializeInstruction = new TransactionInstruction({
      keys: [
        { pubkey: registrationAccount.publicKey, isSigner: true, isWritable: true },
        { pubkey: walletPublicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: SOLANA_PROGRAM_ID,
      data: instructionData,
    });
    
    transaction.add(createAccountInstruction, initializeInstruction);
    
    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPublicKey;
    
    // Sign the transaction with registration account
    transaction.partialSign(registrationAccount);
    
    console.log('📤 Sending transaction to Solana...');
    
    // Send and confirm the transaction using the sendTransaction function from useWallet hook
    if (!sendTransactionFn) {
      throw new Error('sendTransaction function not provided');
    }
    
    const signature = await sendTransactionFn(transaction, connection);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await connection.confirmTransaction({ signature, blockhash }, 'confirmed');
    
    const registrationAccountAddress = registrationAccount.publicKey.toBase58();
    
    console.log('✅ Registration successfully stored on Solana:', {
      signature,
      registrationAccount: registrationAccountAddress,
      viewOnSolscan: `https://solscan.io/account/${registrationAccountAddress}?cluster=devnet`,
    });
    
    // Return both signature and account address as an object
    return {
      signature,
      accountAddress: registrationAccountAddress,
      solscanUrl: `https://solscan.io/account/${registrationAccountAddress}?cluster=devnet`,
    };
    
  } catch (error) {
    console.error('❌ Error initializing registration on Solana:', error);
    throw new Error(`Failed to initialize registration on Solana: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Update status on Solana
export function createUpdateStatusInstruction(status: number): Buffer {
  const instructionData = Buffer.from([1]); // Variant: 1 = UpdateStatus
  const statusBuffer = Buffer.from([status]);
  return Buffer.concat([instructionData, statusBuffer]);
}

// Update documents IPFS CID on Solana
export function createUpdateDocumentsCidInstruction(cid: string): Buffer {
  const instructionData = Buffer.from([2]); // Variant: 2 = UpdateDocumentsCid
  return Buffer.concat([instructionData, packString(cid)]);
}

// Update photos IPFS CID on Solana
export function createUpdatePhotosCidInstruction(cid: string): Buffer {
  const instructionData = Buffer.from([3]); // Variant: 3 = UpdatePhotosCid
  return Buffer.concat([instructionData, packString(cid)]);
}

