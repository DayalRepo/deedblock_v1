'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { ChevronRight, ChevronLeft, FileText, CheckCircle, X, ChevronDown, AlertCircle, Loader2, Search, Plus, Trash2, Copy, Check, QrCode, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Lexend_Deca } from 'next/font/google';
import { saveDraft, getDraft, deleteDraft, saveRegistration, type RegistrationData } from '@/lib/supabase/database';
import { uploadFileToIPFS, uploadFilesToIPFS } from '@/lib/ipfs/pinata';
import { initializeRegistrationOnSolana } from '@/lib/solana/contract';

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});


interface FormData {
  // Step 1: Property Details
  propertyType: string;
  surveyNumber: string;
  plotNumber: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  area: string;
  areaUnit: string;
  propertyDescription: string;
  
  // Step 2: Transaction Details
  transactionType: string;
  considerationAmount: string;
  stampDuty: string;
  registrationFee: string;
  saleAgreementDate: string;
  
  // Step 3: Seller Information
  sellerName: string;
  sellerFatherName: string;
  sellerAge: string;
  sellerAddress: string;
  sellerPan: string;
  sellerAadhar: string;
  sellerPhone: string;
  sellerEmail: string;
  
  // Step 4: Buyer Information
  buyerName: string;
  buyerFatherName: string;
  buyerAge: string;
  buyerAddress: string;
  buyerPan: string;
  buyerAadhar: string;
  buyerPhone: string;
  buyerEmail: string;
  
  // Step 5: Documents
  documents: {
    saleDeed: File | null;
    khata: File | null;
    taxReceipt: File | null;
    encumbrance: File | null;
    surveySketch: File | null;
    aadhar: File | null;
    pan: File | null;
  };
  
  // Witness Information
  witnesses: Array<{
    name: string;
    address: string;
    phone: string;
    aadhar: string;
  }>;
  
  // Property Photos
  propertyPhotos: File[];
}

// Custom Minimalistic Icons
const PropertyIcon = ({ className = '' }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="6" width="5" height="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="11" y="6" width="5" height="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="3" y="13" width="5" height="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="11" y="13" width="5" height="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="3" y1="3" x2="17" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TransactionIcon = ({ className = '' }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 6H16M4 10H16M4 14H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="2" y="3" width="16" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const SellerIcon = ({ className = '' }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="13" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 18C2 14 4.5 12 7 12C9.5 12 13 14 13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 12C7 14 9.5 16 13 16C16.5 16 18 14 18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const BuyerIcon = ({ className = '' }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="13" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 18C2 14 4.5 12 7 12C9.5 12 13 14 13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 12C7 14 9.5 16 13 16C16.5 16 18 14 18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const DocumentsIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" className={className} fill="currentColor">
    <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640H447l-80-80H160v480l96-320h684L837-217q-8 26-29.5 41.5T760-160H160Zm84-80h516l72-240H316l-72 240Zm0 0 72-240-72 240Zm-84-400v-80 80Z"/>
  </svg>
);

const WitnessIcon = ({ className = '' }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="13" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 18C2 14 4.5 12 7 12C9.5 12 13 14 13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 12C7 14 9.5 16 13 16C16.5 16 18 14 18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ReviewIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" className={className} fill="currentColor">
    <path d="M657-121 544-234l56-56 57 57 127-127 56 56-183 183Zm-537 1v-80h360v80H120Zm0-160v-80h360v80H120Zm0-160v-80h720v80H120Zm0-160v-80h720v80H120Zm0-160v-80h720v80H120Z"/>
  </svg>
);

// Custom Minimalistic Icons for Upload Section

const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UploadIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor" className={className}>
    <path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/>
  </svg>
);

const PropertyPhotosIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor" className={className}>
    <path d="M40-200v-560h80v560H40Zm160 0v-560h80v560h-80Zm240 0q-33 0-56.5-23.5T360-280v-400q0-33 23.5-56.5T440-760h400q33 0 56.5 23.5T920-680v400q0 33-23.5 56.5T840-200H440Zm0-80h400v-400H440v400Zm40-80h320L696-500l-76 100-56-74-84 114Zm-40 80v-400 400Z"/>
  </svg>
);

const ViewImagesIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor" className={className}>
    <path d="M400-400h160v-80H400v80Zm0-120h320v-80H400v80Zm0-120h320v-80H400v80Zm-80 400q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z"/>
  </svg>
);

const DownloadSummaryIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor" className={className}>
    <path d="m480-280 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160ZM240-80q-33 0-56.5-23.5T160-160v-480l240-240h320q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm0-80h480v-640H434L240-606v446Zm0 0h480-480Z"/>
  </svg>
);

const ValidateIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" className={className} fill="currentColor">
    <path d="M222-200 80-342l56-56 85 85 170-170 56 57-225 226Zm0-320L80-662l56-56 85 85 170-170 56 57-225 226Zm298 240v-80h360v80H520Zm0-320v-80h360v80H520Z"/>
  </svg>
);

const steps = [
  { id: 1, title: 'Property', icon: PropertyIcon },
  { id: 2, title: 'Transaction', icon: TransactionIcon },
  { id: 3, title: 'Seller', icon: SellerIcon },
  { id: 4, title: 'Buyer', icon: BuyerIcon },
  { id: 5, title: 'Documents', icon: DocumentsIcon },
  { id: 6, title: 'Witnesses', icon: WitnessIcon },
  { id: 7, title: 'Review', icon: ReviewIcon },
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

interface AnimatedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
}

