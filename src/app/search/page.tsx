'use client';
import { useRouter } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, Loader2, AlertCircle, X, Copy, Check, Download, QrCode, ChevronDown, MapPin, Users, IndianRupee, Eye, Image as ImageIcon, Search, Shield, Clock, Filter, ChevronLeft, ChevronRight, Home, User, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { searchRegistrations, savePayment, saveSearchHistory, getSearchHistory, type RegistrationData } from '@/lib/supabase/database';
import { getIPFSUrl } from '@/lib/ipfs/pinata';
import AuthGate from '@/components/AuthGate';
import { supabase } from '@/lib/supabase/client';




interface SearchFormData {
  searchType: 'registrationId' | 'surveyNumber';
  registrationId: string;
  surveyNumber: string;
}

interface SearchResult {
  registrationId: string;
  registrationDate: string;
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
  transactionType: string;
  marketValue?: string;
  considerationAmount: string;
  stampDuty: string;
  registrationFee: string;
  saleAgreementDate: string;
  sellerName: string;
  sellerFatherName: string;
  sellerAge?: string;
  sellerAadhar?: string;
  sellerPan?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  sellerAddress?: string;
  buyerName: string;
  buyerFatherName: string;
  buyerAge?: string;
  buyerAadhar?: string;
  buyerPan?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerAddress?: string;
  witnesses?: Array<{
    name: string;
    address: string;
    phone: string;
    aadhar: string;
  }>;
  documents?: Array<{
    type: string;
    name: string;
    ipfsHash?: string; // IPFS hash
    url?: string; // IPFS gateway URL
    data?: string; // base64 data (for backward compatibility)
    mimeType?: string;
  }>;
  propertyPhotos?: Array<{
    name: string;
    ipfsHash?: string; // IPFS hash
    url?: string; // IPFS gateway URL
    data?: string; // base64 data (for backward compatibility)
    mimeType: string;
  }>;
  status: 'active' | 'pending' | 'verified';
}

type StoredPhoto = {
  name: string;
  ipfsHash?: string;
  url?: string;
  data?: string;
  mimeType?: string;
};