function AnimatedSelect({ value, onChange, options, placeholder = 'Select...', className = '', searchable = false }: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens (if searchable)
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchable]);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 flex items-center justify-between transition-colors"
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>{selectedLabel}</span>
        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="absolute z-50 w-full mt-2 bg-black border border-gray-800 rounded-lg shadow-lg overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-dashed border-gray-800">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-black/40 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    placeholder="Search..."
                  />
                </div>
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div key={option.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left px-4 py-3 text-white hover:bg-gray-900 transition-colors ${
                        value === option.value ? 'bg-gray-900' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                    {index < filteredOptions.length - 1 && (
                      <div className="mx-4 border-t border-dashed border-gray-800" />
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                  No results found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RegistrationPage() {
  const { connected, publicKey, wallet, sendTransaction } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<{ type: string; file: File } | null>(null);
  const [showPropertyPhotos, setShowPropertyPhotos] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [registrationId, setRegistrationId] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);
  const [formStartTime, setFormStartTime] = useState<number>(Date.now());
  const [formTimeElapsed, setFormTimeElapsed] = useState<number>(0);
  const hasRestoredFromDraft = useRef(false);
  const previousWalletAddress = useRef<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showDocumentValidation, setShowDocumentValidation] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [, setSendingEmail] = useState(false);
  const [, setEmailSent] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    propertyType: '',
    surveyNumber: '',
    plotNumber: '',
    village: '',
    taluka: '',
    district: '',
    state: '',
    pincode: '',
    area: '',
    areaUnit: 'sqft',
    propertyDescription: '',
    transactionType: '',
    considerationAmount: '',
    stampDuty: '',
    registrationFee: '',
    saleAgreementDate: '',
    sellerName: '',
    sellerFatherName: '',
    sellerAge: '',
    sellerAddress: '',
    sellerPan: '',
    sellerAadhar: '',
    sellerPhone: '',
    sellerEmail: '',
    buyerName: '',
    buyerFatherName: '',
    buyerAge: '',
    buyerAddress: '',
    buyerPan: '',
    buyerAadhar: '',
    buyerPhone: '',
    buyerEmail: '',
    documents: {
      saleDeed: null,
      khata: null,
      taxReceipt: null,
      encumbrance: null,
      surveySketch: null,
      aadhar: null,
      pan: null,
    },
    witnesses: [
      { name: '', address: '', phone: '', aadhar: '' },
      { name: '', address: '', phone: '', aadhar: '' },
    ],
    propertyPhotos: [],
  });

  // Detect wallet changes and reset form if different wallet is used
  useEffect(() => {
    const currentWalletAddress = publicKey?.toString() || null;
    
    // Check if wallet has changed (only if both are not null)
    if (previousWalletAddress.current !== null && 
        currentWalletAddress !== null &&
        currentWalletAddress !== previousWalletAddress.current) {
      // Different wallet detected - clear all saved data and reset form
      if (previousWalletAddress.current) {
        deleteDraft(previousWalletAddress.current).catch(console.error);
      }
      setCurrentStep(1);
      setFormData({
        propertyType: '',
        surveyNumber: '',
        plotNumber: '',
        village: '',
        taluka: '',
        district: '',
        state: '',
        pincode: '',
        area: '',
        areaUnit: 'sqft',
        propertyDescription: '',
        transactionType: '',
        considerationAmount: '',
        stampDuty: '',
        registrationFee: '',
        saleAgreementDate: '',
        sellerName: '',
        sellerFatherName: '',
        sellerAge: '',
        sellerAddress: '',
        sellerPan: '',
        sellerAadhar: '',
        sellerPhone: '',
        sellerEmail: '',
        buyerName: '',
        buyerFatherName: '',
        buyerAge: '',
        buyerAddress: '',
        buyerPan: '',
        buyerAadhar: '',
        buyerPhone: '',
        buyerEmail: '',
        documents: {
          saleDeed: null,
          khata: null,
          taxReceipt: null,
          encumbrance: null,
          surveySketch: null,
          aadhar: null,
          pan: null,
        },
        witnesses: [
          { name: '', address: '', phone: '', aadhar: '' },
          { name: '', address: '', phone: '', aadhar: '' },
        ],
        propertyPhotos: [],
      });
      setFormTimeElapsed(0);
      setFormStartTime(Date.now());
      hasRestoredFromDraft.current = false;
    }
    
    // Update previous wallet address (only when connected)
    if (currentWalletAddress !== null) {
      previousWalletAddress.current = currentWalletAddress;
    }
  }, [publicKey]);

  // Load draft from Supabase on mount
  useEffect(() => {
    const loadDraft = async () => {
      if (!publicKey?.toString()) return;
      
      try {
        const draft = await getDraft(publicKey.toString());
        if (draft && draft.form_data) {
          setFormData(prev => ({
            ...prev,
            ...draft.form_data,
            documents: prev.documents, // Keep current document state
            propertyPhotos: prev.propertyPhotos, // Keep current photos
          }));
          if (draft.current_step) setCurrentStep(draft.current_step);
          if (draft.form_time_elapsed !== undefined && draft.form_start_time) {
            setFormTimeElapsed(draft.form_time_elapsed);
            // Adjust formStartTime so timer continues correctly
            setFormStartTime(Date.now() - draft.form_time_elapsed);
          }
          hasRestoredFromDraft.current = true;
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    };

    if (connected && publicKey) {
      loadDraft();
    }
  }, [connected, publicKey]);

  // Save draft when wallet disconnects or data changes
  useEffect(() => {
    if (!connected || !publicKey?.toString()) {
      hasRestoredFromDraft.current = false;
      return;
    }

    const saveDraftToSupabase = async () => {
      try {
        // Deep clone and clean formData to remove any non-serializable values
        const formDataWithoutFiles = JSON.parse(JSON.stringify({
          ...formData,
          documents: {}, // Don't save File objects
          propertyPhotos: [], // Don't save File objects
        }));

        await saveDraft(publicKey.toString(), {
          current_step: currentStep,
          form_data: formDataWithoutFiles,
          form_time_elapsed: formTimeElapsed,
          form_start_time: formStartTime,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to save draft:', errorMessage);
        // Don't show error to user for auto-save failures, just log
        // Only show critical errors that prevent form submission
      }
    };

    saveDraftToSupabase();
  }, [connected, publicKey, formData, currentStep, formTimeElapsed, formStartTime]);

  // Auto-save draft to Supabase silently (without notification) - debounced
  useEffect(() => {
    if (!connected || !publicKey?.toString()) return;

    const saveTimeout = setTimeout(async () => {
      try {
        // Deep clone and clean formData to remove any non-serializable values
        const formDataWithoutFiles = JSON.parse(JSON.stringify({
          ...formData,
          documents: {}, // Don't save File objects
          propertyPhotos: [], // Don't save File objects
        }));

        await saveDraft(publicKey.toString(), {
          current_step: currentStep,
          form_data: formDataWithoutFiles,
          form_time_elapsed: formTimeElapsed,
          form_start_time: formStartTime,
        });
      } catch (error) {
        console.error('Failed to auto-save draft:', error);
      }
    }, 2000); // Debounce: save 2 seconds after user stops typing

    return () => clearTimeout(saveTimeout);
  }, [formData, currentStep, formTimeElapsed, formStartTime, connected, publicKey]);

  // Timer effect to track form completion time - only when wallet is connected
  useEffect(() => {
    if (!connected) {
      // Pause timer when wallet is disconnected
      return;
    }
    
    const timer = setInterval(() => {
      setFormTimeElapsed(Date.now() - formStartTime);
    }, 1000);
    return () => clearInterval(timer);
  }, [formStartTime, connected]);

  // Format input helpers
  const formatAadhar = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 12);
  };

  const formatPAN = (value: string) => {
    const alphanumeric = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return alphanumeric.slice(0, 10);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 10);
  };

  const formatPincode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 6);
  };

  // Auto-calculate stamp duty (typically 5-7% of consideration amount in India)
  const calculateStampDuty = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (numAmount && !isNaN(numAmount)) {
      const stampDuty = (numAmount * 0.06).toFixed(2); // 6% as average
      const registrationFee = Math.max(1000, numAmount * 0.001).toFixed(2); // 0.1% or minimum 1000
      return { stampDuty, registrationFee };
    }
    return { stampDuty: '', registrationFee: '' };
  };

  const handleInputChange = (field: string, value: string) => {
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Format specific fields
    if (field === 'sellerAadhar' || field === 'buyerAadhar') {
      value = formatAadhar(value);
    } else if (field === 'sellerPan' || field === 'buyerPan') {
      value = formatPAN(value);
    } else if (field === 'sellerPhone' || field === 'buyerPhone') {
      value = formatPhone(value);
    } else if (field === 'pincode') {
      value = formatPincode(value);
    } else if (field === 'considerationAmount') {
      // Auto-calculate stamp duty and registration fee
      const { stampDuty, registrationFee } = calculateStampDuty(value);
      setFormData(prev => ({
        ...prev,
        considerationAmount: value,
        stampDuty,
        registrationFee,
      }));
      return;
    }

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'documents') {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [child]: value,
          },
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleFileUpload = (documentType: keyof FormData['documents'], file: File | null) => {
    if (file && file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [documentType]: 'File size must be less than 10MB',
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: file,
      },
    }));
    
    // Clear error when file is uploaded
    if (file && errors[documentType]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[documentType];
        return newErrors;
      });
    }
  };

  const handlePhotoUpload = (files: FileList | null) => {
    if (files) {
      const newPhotos = Array.from(files);
      setFormData(prev => ({
        ...prev,
        propertyPhotos: [...prev.propertyPhotos, ...newPhotos].slice(0, 10), // Max 10 photos
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      propertyPhotos: prev.propertyPhotos.filter((_, i) => i !== index),
    }));
  };

  const handleWitnessChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.map((witness, i) =>
        i === index ? { ...witness, [field]: value } : witness
      ),
    }));
  };

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnesses: [...prev.witnesses, { name: '', address: '', phone: '', aadhar: '' }],
    }));
  };

  const removeWitness = (index: number) => {
    if (formData.witnesses.length > 1) {
      setFormData(prev => ({
        ...prev,
        witnesses: prev.witnesses.filter((_, i) => i !== index),
      }));
    }
  };

  const previewDocument = (type: string, file: File) => {
    setDocumentPreview({ type, file });
  };

  // Calculate form completion percentage
  const calculateProgress = (): number => {
    let totalFields = 0;
    let filledFields = 0;

    // Property Details (Step 1)
    const propertyFields = ['propertyType', 'surveyNumber', 'area', 'village', 'taluka', 'district', 'state', 'pincode'];
    propertyFields.forEach(field => {
      totalFields++;
      if (formData[field as keyof FormData] && String(formData[field as keyof FormData]).trim() !== '') {
        filledFields++;
      }
    });

    // Transaction Details (Step 2)
    const transactionFields = ['transactionType', 'considerationAmount', 'stampDuty', 'registrationFee', 'saleAgreementDate'];
    transactionFields.forEach(field => {
      totalFields++;
      if (formData[field as keyof FormData] && String(formData[field as keyof FormData]).trim() !== '') {
        filledFields++;
      }
    });

    // Seller Information (Step 3)
    const sellerFields = ['sellerName', 'sellerFatherName', 'sellerAge', 'sellerAddress', 'sellerPan', 'sellerAadhar', 'sellerPhone'];
    sellerFields.forEach(field => {
      totalFields++;
      if (formData[field as keyof FormData] && String(formData[field as keyof FormData]).trim() !== '') {
        filledFields++;
      }
    });

    // Buyer Information (Step 4)
    const buyerFields = ['buyerName', 'buyerFatherName', 'buyerAge', 'buyerAddress', 'buyerPan', 'buyerAadhar', 'buyerPhone'];
    buyerFields.forEach(field => {
      totalFields++;
      if (formData[field as keyof FormData] && String(formData[field as keyof FormData]).trim() !== '') {
        filledFields++;
      }
    });

    // Documents (Step 5)
    totalFields += 7; // 7 document types
    const uploadedDocs = Object.values(formData.documents).filter(f => f !== null).length;
    filledFields += uploadedDocs;

    // Witnesses (Step 6)
    totalFields += 8; // 2 witnesses * 4 fields each
    formData.witnesses.forEach(witness => {
      if (witness.name.trim()) filledFields++;
      if (witness.address.trim()) filledFields++;
      if (witness.phone.trim()) filledFields++;
      if (witness.aadhar.trim()) filledFields++;
    });

    return Math.round((filledFields / totalFields) * 100);
  };

  // Format time elapsed
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Print registration summary
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const printSummary = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const summary = `
      <html>
        <head>
          <title>Land Registration Summary</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 20px; }
            .section { margin: 15px 0; }
            .field { margin: 5px 0; }
            .label { font-weight: bold; display: inline-block; width: 200px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            table th, table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            table th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>LAND REGISTRATION SUMMARY</h1>
          <p><strong>Registration ID:</strong> ${registrationId || 'Not generated yet'}</p>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          
          <h2>PROPERTY DETAILS</h2>
          <div class="section">
            <div class="field"><span class="label">Type:</span> ${formData.propertyType || 'N/A'}</div>
            <div class="field"><span class="label">Survey Number:</span> ${formData.surveyNumber || 'N/A'}</div>
            <div class="field"><span class="label">Plot Number:</span> ${formData.plotNumber || 'N/A'}</div>
            <div class="field"><span class="label">Area:</span> ${formData.area} ${formData.areaUnit}</div>
            <div class="field"><span class="label">Location:</span> ${formData.village}, ${formData.taluka}, ${formData.district}, ${formData.state}</div>
            <div class="field"><span class="label">PIN Code:</span> ${formData.pincode}</div>
          </div>

          <h2>TRANSACTION DETAILS</h2>
          <div class="section">
            <div class="field"><span class="label">Type:</span> ${formData.transactionType || 'N/A'}</div>
            <div class="field"><span class="label">Date:</span> ${formData.saleAgreementDate || 'N/A'}</div>
            <div class="field"><span class="label">Amount:</span> ₹${formData.considerationAmount || 'N/A'}</div>
            <div class="field"><span class="label">Stamp Duty:</span> ₹${formData.stampDuty || 'N/A'}</div>
            <div class="field"><span class="label">Registration Fee:</span> ₹${formData.registrationFee || 'N/A'}</div>
          </div>

          <h2>SELLER INFORMATION</h2>
          <div class="section">
            <div class="field"><span class="label">Name:</span> ${formData.sellerName || 'N/A'}</div>
            <div class="field"><span class="label">Father's Name:</span> ${formData.sellerFatherName || 'N/A'}</div>
            <div class="field"><span class="label">Age:</span> ${formData.sellerAge || 'N/A'}</div>
            <div class="field"><span class="label">Aadhar:</span> ${formData.sellerAadhar || 'N/A'}</div>
            <div class="field"><span class="label">PAN:</span> ${formData.sellerPan || 'N/A'}</div>
            <div class="field"><span class="label">Phone:</span> ${formData.sellerPhone || 'N/A'}</div>
            <div class="field"><span class="label">Email:</span> ${formData.sellerEmail || 'N/A'}</div>
            <div class="field"><span class="label">Address:</span> ${formData.sellerAddress || 'N/A'}</div>
          </div>

          <h2>BUYER INFORMATION</h2>
          <div class="section">
            <div class="field"><span class="label">Name:</span> ${formData.buyerName || 'N/A'}</div>
            <div class="field"><span class="label">Father's Name:</span> ${formData.buyerFatherName || 'N/A'}</div>
            <div class="field"><span class="label">Age:</span> ${formData.buyerAge || 'N/A'}</div>
            <div class="field"><span class="label">Aadhar:</span> ${formData.buyerAadhar || 'N/A'}</div>
            <div class="field"><span class="label">PAN:</span> ${formData.buyerPan || 'N/A'}</div>
            <div class="field"><span class="label">Phone:</span> ${formData.buyerPhone || 'N/A'}</div>
            <div class="field"><span class="label">Email:</span> ${formData.buyerEmail || 'N/A'}</div>
            <div class="field"><span class="label">Address:</span> ${formData.buyerAddress || 'N/A'}</div>
          </div>

          <h2>WITNESSES</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Aadhar</th>
              </tr>
            </thead>
            <tbody>
              ${formData.witnesses.map(w => `
                <tr>
                  <td>${w.name || 'N/A'}</td>
                  <td>${w.address || 'N/A'}</td>
                  <td>${w.phone || 'N/A'}</td>
                  <td>${w.aadhar || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>DOCUMENTS & PHOTOS</h2>
          <div class="section">
            <p><strong>Documents Uploaded:</strong> ${Object.values(formData.documents).filter(f => f).length} / 7</p>
            <p><strong>Property Photos:</strong> ${formData.propertyPhotos.length} photo(s)</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(summary);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadSummary = async () => {
    const summary = `
LAND REGISTRATION SUMMARY
=========================

PROPERTY DETAILS
----------------
Type: ${formData.propertyType || 'N/A'}
Survey Number: ${formData.surveyNumber || 'N/A'}
Plot Number: ${formData.plotNumber || 'N/A'}
Area: ${formData.area} ${formData.areaUnit}
Location: ${formData.village}, ${formData.taluka}, ${formData.district}, ${formData.state}
PIN Code: ${formData.pincode}

TRANSACTION DETAILS
-------------------
Type: ${formData.transactionType || 'N/A'}
Date: ${formData.saleAgreementDate || 'N/A'}
Consideration Amount: ₹${formData.considerationAmount || 'N/A'}
Stamp Duty: ₹${formData.stampDuty || 'N/A'}
Registration Fee: ₹${formData.registrationFee || 'N/A'}

SELLER INFORMATION
------------------
Name: ${formData.sellerName || 'N/A'}
Father's/Husband's Name: ${formData.sellerFatherName || 'N/A'}
Age: ${formData.sellerAge || 'N/A'}
Aadhar: ${formData.sellerAadhar || 'N/A'}
PAN: ${formData.sellerPan || 'N/A'}
Phone: ${formData.sellerPhone || 'N/A'}
Email: ${formData.sellerEmail || 'N/A'}
Address: ${formData.sellerAddress || 'N/A'}

BUYER INFORMATION
-----------------
Name: ${formData.buyerName || 'N/A'}
Father's/Husband's Name: ${formData.buyerFatherName || 'N/A'}
Age: ${formData.buyerAge || 'N/A'}
Aadhar: ${formData.buyerAadhar || 'N/A'}
PAN: ${formData.buyerPan || 'N/A'}
Phone: ${formData.buyerPhone || 'N/A'}
Email: ${formData.buyerEmail || 'N/A'}
Address: ${formData.buyerAddress || 'N/A'}

WITNESSES
---------
${formData.witnesses.map((w, i) => `
Witness ${i + 1}:
  Name: ${w.name || 'N/A'}
  Address: ${w.address || 'N/A'}
  Phone: ${w.phone || 'N/A'}
  Aadhar: ${w.aadhar || 'N/A'}
`).join('\n')}

DOCUMENTS UPLOADED
------------------
${Object.entries(formData.documents)
  .map(([key, file]) => `${key}: ${file ? file.name : 'Not uploaded'}`)
  .join('\n')}

PROPERTY PHOTOS
---------------
${formData.propertyPhotos.length} photo(s) uploaded

Generated on: ${new Date().toLocaleString()}
Registration ID: REG-${Date.now().toString().slice(-8)}
    `;

    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add summary text file
      zip.file('registration-summary.txt', summary);

      // Add documents folder
      const documentsFolder = zip.folder('documents');
      if (documentsFolder) {
        for (const file of Object.values(formData.documents)) {
          if (file) {
            const fileData = await file.arrayBuffer();
            documentsFolder.file(file.name, fileData);
          }
        }
      }

      // Add property photos folder
      const photosFolder = zip.folder('property-photos');
      if (photosFolder) {
        for (let i = 0; i < formData.propertyPhotos.length; i++) {
          const photo = formData.propertyPhotos[i];
          const photoData = await photo.arrayBuffer();
          photosFolder.file(photo.name, photoData);
        }
      }

      // Generate zip file
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `land-registration-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
      // Fallback to just downloading the summary text
      const blob = new Blob([summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `land-registration-summary-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Validation functions
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
        if (!formData.surveyNumber) newErrors.surveyNumber = 'Survey number is required';
        if (!formData.area) newErrors.area = 'Area is required';
        if (formData.area && parseFloat(formData.area) <= 0) newErrors.area = 'Area must be greater than 0';
        if (!formData.village) newErrors.village = 'Village/Town is required';
        if (!formData.taluka) newErrors.taluka = 'Taluka is required';
        if (!formData.district) newErrors.district = 'District is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.pincode) newErrors.pincode = 'PIN code is required';
        if (formData.pincode && formData.pincode.length !== 6) newErrors.pincode = 'PIN code must be 6 digits';
        break;

      case 2:
        if (!formData.transactionType) newErrors.transactionType = 'Transaction type is required';
        if (!formData.saleAgreementDate) newErrors.saleAgreementDate = 'Sale agreement date is required';
        if (formData.saleAgreementDate) {
          const selectedDate = new Date(formData.saleAgreementDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate > today) {
            newErrors.saleAgreementDate = 'Date cannot be in the future';
          }
        }
        if (!formData.considerationAmount) newErrors.considerationAmount = 'Consideration amount is required';
        if (formData.considerationAmount && parseFloat(formData.considerationAmount) <= 0) {
          newErrors.considerationAmount = 'Amount must be greater than 0';
        }
        break;

      case 3:
        if (!formData.sellerName) newErrors.sellerName = 'Seller name is required';
        if (!formData.sellerFatherName) newErrors.sellerFatherName = 'Father\'s/Husband\'s name is required';
        if (!formData.sellerAge) newErrors.sellerAge = 'Age is required';
        if (!formData.sellerAadhar) newErrors.sellerAadhar = 'Aadhar number is required';
        if (formData.sellerAadhar && formData.sellerAadhar.length !== 12) {
          newErrors.sellerAadhar = 'Aadhar must be 12 digits';
        }
        if (!formData.sellerPan) newErrors.sellerPan = 'PAN number is required';
        if (formData.sellerPan && formData.sellerPan.length !== 10) {
          newErrors.sellerPan = 'PAN must be 10 characters';
        }
        if (!formData.sellerPhone) newErrors.sellerPhone = 'Phone number is required';
        if (formData.sellerPhone && formData.sellerPhone.length !== 10) {
          newErrors.sellerPhone = 'Phone must be 10 digits';
        }
        if (!formData.sellerAddress) newErrors.sellerAddress = 'Address is required';
        if (formData.sellerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.sellerEmail)) {
          newErrors.sellerEmail = 'Invalid email format';
        }
        break;

      case 4:
        if (!formData.buyerName) newErrors.buyerName = 'Buyer name is required';
        if (!formData.buyerFatherName) newErrors.buyerFatherName = 'Father\'s/Husband\'s name is required';
        if (!formData.buyerAge) newErrors.buyerAge = 'Age is required';
        if (!formData.buyerAadhar) newErrors.buyerAadhar = 'Aadhar number is required';
        if (formData.buyerAadhar && formData.buyerAadhar.length !== 12) {
          newErrors.buyerAadhar = 'Aadhar must be 12 digits';
        }
        if (!formData.buyerPan) newErrors.buyerPan = 'PAN number is required';
        if (formData.buyerPan && formData.buyerPan.length !== 10) {
          newErrors.buyerPan = 'PAN must be 10 characters';
        }
        if (!formData.buyerPhone) newErrors.buyerPhone = 'Phone number is required';
        if (formData.buyerPhone && formData.buyerPhone.length !== 10) {
          newErrors.buyerPhone = 'Phone must be 10 digits';
        }
        if (!formData.buyerAddress) newErrors.buyerAddress = 'Address is required';
        if (formData.buyerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail)) {
          newErrors.buyerEmail = 'Invalid email format';
        }
        break;

      case 5:
        if (!formData.documents.saleDeed) newErrors.saleDeed = 'Sale Deed is required';
        else if (formData.documents.saleDeed && formData.documents.saleDeed.size > 10 * 1024 * 1024) {
          newErrors.saleDeed = 'File size must be less than 10MB';
        }
        if (!formData.documents.khata) newErrors.khata = 'Khata Certificate is required';
        else if (formData.documents.khata && formData.documents.khata.size > 10 * 1024 * 1024) {
          newErrors.khata = 'File size must be less than 10MB';
        }
        if (!formData.documents.taxReceipt) newErrors.taxReceipt = 'Property Tax Receipt is required';
        else if (formData.documents.taxReceipt && formData.documents.taxReceipt.size > 10 * 1024 * 1024) {
          newErrors.taxReceipt = 'File size must be less than 10MB';
        }
        if (!formData.documents.encumbrance) newErrors.encumbrance = 'Encumbrance Certificate is required';
        else if (formData.documents.encumbrance && formData.documents.encumbrance.size > 10 * 1024 * 1024) {
          newErrors.encumbrance = 'File size must be less than 10MB';
        }
        if (!formData.documents.surveySketch) newErrors.surveySketch = 'Survey Sketch is required';
        else if (formData.documents.surveySketch && formData.documents.surveySketch.size > 10 * 1024 * 1024) {
          newErrors.surveySketch = 'File size must be less than 10MB';
        }
        if (!formData.documents.aadhar) newErrors.aadhar = 'Aadhar Card is required';
        else if (formData.documents.aadhar && formData.documents.aadhar.size > 10 * 1024 * 1024) {
          newErrors.aadhar = 'File size must be less than 10MB';
        }
        if (!formData.documents.pan) newErrors.pan = 'PAN Card is required';
        else if (formData.documents.pan && formData.documents.pan.size > 10 * 1024 * 1024) {
          newErrors.pan = 'File size must be less than 10MB';
        }
        break;

      case 6:
        formData.witnesses.forEach((witness, index) => {
          if (!witness.name) newErrors[`witness${index}name`] = `Witness ${index + 1} name is required`;
          if (!witness.address) newErrors[`witness${index}address`] = `Witness ${index + 1} address is required`;
          if (!witness.phone) newErrors[`witness${index}phone`] = `Witness ${index + 1} phone is required`;
          if (witness.phone && witness.phone.length !== 10) {
            newErrors[`witness${index}phone`] = `Witness ${index + 1} phone must be 10 digits`;
          }
          if (!witness.aadhar) newErrors[`witness${index}aadhar`] = `Witness ${index + 1} Aadhar is required`;
          if (witness.aadhar && witness.aadhar.length !== 12) {
            newErrors[`witness${index}aadhar`] = `Witness ${index + 1} Aadhar must be 12 digits`;
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!connected) {
      setSubmitError('Please connect your wallet before proceeding with registration.');
      return;
    }
    
    if (validateStep(currentStep)) {
      // Save draft and show notification when completing a step
      if (connected && publicKey?.toString()) {
        // Deep clone and clean formData to remove any non-serializable values
        const formDataWithoutFiles = JSON.parse(JSON.stringify({
          ...formData,
          documents: {},
          propertyPhotos: [],
        }));

        saveDraft(publicKey.toString(), {
          current_step: currentStep,
          form_data: formDataWithoutFiles,
          form_time_elapsed: formTimeElapsed,
          form_start_time: formStartTime,
        })
          .then(() => {
            setDraftSaved(true);
            setTimeout(() => setDraftSaved(false), 3000);
          })
          .catch((error) => {
            console.error('Failed to save draft:', error);
          });
      }
      
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
        // Scroll to top of page when moving to next step
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Scroll to top of page when moving to previous step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetForm = async () => {
    // Delete draft from Supabase if wallet is connected
    if (connected && publicKey?.toString()) {
      try {
        await deleteDraft(publicKey.toString());
      } catch (error) {
        console.error('Failed to delete draft:', error);
      }
    }

    setFormData({
      propertyType: '',
      surveyNumber: '',
      plotNumber: '',
      village: '',
      taluka: '',
      district: '',
      state: '',
      pincode: '',
      area: '',
      areaUnit: 'sqft',
      propertyDescription: '',
      transactionType: '',
      considerationAmount: '',
      stampDuty: '',
      registrationFee: '',
      saleAgreementDate: '',
      sellerName: '',
      sellerFatherName: '',
      sellerAge: '',
      sellerAddress: '',
      sellerPan: '',
      sellerAadhar: '',
      sellerPhone: '',
      sellerEmail: '',
      buyerName: '',
      buyerFatherName: '',
      buyerAge: '',
      buyerAddress: '',
      buyerPan: '',
      buyerAadhar: '',
      buyerPhone: '',
      buyerEmail: '',
      documents: {
        saleDeed: null,
        khata: null,
        taxReceipt: null,
        encumbrance: null,
        surveySketch: null,
        aadhar: null,
        pan: null,
      },
      witnesses: [
        { name: '', address: '', phone: '', aadhar: '' },
        { name: '', address: '', phone: '', aadhar: '' },
      ],
      propertyPhotos: [],
    });
    setCurrentStep(1);
    setErrors({});
    // Reset timer and progress
    setFormStartTime(Date.now());
    setFormTimeElapsed(0);
  };

  const handleSuccessClose = useCallback(() => {
    setSubmitSuccess(false);
    setCountdown(0);
    setRegistrationId('');
    setEmailSent(false);
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown effect when form is successfully submitted
  useEffect(() => {
    if (submitSuccess) {
      // Start countdown when submission succeeds
      setCountdown(15);
    } else {
      // Reset countdown when modal closes
      setCountdown(0);
    }
  }, [submitSuccess]);

  // Countdown timer effect
  useEffect(() => {
    if (!submitSuccess || countdown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prevCountdown => {
        const newCountdown = prevCountdown - 1;
        
        // Only redirect when countdown reaches 0
        if (newCountdown === 0) {
          setTimeout(() => {
            handleSuccessClose();
          }, 500);
        }
        
        return newCountdown;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, submitSuccess, handleSuccessClose]);

  const handleSubmit = async () => {
    // Final validation - check all steps
    let isValid = true;
    for (let step = 1; step <= steps.length; step++) {
      const stepValid = validateStep(step);
      if (!stepValid) {
        isValid = false;
        setCurrentStep(step); // Go to first step with errors
        break;
      }
    }
    
    if (!isValid) {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate registration ID
      const regId = `REG-${Date.now().toString().slice(-8)}`;
      setRegistrationId(regId);
      
      // Upload documents to IPFS
      const documentsIPFS: Record<string, { name: string; ipfsHash: string; mimeType: string }> = {};
      const documentUploadPromises: Promise<void>[] = [];
      
      for (const [key, file] of Object.entries(formData.documents)) {
        if (file) {
          const uploadPromise = (async () => {
            try {
              const result = await uploadFileToIPFS(file as File, file.name);
              if (!result || !result.hash) {
                throw new Error(`Upload failed: No hash returned for ${key}`);
              }
              documentsIPFS[key] = {
                name: file.name,
                ipfsHash: result.hash,
                mimeType: file.type || 'application/octet-stream',
              };
            } catch (error) {
              console.error(`❌ Error uploading document ${key} to IPFS:`, error);
              throw new Error(`Failed to upload document ${key} (${file.name}). ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          })();
          documentUploadPromises.push(uploadPromise);
        }
      }
      
      // Wait for all documents to upload
      if (documentUploadPromises.length > 0) {
        await Promise.all(documentUploadPromises);
      }

      // Upload photos to IPFS
      let photosIPFS: Array<{ name: string; ipfsHash: string; mimeType: string }> = [];
      if (formData.propertyPhotos.length > 0) {
        try {
          const uploadedPhotos = await uploadFilesToIPFS(formData.propertyPhotos);
          
          // Validate all photos were uploaded
          if (uploadedPhotos.length !== formData.propertyPhotos.length) {
            throw new Error(`Only ${uploadedPhotos.length} of ${formData.propertyPhotos.length} photos were uploaded successfully`);
          }
          
          // Map the uploaded photos to match the expected format (hash -> ipfsHash)
          photosIPFS = uploadedPhotos.map((photo, index) => {
            if (!photo.hash) {
              throw new Error(`Photo ${index + 1} (${photo.name}) uploaded but no hash returned`);
            }
            return {
              name: photo.name,
              ipfsHash: photo.hash, // Convert hash to ipfsHash
              mimeType: photo.mimeType || 'image/jpeg',
            };
          });
        } catch (error) {
          console.error('❌ Error uploading photos to IPFS:', error);
          throw new Error(`Failed to upload property photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Prepare registration data for Supabase
      const registrationDate = new Date().toISOString().split('T')[0];
      const walletAddress = publicKey?.toString() || '';

      if (!walletAddress) {
        throw new Error('Wallet not connected. Please connect your wallet to submit registration.');
      }

      const registrationData: RegistrationData = {
        registration_id: regId,
        registration_date: registrationDate,
        wallet_address: walletAddress,
        status: 'verified',
        
        // Property Details
        property_type: formData.propertyType,
        survey_number: formData.surveyNumber,
        plot_number: formData.plotNumber,
        village: formData.village,
        taluka: formData.taluka,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        area: formData.area,
        area_unit: formData.areaUnit,
        property_description: formData.propertyDescription || undefined,
        
        // Transaction Details
        transaction_type: formData.transactionType,
        consideration_amount: formData.considerationAmount,
        stamp_duty: formData.stampDuty,
        registration_fee: formData.registrationFee,
        sale_agreement_date: formData.saleAgreementDate,
        
        // Seller Information
        seller_name: formData.sellerName,
        seller_father_name: formData.sellerFatherName,
        seller_age: formData.sellerAge || undefined,
        seller_address: formData.sellerAddress || undefined,
        seller_pan: formData.sellerPan || undefined,
        seller_aadhar: formData.sellerAadhar || undefined,
        seller_phone: formData.sellerPhone || undefined,
        seller_email: formData.sellerEmail || undefined,
        
        // Buyer Information
        buyer_name: formData.buyerName,
        buyer_father_name: formData.buyerFatherName,
        buyer_age: formData.buyerAge || undefined,
        buyer_address: formData.buyerAddress || undefined,
        buyer_pan: formData.buyerPan || undefined,
        buyer_aadhar: formData.buyerAadhar || undefined,
        buyer_phone: formData.buyerPhone || undefined,
        buyer_email: formData.buyerEmail || undefined,
        
        // Witnesses
        witnesses: formData.witnesses.length > 0 ? formData.witnesses : undefined,
        
        // Documents (stored as IPFS hashes)
        documents: Object.keys(documentsIPFS).length > 0 ? documentsIPFS : undefined,
        
        // Property Photos (stored as IPFS hashes)
        property_photos: photosIPFS.length > 0 ? photosIPFS : undefined,
      };

      // Save registration to Supabase
      await saveRegistration(registrationData);
      // Save registration to Solana blockchain
      try {
        // Ensure wallet is connected before proceeding
        if (!connected || !wallet || !publicKey) {
          throw new Error('Wallet not connected. Please connect your wallet to submit registration.');
        }
        
        // Verify wallet has publicKey access
        const walletPublicKey = wallet?.adapter?.publicKey || publicKey;
        if (!walletPublicKey) {
          throw new Error('Wallet public key not available. Please reconnect your wallet.');
        }
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const blockchainResult = await initializeRegistrationOnSolana(
          wallet,
          sendTransaction,
          documentsIPFS,
          photosIPFS,
          {
            registration_id: registrationData.registration_id,
            survey_number: registrationData.survey_number,
            plot_number: registrationData.plot_number,
            village: registrationData.village,
            taluka: registrationData.taluka,
            district: registrationData.district,
            state: registrationData.state,
            pincode: registrationData.pincode,
            property_type: registrationData.property_type,
            area: registrationData.area,
            area_unit: registrationData.area_unit,
            transaction_type: registrationData.transaction_type,
            consideration_amount: registrationData.consideration_amount,
            stamp_duty: registrationData.stamp_duty,
            registration_fee: registrationData.registration_fee,
            sale_agreement_date: registrationData.sale_agreement_date,
            seller_name: registrationData.seller_name,
            seller_father_name: registrationData.seller_father_name,
            buyer_name: registrationData.buyer_name,
            buyer_father_name: registrationData.buyer_father_name,
          }
        );
      } catch (error) {
        console.error('❌ Failed to save to Solana blockchain:', error);
        // Don't fail the entire registration if Solana fails
        // Supabase already has the data, but log the error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('⚠️ Registration saved to Supabase but blockchain submission failed:', errorMessage);
        // You might want to show a warning to the user here
      }

      // Delete draft after successful submission
      if (walletAddress) {
        try {
          await deleteDraft(walletAddress);
        } catch (error) {
          console.error('Failed to delete draft after submission:', error);
        }
      }
      
      // Automatically send email notification
      await sendEmailNotification();
      
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit registration. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRegistrationId = async () => {
    if (registrationId) {
      try {
        await navigator.clipboard.writeText(registrationId);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Document validation checker
  const validateDocuments = (): Array<{
    name: string;
    status: 'valid' | 'warning' | 'missing';
    issues: string[];
    size: number;
    type: string;
  }> => {
    const validationResults: Array<{
      name: string;
      status: 'valid' | 'warning' | 'missing';
      issues: string[];
      size: number;
      type: string;
    }> = [];
    const uploadedDocs = Object.entries(formData.documents);
    
    uploadedDocs.forEach(([key, file]) => {
      if (file) {
        const result: {
          name: string;
          status: 'valid' | 'warning' | 'missing';
          issues: string[];
          size: number;
          type: string;
        } = {
          name: key,
          status: 'valid',
          issues: [] as string[],
          size: file.size,
          type: file.type,
        };

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          result.status = 'warning';
          result.issues.push('File size exceeds 10MB');
        }

        // Check file type
        const validTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ];
        if (!validTypes.includes(file.type)) {
          result.status = 'warning';
          result.issues.push('Unsupported file type');
        }

        // Check file name
        if (file.name.length > 100) {
          result.status = 'warning';
          result.issues.push('File name too long');
        }

        if (result.issues.length === 0) {
          result.status = 'valid';
        }

        validationResults.push(result);
      } else {
        validationResults.push({
          name: key,
          status: 'missing',
          issues: ['Document not uploaded'],
          size: 0,
          type: '',
        });
      }
    });

    return validationResults;
  };

  // Send email notification
  const sendEmailNotification = async () => {
    // Only send email if at least one email address is provided
    if (!formData.sellerEmail && !formData.buyerEmail) {
      return;
    }

    setSendingEmail(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmailSent(true);
      
      // Hide notification after 3 seconds
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setSendingEmail(false);
    }
  };

  // Share registration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shareRegistration = async () => {
    const shareData = {
      title: 'Land Registration Complete',
      text: `Land Registration ID: ${registrationId}\n\nProperty: ${formData.propertyType} at ${formData.village}, ${formData.state}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text}\n\nRegistration URL: ${shareData.url}`
        );
        alert('Registration details copied to clipboard!');
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium mb-4 sm:mb-6`}>Property Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm text-white mb-2">Property Type *</label>
                <AnimatedSelect
                  value={formData.propertyType}
                  onChange={(value) => handleInputChange('propertyType', value)}
                  placeholder="Select Property Type"
                  options={[
                    { value: 'residential', label: 'Residential Land' },
                    { value: 'commercial', label: 'Commercial Land' },
                    { value: 'agricultural', label: 'Agricultural Land' },
                    { value: 'industrial', label: 'Industrial Land' },
                    { value: 'plot', label: 'Plot' },
                    { value: 'house', label: 'House/Flat' },
                  ]}
                />
                {errors.propertyType && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.propertyType}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Survey Number *</label>
                <input
                  type="text"
                  value={formData.surveyNumber}
                  onChange={(e) => handleInputChange('surveyNumber', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.surveyNumber ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter Survey Number"
                />
                {errors.surveyNumber && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.surveyNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Plot Number</label>
                <input
                  type="text"
                  value={formData.plotNumber}
                  onChange={(e) => handleInputChange('plotNumber', e.target.value)}
                  className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600"
                  placeholder="Enter Plot Number"
                />
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Area *</label>
                <div className="flex gap-2 flex-nowrap">
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    className={`flex-1 min-w-0 bg-black/40 border rounded-lg px-3 sm:px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                      errors.area ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="Enter Area"
                  />
                  <AnimatedSelect
                    value={formData.areaUnit}
                    onChange={(value) => handleInputChange('areaUnit', value)}
                    placeholder="Unit"
                    className="w-20 sm:w-24 flex-shrink-0"
                    options={[
                      { value: 'sqft', label: 'Sqft' },
                      { value: 'sqmt', label: 'Sqmt' },
                      { value: 'acre', label: 'Acre' },
                      { value: 'hectare', label: 'Hectare' },
                    ]}
                  />
                </div>
                {errors.area && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.area}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Village/Town *</label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => handleInputChange('village', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.village ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter Village/Town"
                />
                {errors.village && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.village}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Taluka *</label>
                <input
                  type="text"
                  value={formData.taluka}
                  onChange={(e) => handleInputChange('taluka', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.taluka ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter Taluka"
                />
                {errors.taluka && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.taluka}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">District *</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.district ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter District"
                />
                {errors.district && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.district}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">State *</label>
                <AnimatedSelect
                  value={formData.state}
                  onChange={(value) => handleInputChange('state', value)}
                  placeholder="Select State"
                  options={indianStates.map(state => ({ value: state, label: state }))}
                  searchable={true}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.state}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">PIN Code *</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                        errors.pincode ? 'border-red-500' : 'border-gray-700'
                      }`}
                  placeholder="Enter PIN Code"
                  maxLength={6}
                />
                {errors.pincode && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.pincode}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Property Description</label>
              <textarea
                value={formData.propertyDescription}
                onChange={(e) => handleInputChange('propertyDescription', e.target.value)}
                className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 h-32 resize-none"
                placeholder="Enter property description and boundaries..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium mb-4 sm:mb-6`}>Transaction Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm text-white mb-2">Transaction Type *</label>
                <AnimatedSelect
                  value={formData.transactionType}
                  onChange={(value) => handleInputChange('transactionType', value)}
                  placeholder="Select Transaction Type"
                  options={[
                    { value: 'sale', label: 'Sale' },
                    { value: 'gift', label: 'Gift' },
                    { value: 'partition', label: 'Partition' },
                    { value: 'lease', label: 'Lease' },
                    { value: 'mortgage', label: 'Mortgage' },
                    { value: 'exchange', label: 'Exchange' },
                  ]}
                />
                {errors.transactionType && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.transactionType}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Sale Agreement Date *</label>
                <input
                  type="date"
                  value={formData.saleAgreementDate}
                  onChange={(e) => handleInputChange('saleAgreementDate', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.saleAgreementDate ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
                {errors.saleAgreementDate && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.saleAgreementDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Consideration Amount (₹) *</label>
                <input
                  type="number"
                  value={formData.considerationAmount}
                  onChange={(e) => handleInputChange('considerationAmount', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.considerationAmount ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter consideration amount"
                />
                {errors.considerationAmount && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.considerationAmount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Stamp Duty (₹) *</label>
                <input
                  type="number"
                  value={formData.stampDuty}
                  onChange={(e) => handleInputChange('stampDuty', e.target.value)}
                  className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600"
                  placeholder="Enter stamp duty amount"
                />
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Registration Fee (₹) *</label>
                <input
                  type="number"
                  value={formData.registrationFee}
                  onChange={(e) => handleInputChange('registrationFee', e.target.value)}
                  className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600"
                  placeholder="Enter registration fee"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium mb-4 sm:mb-6`}>Seller Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm text-white mb-2">Seller Name *</label>
                <input
                  type="text"
                  value={formData.sellerName}
                  onChange={(e) => handleInputChange('sellerName', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.sellerName ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter seller full name"
                />
                {errors.sellerName && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.sellerName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Father&apos;s/Husband&apos;s Name *</label>
                <input
                  type="text"
                  value={formData.sellerFatherName}
                  onChange={(e) => handleInputChange('sellerFatherName', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.sellerFatherName ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter father&apos;s/husband&apos;s name"
                />
                {errors.sellerFatherName && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.sellerFatherName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Age *</label>
                <input
                  type="number"
                  value={formData.sellerAge}
                  onChange={(e) => handleInputChange('sellerAge', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.sellerAge ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter age"
                />
                {errors.sellerAge && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.sellerAge}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Aadhar Number *</label>
                <input
                  type="text"
                  value={formData.sellerAadhar}
                  onChange={(e) => handleInputChange('sellerAadhar', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.sellerAadhar ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter 12-digit Aadhar number"
                  maxLength={12}
                />
                {errors.sellerAadhar && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.sellerAadhar}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">PAN Number *</label>
                <input
                  type="text"
                  value={formData.sellerPan}
                  onChange={(e) => handleInputChange('sellerPan', e.target.value.toUpperCase())}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.sellerPan ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter PAN number"
                  maxLength={10}
                />
                {errors.sellerPan && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.sellerPan}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.sellerPhone}
                  onChange={(e) => handleInputChange('sellerPhone', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.sellerPhone ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                />
                {errors.sellerPhone && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.sellerPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.sellerEmail}
                  onChange={(e) => handleInputChange('sellerEmail', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.sellerEmail ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.sellerEmail && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.sellerEmail}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white mb-2">Address *</label>
                <textarea
                  value={formData.sellerAddress}
                  onChange={(e) => handleInputChange('sellerAddress', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 h-24 resize-none ${
                    errors.sellerAddress ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter complete address"
                />
                {errors.sellerAddress && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.sellerAddress}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium mb-4 sm:mb-6`}>Buyer Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm text-white mb-2">Buyer Name *</label>
                <input
                  type="text"
                  value={formData.buyerName}
                  onChange={(e) => handleInputChange('buyerName', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.buyerName ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter buyer full name"
                />
                {errors.buyerName && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.buyerName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Father&apos;s/Husband&apos;s Name *</label>
                <input
                  type="text"
                  value={formData.buyerFatherName}
                  onChange={(e) => handleInputChange('buyerFatherName', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.buyerFatherName ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter father&apos;s/husband&apos;s name"
                />
                {errors.buyerFatherName && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.buyerFatherName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Age *</label>
                <input
                  type="number"
                  value={formData.buyerAge}
                  onChange={(e) => handleInputChange('buyerAge', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.buyerAge ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter age"
                />
                {errors.buyerAge && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.buyerAge}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Aadhar Number *</label>
                <input
                  type="text"
                  value={formData.buyerAadhar}
                  onChange={(e) => handleInputChange('buyerAadhar', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.buyerAadhar ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter 12-digit Aadhar number"
                  maxLength={12}
                />
                {errors.buyerAadhar && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.buyerAadhar}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">PAN Number *</label>
                <input
                  type="text"
                  value={formData.buyerPan}
                  onChange={(e) => handleInputChange('buyerPan', e.target.value.toUpperCase())}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.buyerPan ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter PAN number"
                  maxLength={10}
                />
                {errors.buyerPan && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.buyerPan}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.buyerPhone}
                  onChange={(e) => handleInputChange('buyerPhone', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.buyerPhone ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                />
                {errors.buyerPhone && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.buyerPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.buyerEmail}
                  onChange={(e) => handleInputChange('buyerEmail', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                    errors.buyerEmail ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.buyerEmail && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.buyerEmail}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white mb-2">Address *</label>
                <textarea
                  value={formData.buyerAddress}
                  onChange={(e) => handleInputChange('buyerAddress', e.target.value)}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 h-24 resize-none ${
                    errors.buyerAddress ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter complete address"
                />
                {errors.buyerAddress && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.buyerAddress}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium mb-4 sm:mb-6`}>Upload Documents & Photos</h2>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className={`${lexendDeca.className} text-lg font-medium mb-4`}>Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    { key: 'saleDeed', label: 'Sale Deed *', accept: '.pdf,.jpg,.jpeg,.png' },
                    { key: 'khata', label: 'Khata Certificate *', accept: '.pdf,.jpg,.jpeg,.png' },
                    { key: 'taxReceipt', label: 'Property Tax Receipt *', accept: '.pdf,.jpg,.jpeg,.png' },
                    { key: 'encumbrance', label: 'Encumbrance Certificate *', accept: '.pdf,.jpg,.jpeg,.png' },
                    { key: 'surveySketch', label: 'Survey Sketch *', accept: '.pdf,.jpg,.jpeg,.png' },
                    { key: 'aadhar', label: 'Aadhar Card (Buyer & Seller) *', accept: '.pdf,.jpg,.jpeg,.png' },
                    { key: 'pan', label: 'PAN Card (Buyer & Seller) *', accept: '.pdf,.jpg,.jpeg,.png' },
                  ].map(({ key, label, accept }) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm text-white">{label}</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept={accept}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            handleFileUpload(key as keyof FormData['documents'], file);
                            if (errors[key]) {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors[key];
                                return newErrors;
                              });
                            }
                          }}
                          className="hidden"
                          id={`file-${key}`}
                        />
                        <label
                          htmlFor={`file-${key}`}
                      className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-black/40 border rounded-lg cursor-pointer hover:border-gray-600 transition-colors ${
                        errors[key] ? 'border-red-500' : 'border-gray-700'
                      }`}
                        >
                          <UploadIcon className="text-gray-400" />
                          <span className="text-sm text-gray-300 flex-1">
                            {formData.documents[key as keyof FormData['documents']]
                              ? formData.documents[key as keyof FormData['documents']]?.name
                              : 'Click to upload'}
                          </span>
                        </label>
                        {formData.documents[key as keyof FormData['documents']] && (
                          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                previewDocument(key, formData.documents[key as keyof FormData['documents']]!);
                              }}
                              className="p-1.5 text-gray-400 hover:text-white transition-colors rounded flex items-center justify-center"
                              title="Preview"
                            >
                              <span className="material-symbols-outlined text-[16px]">eye_tracking</span>
                            </button>
                            <button
                              onClick={() => handleFileUpload(key as keyof FormData['documents'], null)}
                              className="p-1.5 text-gray-400 hover:text-white transition-colors rounded flex items-center justify-center"
                              title="Remove"
                            >
                              <CloseIcon className="text-current" />
                            </button>
                          </div>
                        )}
                      </div>
                      {errors[key] && (
                        <p className="text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors[key]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className={`${lexendDeca.className} text-lg font-medium mb-4`}>Property Photos</h3>
                <p className="text-sm text-white/80 mb-4">Upload up to 10 photos of the property (Optional)</p>
                
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                    className="hidden"
                    id="property-photos"
                  />
                  <label
                    htmlFor="property-photos"
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-black/40 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors"
                  >
                    <PropertyPhotosIcon className="text-gray-400" />
                    <span className="text-sm text-gray-300">Click to upload photos</span>
                  </label>
                </div>

                {formData.propertyPhotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.propertyPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Property photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-700"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 border border-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                          title="Remove"
                        >
                          <CloseIcon className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
              <h2 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium`}>Witness Information</h2>
              <button
                onClick={addWitness}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Witness</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {formData.witnesses.map((witness, index) => (
                <div key={index} className="bg-black/40 border border-gray-700 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${lexendDeca.className} text-lg font-medium`}>Witness {index + 1}</h3>
                    {formData.witnesses.length > 1 && (
                      <button
                        onClick={() => removeWitness(index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm text-white mb-2">Name *</label>
                      <input
                        type="text"
                        value={witness.name}
                        onChange={(e) => {
                          handleWitnessChange(index, 'name', e.target.value);
                          if (errors[`witness${index}name`]) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[`witness${index}name`];
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                          errors[`witness${index}name`] ? 'border-red-500' : 'border-gray-700'
                        }`}
                        placeholder="Enter witness name"
                      />
                      {errors[`witness${index}name`] && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors[`witness${index}name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-white mb-2">Aadhar Number *</label>
                      <input
                        type="text"
                        value={witness.aadhar}
                        onChange={(e) => {
                          const numbers = e.target.value.replace(/\D/g, '');
                          const formatted = numbers.slice(0, 12);
                          handleWitnessChange(index, 'aadhar', formatted);
                          if (errors[`witness${index}aadhar`]) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[`witness${index}aadhar`];
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                          errors[`witness${index}aadhar`] ? 'border-red-500' : 'border-gray-700'
                        }`}
                        placeholder="Enter 12-digit Aadhar"
                        maxLength={12}
                      />
                      {errors[`witness${index}aadhar`] && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors[`witness${index}aadhar`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-white mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={witness.phone}
                        onChange={(e) => {
                          const numbers = e.target.value.replace(/\D/g, '');
                          const formatted = numbers.slice(0, 10);
                          handleWitnessChange(index, 'phone', formatted);
                          if (errors[`witness${index}phone`]) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[`witness${index}phone`];
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 ${
                          errors[`witness${index}phone`] ? 'border-red-500' : 'border-gray-700'
                        }`}
                        placeholder="Enter 10-digit phone"
                        maxLength={10}
                      />
                      {errors[`witness${index}phone`] && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors[`witness${index}phone`]}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-white mb-2">Address *</label>
                      <textarea
                        value={witness.address}
                        onChange={(e) => {
                          handleWitnessChange(index, 'address', e.target.value);
                          if (errors[`witness${index}address`]) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[`witness${index}address`];
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 h-24 resize-none ${
                          errors[`witness${index}address`] ? 'border-red-500' : 'border-gray-700'
                        }`}
                        placeholder="Enter complete address"
                      />
                      {errors[`witness${index}address`] && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors[`witness${index}address`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
              <h2 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium`}>Review & Submit</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowDocumentValidation(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                  title="Validate Documents"
                >
                  <ValidateIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Validate</span>
                </button>
                <button
                  onClick={downloadSummary}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                >
                  <DownloadSummaryIcon className="text-current w-4 h-4" />
                  <span className="hidden sm:inline">Download Summary</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-6 bg-black/40 border border-gray-700 rounded-lg p-6">
              <div>
                <h3 className={`${lexendDeca.className} text-lg font-medium mb-4`}>Property Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-white/80">Type:</span> <span className="ml-2 text-white">{formData.propertyType || 'N/A'}</span></div>
                  <div><span className="text-white/80">Survey No:</span> <span className="ml-2 text-white">{formData.surveyNumber || 'N/A'}</span></div>
                  <div><span className="text-white/80">Area:</span> <span className="ml-2 text-white">{formData.area} {formData.areaUnit}</span></div>
                  <div><span className="text-white/80">Location:</span> <span className="ml-2 text-white">{formData.village}, {formData.district}</span></div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className={`${lexendDeca.className} text-lg font-medium mb-4`}>Transaction Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-white/80">Type:</span> <span className="ml-2 text-white">{formData.transactionType || 'N/A'}</span></div>
                  <div><span className="text-white/80">Amount:</span> <span className="ml-2 text-white">₹{formData.considerationAmount || 'N/A'}</span></div>
                  <div><span className="text-white/80">Stamp Duty:</span> <span className="ml-2 text-white">₹{formData.stampDuty || 'N/A'}</span></div>
                  <div><span className="text-white/80">Reg. Fee:</span> <span className="ml-2 text-white">₹{formData.registrationFee || 'N/A'}</span></div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className={`${lexendDeca.className} text-lg font-medium mb-4`}>Seller</h3>
                <div className="text-sm space-y-2">
                  <div><span className="text-white/80">Name:</span> <span className="ml-2 text-white">{formData.sellerName || 'N/A'}</span></div>
                  <div><span className="text-white/80">Aadhar:</span> <span className="ml-2 text-white">{formData.sellerAadhar || 'N/A'}</span></div>
                  <div><span className="text-white/80">PAN:</span> <span className="ml-2 text-white">{formData.sellerPan || 'N/A'}</span></div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className={`${lexendDeca.className} text-lg font-medium mb-4`}>Buyer</h3>
                <div className="text-sm space-y-2">
                  <div><span className="text-white/80">Name:</span> <span className="ml-2 text-white">{formData.buyerName || 'N/A'}</span></div>
                  <div><span className="text-white/80">Aadhar:</span> <span className="ml-2 text-white">{formData.buyerAadhar || 'N/A'}</span></div>
                  <div><span className="text-white/80">PAN:</span> <span className="ml-2 text-white">{formData.buyerPan || 'N/A'}</span></div>
                </div>
              </div>

              {formData.witnesses.length > 0 && (
                <div className="border-t border-gray-700 pt-6">
                  <h3 className={`${lexendDeca.className} text-lg font-medium mb-4`}>Witnesses</h3>
                  <div className="text-sm space-y-4">
                    {formData.witnesses.map((witness, index) => (
                      <div key={index}>
                        <div className="font-medium mb-1">Witness {index + 1}</div>
                        <div className="text-white/80 space-y-1 ml-4">
                          <div>Name: {witness.name || 'N/A'}</div>
                          <div>Phone: {witness.phone || 'N/A'}</div>
                          <div>Aadhar: {witness.aadhar || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-700 pt-6">
                <h3 className={`${lexendDeca.className} text-lg font-medium mb-4`}>Documents & Photos</h3>
                <div className="text-sm space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-white/80 mb-2">
                      <span>Documents Uploaded: <span className="text-white">{Object.values(formData.documents).filter(f => f).length} / 7</span></span>
                      {Object.values(formData.documents).filter(f => f).length > 0 && (
                        <button
                          onClick={() => setShowDocuments(true)}
                          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded flex items-center justify-center"
                          title="View uploaded documents"
                        >
                          <ViewImagesIcon className="text-current" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-white/80 mb-3">
                      <span>Property Photos: <span className="text-white">{formData.propertyPhotos.length} photo(s)</span></span>
                      {formData.propertyPhotos.length > 0 && (
                        <button
                          onClick={() => setShowPropertyPhotos(true)}
                          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded flex items-center justify-center"
                          title="View all images"
                        >
                          <ViewImagesIcon className="text-current" />
                        </button>
                      )}
                    </div>
                    {formData.propertyPhotos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                        {formData.propertyPhotos.slice(0, 8).map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Property photo ${index + 1}`}
                              className="w-full h-24 sm:h-32 md:h-40 object-cover rounded-lg border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors"
                              onClick={() => setShowPropertyPhotos(true)}
                              onError={(e) => {
                                console.error('Failed to load property photo preview:', photo.name);
                                const target = e.currentTarget;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="text-white text-xs">Click to view</span>
                            </div>
                          </div>
                        ))}
                        {formData.propertyPhotos.length > 8 && (
                          <div 
                            className="w-full h-24 sm:h-32 md:h-40 bg-black/40 border border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                            onClick={() => setShowPropertyPhotos(true)}
                          >
                            <span className="text-white text-sm">+{formData.propertyPhotos.length - 8} more</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <p className="text-sm text-yellow-200">
                By submitting this form, you agree that all information provided is accurate and true. 
                False information may lead to legal consequences.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 sm:pt-32 pb-8 px-4 sm:px-6">
      {/* Draft Saved Indicator */}
      <AnimatePresence>
        {draftSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500/20 border border-green-500/50 rounded-lg px-3 sm:px-4 py-2 flex items-center gap-2 max-w-[90%] mx-auto"
          >
            <CheckCircle size={14} className="sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-green-400">Draft saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl mx-auto">
        {/* Progress Indicator & Timer */}
        <div className="mb-4 sm:mb-6 px-4 sm:px-8">
          <div className="bg-black/40 border border-gray-700 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/80">Form Progress</span>
                <span className="text-sm font-medium text-white">{calculateProgress()}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress()}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Clock size={16} />
              <span>Time: {formatTime(formTimeElapsed)}</span>
            </div>
          </div>
        </div>

        {/* Wallet Connection Warning */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 mx-4 sm:mx-8 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
          >
            <AlertCircle size={20} className="text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-200">
                Please connect your wallet using the &quot;Connect&quot; button in the header to start registration.
              </p>
            </div>
          </motion.div>
        )}

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8 px-4 sm:px-8 hidden sm:block">
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1 relative">
                      <span
                        className={`text-xs text-center ${
                          isActive ? 'text-white' : 'text-white/60'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-2">
                      <div className="border-t border-dashed border-gray-700"></div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={`relative bg-black/40 border border-gray-700 rounded-lg p-4 sm:p-8 mb-6 mx-4 sm:mx-8 ${!connected ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {!connected && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 rounded-lg">
              <div className="text-center">
                <AlertCircle size={32} className="text-yellow-400 mx-auto mb-2" />
                <p className="text-white">Connect your wallet to continue</p>
              </div>
            </div>
          )}
          {renderStepContent()}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between px-4 sm:px-8 mb-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || !connected}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              currentStep === 1 || !connected
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20 border border-gray-700'
            }`}
          >
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              disabled={!connected}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                !connected
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Next
              <ChevronRight size={18} className="sm:w-5 sm:h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !connected}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                !connected || isSubmitting
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Submitting...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Submit Registration</span>
                  <span className="sm:hidden">Submit</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {documentPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={() => setDocumentPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-gray-600 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${lexendDeca.className} text-xl font-medium`}>
                  {documentPreview.type.charAt(0).toUpperCase() + documentPreview.type.slice(1)} - Preview
                </h3>
                <button
                  onClick={() => setDocumentPreview(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              
              <div className="mt-4">
                {documentPreview.file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(documentPreview.file)}
                    alt={documentPreview.type}
                    className="max-w-full h-auto rounded-lg border border-gray-700"
                  />
                ) : (
                  <div className="bg-black/40 border border-gray-700 rounded-lg p-8 text-center">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-400 mb-2">{documentPreview.file.name}</p>
                    <p className="text-sm text-gray-500">
                      PDF preview not available. File size: {(documentPreview.file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSubmitSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-gray-600 rounded-lg p-8 max-w-md w-full"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className={`${lexendDeca.className} text-2xl font-medium mb-2`}>
                  Registration Submitted Successfully!
                </h3>
                
                {/* Progress bar showing 100% */}
                <div className="w-full mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">Form Progress</span>
                    <span className="text-sm font-medium text-white">100%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                <p className="text-gray-400 mb-4">
                  Your land registration has been submitted. You will receive a confirmation email shortly.
                </p>
                <div className="mb-6 w-full">
                  <label className="block text-sm text-gray-400 mb-2">Registration ID</label>
                  <div className="flex items-center gap-2 bg-black/40 border border-gray-700 rounded-lg px-4 py-3">
                    <span className="flex-1 text-white font-mono">{registrationId || 'REG-00000000'}</span>
                    <button
                      onClick={() => setShowQRCode(true)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Show QR Code"
                    >
                      <QrCode size={18} className="text-gray-400" />
                    </button>
                    <button
                      onClick={copyRegistrationId}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Copy Registration ID"
                    >
                      {copiedId ? (
                        <Check size={18} className="text-green-400" />
                      ) : (
                        <Copy size={18} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                  {copiedId && (
                    <p className="mt-2 text-sm text-green-400 text-center">Copied to clipboard!</p>
                  )}
                </div>

                {/* Countdown and redirect message */}
                {countdown > 0 && (
                  <p className="text-sm text-white/60 mb-4">
                    Redirecting to home in {countdown} seconds...
                  </p>
                )}
                
                <button
                  onClick={handleSuccessClose}
                  className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors w-full"
                >
                  Back to Home
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSubmitError(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border-2 border-red-700 rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <AlertCircle size={24} className="sm:w-8 sm:h-8 text-red-500" />
                </div>
                <h3 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium mb-2 sm:mb-3 text-red-400`}>
                  Submission Failed
                </h3>
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 px-2 break-words whitespace-pre-wrap">{submitError}</p>
                <button
                  onClick={() => setSubmitError(null)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors w-full sm:w-auto text-sm sm:text-base"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents Modal */}
      <AnimatePresence>
        {showDocuments && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDocuments(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-gray-600 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${lexendDeca.className} text-xl font-medium`}>
                  Uploaded Documents ({Object.values(formData.documents).filter(f => f).length} / 7)
                </h3>
                <button
                  onClick={() => setShowDocuments(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'saleDeed', label: 'Sale Deed' },
                  { key: 'khata', label: 'Khata Certificate' },
                  { key: 'taxReceipt', label: 'Property Tax Receipt' },
                  { key: 'encumbrance', label: 'Encumbrance Certificate' },
                  { key: 'surveySketch', label: 'Survey Sketch' },
                  { key: 'aadhar', label: 'Aadhar Card (Buyer & Seller)' },
                  { key: 'pan', label: 'PAN Card (Buyer & Seller)' },
                ].map(({ key, label }) => {
                  const file = formData.documents[key as keyof FormData['documents']];
                  return (
                    <div key={key} className="bg-black/40 border border-gray-700 rounded-lg p-4 relative">
                      <div className="flex flex-col gap-3">
                        {file ? (
                          <div className="flex-shrink-0 w-full flex justify-center relative z-10">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={label}
                                className="w-32 h-32 object-contain rounded border border-gray-700 relative z-10"
                              />
                            ) : (
                              <div className="w-32 h-32 bg-black/60 border border-gray-700 rounded flex items-center justify-center relative z-10">
                                <FileText size={32} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-full flex justify-center relative z-10">
                            <div className="w-32 h-32 bg-black/60 border border-gray-700 rounded flex items-center justify-center">
                              <FileText size={32} className="text-gray-400 opacity-50" />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 relative z-10">
                          <h4 className={`${lexendDeca.className} text-sm font-medium text-white mb-2`}>
                            {label}
                          </h4>
                          {file ? (
                            <div className="space-y-1">
                              <p className="text-sm text-gray-300 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                              <button
                                onClick={() => previewDocument(key, file)}
                                className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">eye_tracking</span>
                                <span>Preview</span>
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Not uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Property Photos Modal */}
      <AnimatePresence>
        {showPropertyPhotos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4 sm:p-6"
            onClick={() => setShowPropertyPhotos(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-gray-600 rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${lexendDeca.className} text-lg sm:text-xl font-medium`}>
                  Property Photos ({formData.propertyPhotos.length})
                </h3>
                <button
                  onClick={() => setShowPropertyPhotos(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {formData.propertyPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-40 sm:h-48 object-cover rounded-lg border border-gray-700"
                      onError={(e) => {
                        console.error('Failed to load property photo in modal:', photo.name);
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-40 sm:h-48 bg-black/60 border border-gray-700 rounded-lg items-center justify-center">
                      <p className="text-gray-400 text-sm">Failed to load image</p>
                    </div>
                    <div className="mt-2 px-2">
                      <p className="text-xs sm:text-sm text-gray-400 truncate" title={photo.name}>
                        {photo.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(photo.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRCode && registrationId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowQRCode(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-gray-600 rounded-lg p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`${lexendDeca.className} text-xl font-medium`}>
                  Registration ID QR Code
                </h3>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg mb-4">
                  <QRCodeSVG
                    value={registrationId}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-gray-400 mb-2">Scan to view registration details</p>
                <p className="text-white font-mono text-sm">{registrationId}</p>
                <button
                  onClick={() => {
                    copyRegistrationId();
                    setShowQRCode(false);
                  }}
                  className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
                >
                  <Copy size={16} />
                  Copy Registration ID
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Validation Modal */}
      <AnimatePresence>
        {showDocumentValidation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowDocumentValidation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-gray-600 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`${lexendDeca.className} text-xl font-medium`}>
                  Document Validation Report
                </h3>
                <button
                  onClick={() => setShowDocumentValidation(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              
              <div className="space-y-3">
                {validateDocuments().map((doc, index) => {
                  const docLabels: Record<string, string> = {
                    saleDeed: 'Sale Deed',
                    khata: 'Khata Certificate',
                    taxReceipt: 'Property Tax Receipt',
                    encumbrance: 'Encumbrance Certificate',
                    surveySketch: 'Survey Sketch',
                    aadhar: 'Aadhar Card',
                    pan: 'PAN Card',
                  };

                  return (
                    <div
                      key={index}
                      className={`bg-black/40 border rounded-lg p-4 ${
                        doc.status === 'valid'
                          ? 'border-green-500/50 bg-green-500/10'
                          : doc.status === 'warning'
                          ? 'border-yellow-500/50 bg-yellow-500/10'
                          : 'border-red-500/50 bg-red-500/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {doc.status === 'valid' ? (
                          <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                        ) : doc.status === 'warning' ? (
                          <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">
                            {docLabels[doc.name as keyof typeof docLabels] || doc.name}
                          </h4>
                          {doc.status === 'valid' && doc.size > 0 && (
                            <div className="text-sm text-gray-400">
                              <p>Size: {(doc.size / 1024).toFixed(2)} KB</p>
                              <p>Type: {doc.type.split('/')[1]?.toUpperCase() || 'Unknown'}</p>
                            </div>
                          )}
                          {doc.issues.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {doc.issues.map((issue, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                                  <span className="w-1 h-1 bg-current rounded-full" />
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowDocumentValidation(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm w-full"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