type StoredDocument = {
  name?: string;
  ipfsHash?: string;
  url?: string;
  data?: string;
  mimeType?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

type SortOption = 'date' | 'amount' | 'status' | 'name';
type SortOrder = 'asc' | 'desc';

export default function SearchPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchForm, setSearchForm] = useState<SearchFormData>({
    searchType: 'registrationId',
    registrationId: '',
    surveyNumber: '',
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showFilters, setShowFilters] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{ type: string; query: string; timestamp: number }>>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortOption, setSortOption] = useState<SortOption>('date');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isRecentSearchesOpen, setIsRecentSearchesOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingResult, setPendingResult] = useState<SearchResult | null>(null);
  const [paidRegistrations, setPaidRegistrations] = useState<string[]>([]);

  // Get user ID from Supabase auth
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  // Helper function to get all stored registrations from Supabase
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const getAllRegistrations = async (): Promise<any[]> => {
    try {
      const { getAllRegistrations } = await import('@/lib/supabase/database');
      return await getAllRegistrations();
    } catch (error) {
      console.error('Error loading registrations:', error);
      return [];
    }
  };

  // Helper function to convert Supabase registration data to search result
  const convertToSearchResult = (registration: RegistrationData): SearchResult => {
    const documents = (registration.documents as Record<string, StoredDocument>) || {};
    const documentList = Object.keys(documents)
      .filter(key => documents[key])
      .map(key => {
        const doc = documents[key] as StoredDocument;
        // Handle both IPFS hash and legacy base64 data
        const hasIPFS = doc?.ipfsHash;
        const hasBase64 = doc?.data;

        return {
          type: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
          name: doc?.name || `${key}.pdf`,
          ipfsHash: hasIPFS ? doc.ipfsHash : undefined,
          url: hasIPFS ? getIPFSUrl(doc.ipfsHash as string) : undefined,
          data: hasBase64 ? doc.data : undefined, // Keep for backward compatibility
          mimeType: doc?.mimeType || 'application/pdf',
        };
      });

    // Get property photos with IPFS or legacy data
    const photosList = (registration.property_photos || []).map((photo: StoredPhoto) => {
      const hasIPFS = photo?.ipfsHash;
      const hasBase64 = photo?.data;

      return {
        name: photo.name || `photo_${Date.now()}.jpg`,
        ipfsHash: hasIPFS ? photo.ipfsHash : undefined,
        url: hasIPFS ? getIPFSUrl(photo.ipfsHash as string) : undefined,
        data: hasBase64 ? photo.data : undefined, // Keep for backward compatibility
        mimeType: photo.mimeType || 'image/jpeg',
      };
    });

    return {
      registrationId: registration.registration_id,
      registrationDate: registration.registration_date,
      propertyType: '', // Not in DB
      surveyNumber: registration.survey_number || '',
      plotNumber: '', // Not in DB
      village: registration.village || '',
      taluka: registration.taluka || '',
      district: registration.district || '',
      state: registration.state || '',
      pincode: '', // Not in DB
      area: '', // Not in DB
      areaUnit: 'sqft',
      transactionType: registration.transaction_type || '',
      considerationAmount: registration.consideration_amount || '',
      stampDuty: registration.stamp_duty || '',
      registrationFee: registration.registration_fee || '',
      saleAgreementDate: '', // Not in DB
      sellerName: '', // Not in DB
      sellerFatherName: '', // Not in DB
      sellerAge: '',
      sellerAddress: '',
      sellerPhone: registration.seller_phone || '',
      sellerEmail: '',
      sellerAadhar: registration.seller_aadhar || '',
      sellerPan: '',
      buyerName: '', // Not in DB
      buyerFatherName: '', // Not in DB
      buyerAge: '',
      buyerAddress: '',
      buyerPhone: registration.buyer_phone || '',
      buyerEmail: '',
      buyerAadhar: registration.buyer_aadhar || '',
      buyerPan: '',
      witnesses: [], // Not in DB
      documents: documentList,
      propertyPhotos: photosList,
      status: (registration.status as 'active' | 'pending' | 'verified') || 'verified',
    };
  };

  const handleSearch = async () => {
    // Validate that at least one search field is filled based on search type
    let hasSearchCriteria = false;
    let searchQuery = '';

    switch (searchForm.searchType) {
      case 'registrationId':
        hasSearchCriteria = searchForm.registrationId.trim() !== '';
        searchQuery = searchForm.registrationId.trim().toUpperCase();
        break;
      case 'surveyNumber':
        hasSearchCriteria = searchForm.surveyNumber.trim() !== '';
        searchQuery = searchForm.surveyNumber.trim();
        break;
    }

    if (!hasSearchCriteria) {
      setSearchError('Please enter at least one search criteria');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    // Save to search history
    await saveToHistory(searchForm.searchType, searchQuery);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Search registrations from Supabase
      const foundRegistrations = await searchRegistrations(searchForm.searchType, searchQuery);
      const foundResults: SearchResult[] = foundRegistrations.map(reg => convertToSearchResult(reg));

      if (foundResults.length === 0) {
        if (searchForm.searchType === 'registrationId') {
          setSearchError('Invalid Registration ID');
        } else {
          setSearchError('Invalid Survey Number');
        }
      } else {
        setSearchResults(foundResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (field: keyof SearchFormData, value: string) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value,
    }));
    setSearchError(null);
  };

  const copyRegistrationId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle view details with payment check (session-based only)
  const handleViewDetails = (result: SearchResult) => {
    // Check if payment was made in current session only
    if (paidRegistrations.includes(result.registrationId)) {
      // Already paid in this session, show details directly
      setSelectedResult(result);
    } else {
      // Need payment, show payment modal
      setPendingResult(result);
      setShowPaymentModal(true);
    }
  };

  // Process payment
  const processPayment = async () => {
    if (!pendingResult) return;

    // Add to session-based paid registrations array (this always works)
    setPaidRegistrations(prev =>
      prev.includes(pendingResult.registrationId)
        ? prev
        : [...prev, pendingResult.registrationId]
    );

    // Try to save to database (non-blocking)
    if (userId) {
      const transactionId = `TXN-${Date.now().toString().slice(-10)}`;
      try {
        await savePayment({
          registration_id: pendingResult.registrationId,
          user_id: userId,
          amount: 200,
          transaction_id: transactionId,
          payment_status: 'completed',
        });
      } catch {
        // Silently fail - session tracking is sufficient for demo
      }
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Close payment modal
    setShowPaymentModal(false);

    // Show details modal
    setSelectedResult(pendingResult);
    setPendingResult(null);

    // Automatically download removed as per user request
  };


  const resetSearch = () => {
    setSearchForm({
      searchType: 'registrationId',
      registrationId: '',
      surveyNumber: '',
    });
    setSearchResults([]);
    setSearchError(null);
    setSelectedResult(null);
  };

  // Load search history from Supabase
  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) return;

      try {
        const history = await getSearchHistory(userId);
        setSearchHistory(history.map(item => ({
          type: item.search_type,
          query: item.query,
          timestamp: new Date(item.created_at || '').getTime(),
        })));
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    };

    if (userId) {
      loadHistory();
    }
  }, [userId]);

  // Filter and sort results
  useEffect(() => {
    let filtered = [...searchResults];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => result.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a: SearchResult, b: SearchResult) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortOption) {
        case 'date':
          aValue = new Date(a.registrationDate).getTime();
          bValue = new Date(b.registrationDate).getTime();
          break;
        case 'amount':
          aValue = parseFloat(a.considerationAmount);
          bValue = parseFloat(b.considerationAmount);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'name':
          aValue = a.buyerName.toLowerCase();
          bValue = b.buyerName.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredResults(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchResults, sortOption, sortOrder, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'active':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Pagination
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  // Save to search history (non-blocking - don't fail if this doesn't work)
  const saveToHistory = async (searchType: string, query: string) => {
    if (!userId) return;

    try {
      await saveSearchHistory(
        userId,
        searchType as 'registrationId' | 'surveyNumber',
        query
      );

      // Reload history to update UI
      const history = await getSearchHistory(userId);
      setSearchHistory(history.map(item => ({
        type: item.search_type,
        query: item.query,
        timestamp: new Date(item.created_at || '').getTime(),
      })));
    } catch {
      // Silently fail - search history is non-essential
    }
  };

  // Load from history and trigger search
  const loadFromHistory = async (entry: { type: string; query: string }) => {
    setSearchForm(prev => ({
      ...prev,
      ...(() => {
        const key = entry.type as 'registrationId' | 'surveyNumber';
        return { searchType: key, [key]: entry.query } as Pick<SearchFormData, 'searchType'> & Partial<SearchFormData>;
      })(),
    }));
    setIsRecentSearchesOpen(false);

    // Wait for state to update, then trigger search
    setTimeout(async () => {
      // Set the form values first
      const searchType = entry.type as 'registrationId' | 'surveyNumber';
      const newForm = {
        searchType,
        registrationId: searchType === 'registrationId' ? entry.query : '',
        surveyNumber: searchType === 'surveyNumber' ? entry.query : '',
      };
      setSearchForm(newForm);

      const searchQuery = entry.query.trim().toUpperCase();

      setIsSearching(true);
      setSearchError(null);
      setSearchResults([]);

      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        // Search registrations from Supabase
        const foundRegistrations = await searchRegistrations(
          entry.type as 'registrationId' | 'surveyNumber',
          searchQuery
        );
        const foundResults: SearchResult[] = foundRegistrations.map(reg => convertToSearchResult(reg));

        if (foundResults.length === 0) {
          setSearchError('No registration found matching your search criteria.');
        } else {
          setSearchResults(foundResults);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('An error occurred while searching. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 100);
  };



  // Download all data info
  const downloadAllData = async (result: SearchResult) => {
    const content = `
LAND TITLE REGISTRATION - COMPLETE DATA
========================================

REGISTRATION INFORMATION
-------------------------
Registration ID: ${result.registrationId}
Registration Date: ${new Date(result.registrationDate).toLocaleDateString()}
Status: ${result.status.toUpperCase()}
Sale Agreement Date: ${new Date(result.saleAgreementDate).toLocaleDateString()}

PROPERTY DETAILS
----------------
Property Type: ${result.propertyType}
Survey Number: ${result.surveyNumber}
Plot Number: ${result.plotNumber}
Area: ${result.area} ${result.areaUnit}
Address: ${result.village}, ${result.taluka}, ${result.district}, ${result.state}
PIN Code: ${result.pincode}

TRANSACTION DETAILS
-------------------
Transaction Type: ${result.transactionType}
Consideration Amount: ₹${parseFloat(result.considerationAmount).toLocaleString('en-IN')}
Stamp Duty: ₹${parseFloat(result.stampDuty).toLocaleString('en-IN')}
Registration Fee: ₹${parseFloat(result.registrationFee).toLocaleString('en-IN')}

SELLER INFORMATION
------------------
Name: ${result.sellerName}
Father's Name: ${result.sellerFatherName}
${result.sellerAge ? `Age: ${result.sellerAge}` : ''}
${result.sellerAddress ? `Address: ${result.sellerAddress}` : ''}
${result.sellerPhone ? `Phone: ${result.sellerPhone}` : ''}
${result.sellerEmail ? `Email: ${result.sellerEmail}` : ''}
${result.sellerAadhar ? `Aadhar: ${result.sellerAadhar}` : ''}
${result.sellerPan ? `PAN: ${result.sellerPan}` : ''}

BUYER INFORMATION
-----------------
Name: ${result.buyerName}
Father's Name: ${result.buyerFatherName}
${result.buyerAge ? `Age: ${result.buyerAge}` : ''}
${result.buyerAddress ? `Address: ${result.buyerAddress}` : ''}
${result.buyerPhone ? `Phone: ${result.buyerPhone}` : ''}
${result.buyerEmail ? `Email: ${result.buyerEmail}` : ''}
${result.buyerAadhar ? `Aadhar: ${result.buyerAadhar}` : ''}
${result.buyerPan ? `PAN: ${result.buyerPan}` : ''}

${result.witnesses && result.witnesses.length > 0 ? `
WITNESSES
---------
${result.witnesses.map((w, i) => `
Witness ${i + 1}:
  Name: ${w.name}
  Address: ${w.address}
  Phone: ${w.phone}
  Aadhar: ${w.aadhar}
`).join('\n')}
` : ''}

${result.documents && result.documents.length > 0 ? `
DOCUMENTS
---------
${result.documents.map((doc, i) => `
Document ${i + 1}:
  Type: ${doc.type}
  File Name: ${doc.name}
`).join('\n')}
` : ''}

${result.propertyPhotos && result.propertyPhotos.length > 0 ? `
PROPERTY PHOTOS
---------------
Total Photos: ${result.propertyPhotos.length}
${result.propertyPhotos.map((photo, i) => `Photo ${i + 1}: ${photo.name}`).join('\n')}
` : ''}

${result.documents && result.documents.length > 0 ? `
DOCUMENTS
---------
${result.documents.map((doc, i) => `Document ${i + 1}: ${doc.type} - ${doc.name}`).join('\n')}
` : ''}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CompleteData_${result.registrationId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download certificate
  const downloadCertificate = async (result: SearchResult) => {
    const content = `
LAND TITLE REGISTRATION CERTIFICATE
====================================

Registration ID: ${result.registrationId}
Date: ${new Date(result.registrationDate).toLocaleDateString()}
Status: ${result.status.toUpperCase()}

PROPERTY DETAILS
----------------
Type: ${result.propertyType}
Survey Number: ${result.surveyNumber}
Plot Number: ${result.plotNumber}
Area: ${result.area} ${result.areaUnit}
Location: ${result.village}, ${result.taluka}, ${result.district}, ${result.state}
PIN Code: ${result.pincode}

TRANSACTION DETAILS
-------------------
Type: ${result.transactionType}
Date: ${new Date(result.saleAgreementDate).toLocaleDateString()}
Consideration Amount: ₹${parseFloat(result.considerationAmount).toLocaleString('en-IN')}
Stamp Duty: ₹${parseFloat(result.stampDuty).toLocaleString('en-IN')}
Registration Fee: ₹${parseFloat(result.registrationFee).toLocaleString('en-IN')}

SELLER INFORMATION
------------------
Name: ${result.sellerName}
Father's Name: ${result.sellerFatherName}
${result.sellerAge ? `Age: ${result.sellerAge}` : ''}
${result.sellerAddress ? `Address: ${result.sellerAddress}` : ''}

BUYER INFORMATION
-----------------
Name: ${result.buyerName}
Father's Name: ${result.buyerFatherName}
${result.buyerAge ? `Age: ${result.buyerAge}` : ''}
${result.buyerAddress ? `Address: ${result.buyerAddress}` : ''}

${result.witnesses && result.witnesses.length > 0 ? `
WITNESSES
---------
${result.witnesses.map((w, i) => `
Witness ${i + 1}:
  Name: ${w.name}
  Address: ${w.address}
  Phone: ${w.phone}
  Aadhar: ${w.aadhar}
`).join('\n')}
` : ''}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LandTitle_${result.registrationId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-white text-black pt-28 sm:pt-36 lg:pt-40 px-4 sm:px-6 pb-20">
        <div className="max-w-2xl w-full mx-auto space-y-4 sm:space-y-6">
          {/* Navigation Header */}
          <div className="flex justify-between items-center px-1">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft size={24} />
              <span className="hidden sm:inline font-medium text-lg">Back</span>
            </button>

            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl font-sans font-normal text-black">Search Land Titles</h1>
            </div>
            <div className="border-t border-dashed border-gray-300 mb-4 sm:mb-6"></div>

            {/* Search Type Toggle */}
            <div className="mb-4">
              <label className="block text-sm text-gray-500 mb-1.5">Search By</label>
              <div className="flex gap-2">
                {[
                  { value: 'registrationId', label: 'Registration ID' },
                  { value: 'surveyNumber', label: 'Survey No.' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleInputChange('searchType', type.value)}
                    className={`px-3 sm:px-4 py-2 rounded-lg border transition-all text-sm ${searchForm.searchType === type.value
                      ? 'bg-black text-white border-black'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-black hover:text-black'
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <AnimatePresence mode="wait">
                {searchForm.searchType === 'registrationId' && (
                  <motion.div
                    key="registrationId"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm text-gray-500 mb-1.5">Registration ID <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={searchForm.registrationId}
                      onChange={(e) => handleInputChange('registrationId', e.target.value)}
                      placeholder="Enter Registration ID (e.g., DB-12345678)"
                      className="w-full max-w-sm bg-white border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-gray-100 transition-all text-sm"
                    />
                  </motion.div>
                )}

                {searchForm.searchType === 'surveyNumber' && (
                  <motion.div
                    key="surveyNumber"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm text-gray-500 mb-1.5">Survey Number <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={searchForm.surveyNumber}
                      onChange={(e) => handleInputChange('surveyNumber', e.target.value)}
                      placeholder="Enter Survey Number"
                      className="w-full max-w-sm bg-white border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-gray-100 transition-all text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error Message */}
            {searchError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
              >
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">{searchError}</p>
              </motion.div>
            )}

            <div className="border-t border-dashed border-gray-300 mb-4"></div>

            {/* Action Buttons */}
            <div className="flex flex-row items-center gap-3">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
              {(searchResults.length > 0 || searchForm.registrationId || searchForm.surveyNumber) && (
                <button
                  onClick={resetSearch}
                  className="px-4 py-3 bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black rounded-lg text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </motion.div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="relative z-20">
                <button
                  onClick={() => setIsRecentSearchesOpen(!isRecentSearchesOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-black hover:text-black transition-colors"
                >
                  <Calendar size={14} />
                  <span>Recent Searches</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isRecentSearchesOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isRecentSearchesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg z-20 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="text-sm font-medium text-black">Recent Searches</span>
                        <button
                          onClick={() => setIsRecentSearchesOpen(false)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X size={14} className="text-gray-400" />
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {searchHistory.map((entry, index) => (
                          <button
                            key={index}
                            onClick={() => loadFromHistory(entry)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <div className="text-xs text-gray-400 mb-0.5">
                              {entry.type === 'registrationId' ? 'Registration ID' : 'Survey No.'}
                            </div>
                            <div className="text-sm text-black font-mono">{entry.query}</div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {isRecentSearchesOpen && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsRecentSearchesOpen(false)}
                />
              )}
            </motion.div>
          )}

          {/* Search Results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-sans font-normal text-black">
                    Search Results ({filteredResults.length})
                  </h2>
                </div>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <div className="space-y-3">
                  {paginatedResults.map((result, index) => (
                    <motion.div
                      key={result.registrationId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleViewDetails(result)}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-black transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Header Row */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="font-mono text-black text-sm">{result.registrationId}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyRegistrationId(result.registrationId);
                              }}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              {copiedId ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <Copy size={14} className="text-gray-400" />
                              )}
                            </button>
                            <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(result.status)}`}>
                              {result.status.toUpperCase()}
                            </span>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <MapPin size={14} className="shrink-0" />
                              <span className="truncate">{result.village}, {result.district}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Calendar size={14} className="shrink-0" />
                              <span>{new Date(result.registrationDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(result);
                          }}
                          className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors shrink-0 self-start"
                        >
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Results */}
          {!isSearching && searchResults.length === 0 && searchError && searchError.includes('No registration found') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400">No results found. Please try different search criteria.</p>
            </motion.div>
          )}
        </div>

        {/* Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && pendingResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowPaymentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 max-w-sm w-full"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-sans font-normal text-black">Payment Required</h2>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                {/* Payment Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Registration ID</span>
                      <span className="text-black font-mono">{pendingResult.registrationId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Access Fee</span>
                      <span className="text-black font-medium">₹200</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-amber-700 text-xs sm:text-sm flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>Payment is required to view full details and download documents.</span>
                  </p>
                </div>

                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processPayment}
                    disabled={!userId}
                    className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pay ₹200
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setSelectedResult(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">Registration Details</h2>
                    <p className="text-sm text-gray-500 mt-1">View complete details of this registration</p>
                  </div>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Registration Status Section */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Registration ID</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-mono font-medium text-black">{selectedResult.registrationId}</span>
                        <button
                          onClick={() => copyRegistrationId(selectedResult.registrationId)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {copiedId ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Status</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${selectedResult.status === 'verified'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : selectedResult.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        {selectedResult.status}
                      </span>
                    </div>
                  </div>

                  {/* DeedBlock Details */}
                  <div>
                    <h3 className="text-lg font-sans font-normal text-black mb-3">DeedBlock Details</h3>
                    <div className="border-t border-dashed border-gray-300 mb-4"></div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-6 text-sm">
                      {/* Row 1 */}
                      <div>
                        <span className="text-gray-500">Survey / Door No</span>
                        <p className="font-medium text-black mt-0.5 break-all">
                          {selectedResult.surveyNumber || selectedResult.plotNumber || '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Transaction Type</span>
                        <p className="font-medium text-black mt-0.5 capitalize">{selectedResult.transactionType || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Village</span>
                        <p className="font-medium text-black mt-0.5">{selectedResult.village || '-'}</p>
                      </div>

                      {/* Row 2 */}
                      <div>
                        <span className="text-gray-500">Mandal</span>
                        <p className="font-medium text-black mt-0.5">{selectedResult.taluka || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">District</span>
                        <p className="font-medium text-black mt-0.5">{selectedResult.district || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">State</span>
                        <p className="font-medium text-black mt-0.5">{selectedResult.state || '-'}</p>
                      </div>

                      {/* Financials (From Step 1/3) */}
                      <div>
                        <span className="text-gray-500">Market Value</span>
                        <p className="font-medium text-black mt-0.5">
                          ₹{selectedResult.considerationAmount ? parseFloat(selectedResult.considerationAmount).toLocaleString('en-IN') : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Registration Fee</span>
                        <p className="font-medium text-black mt-0.5">
                          ₹{selectedResult.registrationFee ? parseFloat(selectedResult.registrationFee).toLocaleString('en-IN') : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Stamp Duty</span>
                        <p className="font-medium text-black mt-0.5">
                          ₹{selectedResult.stampDuty ? parseFloat(selectedResult.stampDuty).toLocaleString('en-IN') : '-'}
                        </p>
                      </div>

                      {/* Seller & Buyer Details - Unified Row */}
                      <div className="col-span-2 md:col-span-3 pt-2">
                        {/* Mobile View: Stacked */}
                        <div className="sm:hidden space-y-6">
                          {/* Seller Mobile */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Seller</span>
                              <span className="text-gray-500">Aadhar ID</span>
                              <p className="font-medium text-black mt-0.5">{selectedResult.sellerAadhar || '-'}</p>
                            </div>
                            <div className="pt-5">
                              <span className="text-gray-500">Phone</span>
                              <p className="font-medium text-black mt-0.5">{selectedResult.sellerPhone || '-'}</p>
                            </div>
                          </div>

                          <div className="border-t border-dashed border-gray-200"></div>

                          {/* Buyer Mobile */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Buyer</span>
                              <span className="text-gray-500">Aadhar ID</span>
                              <p className="font-medium text-black mt-0.5">{selectedResult.buyerAadhar || '-'}</p>
                            </div>
                            <div className="pt-5">
                              <span className="text-gray-500">Phone</span>
                              <p className="font-medium text-black mt-0.5">{selectedResult.buyerPhone || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Desktop View: All in one row */}
                        <div className="hidden sm:flex items-center gap-12 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                          {/* Seller Group */}
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Seller</span>
                              <span className="text-gray-500">Aadhar ID</span>
                              <p className="font-medium text-black mt-0.5">{selectedResult.sellerAadhar || '-'}</p>
                            </div>
                            <div className="h-8 w-px border-l border-dashed border-gray-300 mt-5"></div>
                            <div className="pt-5">
                              <span className="text-gray-500">Phone</span>
                              <p className="font-medium text-black mt-0.5">{selectedResult.sellerPhone || '-'}</p>
                            </div>
                          </div>

                          {/* Buyer Group */}
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Buyer</span>
                              <span className="text-gray-500">Aadhar ID</span>
                              <p className="font-medium text-black mt-0.5">{selectedResult.buyerAadhar || '-'}</p>
                            </div>
                            <div className="h-8 w-px border-l border-dashed border-gray-300 mt-5"></div>
                            <div className="pt-5">
                              <span className="text-gray-500">Phone</span>
                              <p className="font-medium text-black mt-0.5">{selectedResult.buyerPhone || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents Summary */}
                  <div>
                    <h3 className="text-lg font-sans font-normal text-black mb-3">Uploaded Documents & Photos</h3>
                    <div className="border-t border-dashed border-gray-300 mb-4"></div>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
                      {selectedResult.documents && selectedResult.documents.map((doc, index) => (
                        <button
                          key={index}
                          onClick={() => window.open(doc.url || `https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`, '_blank')}
                          className="flex items-center justify-start pl-4 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-black transition-colors gap-2"
                        >
                          <FileText size={16} className="text-gray-400 shrink-0" />
                          <span className="truncate max-w-[100px] sm:max-w-[150px] capitalize">{doc.name || doc.type}</span>
                        </button>
                      ))}

                      {selectedResult.propertyPhotos && selectedResult.propertyPhotos.map((photo, index) => (
                        <button
                          key={`photo-${index}`}
                          onClick={() => window.open(photo.url || `https://gateway.pinata.cloud/ipfs/${photo.ipfsHash}`, '_blank')}
                          className="flex items-center justify-start pl-4 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-black transition-colors gap-2"
                        >
                          <ImageIcon size={16} className="text-gray-400 shrink-0" />
                          <span className="truncate max-w-[100px] sm:max-w-[150px]">Photo {index + 1}</span>
                        </button>
                      ))}

                      {(!selectedResult.documents?.length && !selectedResult.propertyPhotos?.length) && (
                        <p className="text-gray-500 text-sm italic">No documents available.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 bg-gray-50 rounded-b-xl z-10">
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 shadow-sm text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => downloadAllData(selectedResult)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download Certificate
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Code Modal */}
        <AnimatePresence>
          {showQRCode && selectedResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setShowQRCode(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border border-gray-200 shadow-xl rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full"
              >
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-4">Registration QR</h3>
                  <div className="bg-white p-4 inline-block rounded-lg shadow-inner border border-gray-200">
                    <QRCodeSVG
                      value={`https://deedblock.com/verify/${selectedResult.registrationId}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="mt-4 text-gray-600 font-mono text-lg">{selectedResult.registrationId}</p>
                  <p className="mt-2 text-sm text-gray-500">Scan to verify registration details</p>

                  <button
                    onClick={() => setShowQRCode(false)}
                    className="mt-6 w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGate >
  );
}

