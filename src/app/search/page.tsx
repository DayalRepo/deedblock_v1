'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { FileText, Calendar, Loader2, AlertCircle, X, Copy, Check, Download, QrCode, ChevronDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Lexend_Deca, DM_Sans } from 'next/font/google';
import { searchRegistrations, savePayment, saveSearchHistory, getSearchHistory, type RegistrationData } from '@/lib/supabase/database';
import { getIPFSUrl } from '@/lib/ipfs/pinata';

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
  const { connected, publicKey } = useWallet();
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
  const [sortOption] = useState<SortOption>('date');
  const [sortOrder] = useState<SortOrder>('desc');
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
    const documents = registration.documents || {};
    const documentList = Object.keys(documents)
      .filter(key => documents[key])
      .map(key => {
        const doc = documents[key];
        // Handle both IPFS hash and legacy base64 data
        const hasIPFS = doc?.ipfsHash;
        const hasBase64 = doc?.data;
        
        return {
          type: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
          name: doc?.name || `${key}.pdf`,
          ipfsHash: hasIPFS ? doc.ipfsHash : undefined,
          url: hasIPFS ? getIPFSUrl(doc.ipfsHash) : undefined,
          data: hasBase64 ? doc.data : undefined, // Keep for backward compatibility
          mimeType: doc?.mimeType || 'application/pdf',
        };
      });

    // Get property photos with IPFS or legacy data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photosList = (registration.property_photos || []).map((photo: any) => {
      const hasIPFS = photo?.ipfsHash;
      const hasBase64 = photo?.data;
      
      return {
        name: photo.name || `photo_${Date.now()}.jpg`,
        ipfsHash: hasIPFS ? photo.ipfsHash : undefined,
        url: hasIPFS ? getIPFSUrl(photo.ipfsHash) : undefined,
        data: hasBase64 ? photo.data : undefined, // Keep for backward compatibility
        mimeType: photo.mimeType || 'image/jpeg',
      };
    });

    return {
      registrationId: registration.registration_id,
      registrationDate: registration.registration_date,
      propertyType: registration.property_type || '',
      surveyNumber: registration.survey_number || '',
      plotNumber: registration.plot_number || '',
      village: registration.village || '',
      taluka: registration.taluka || '',
      district: registration.district || '',
      state: registration.state || '',
      pincode: registration.pincode || '',
      area: registration.area || '',
      areaUnit: registration.area_unit || 'sqft',
      transactionType: registration.transaction_type || '',
      considerationAmount: registration.consideration_amount || '',
      stampDuty: registration.stamp_duty || '',
      registrationFee: registration.registration_fee || '',
      saleAgreementDate: registration.sale_agreement_date || '',
      sellerName: registration.seller_name || '',
      sellerFatherName: registration.seller_father_name || '',
      sellerAge: registration.seller_age || '',
      sellerAddress: registration.seller_address || '',
      sellerPhone: registration.seller_phone || '',
      sellerEmail: registration.seller_email || '',
      sellerAadhar: registration.seller_aadhar || '',
      sellerPan: registration.seller_pan || '',
      buyerName: registration.buyer_name || '',
      buyerFatherName: registration.buyer_father_name || '',
      buyerAge: registration.buyer_age || '',
      buyerAddress: registration.buyer_address || '',
      buyerPhone: registration.buyer_phone || '',
      buyerEmail: registration.buyer_email || '',
      buyerAadhar: registration.buyer_aadhar || '',
      buyerPan: registration.buyer_pan || '',
      witnesses: registration.witnesses || [],
      documents: documentList,
      propertyPhotos: photosList,
      status: (registration.status as 'active' | 'pending' | 'verified') || 'verified',
    };
  };

  const handleSearch = async () => {
    if (!connected) {
      setSearchError('Please connect your wallet to search for land titles.');
      return;
    }

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
    if (!pendingResult || !connected || !publicKey) return;

    // Generate transaction ID
    const transactionId = `TXN-${Date.now().toString().slice(-10)}`;
    
    try {
      // Save payment to Supabase
      await savePayment({
        registration_id: pendingResult.registrationId,
        wallet_address: publicKey.toString(),
        amount: 200,
        transaction_id: transactionId,
        payment_status: 'completed',
      });
      
      // Add to session-based paid registrations array
      setPaidRegistrations(prev => 
        prev.includes(pendingResult.registrationId) 
          ? prev 
          : [...prev, pendingResult.registrationId]
      );
    } catch (error) {
      console.error('Error storing payment:', error);
      setSearchError('Failed to process payment. Please try again.');
      return;
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Close payment modal
    setShowPaymentModal(false);

    // Show details modal
    setSelectedResult(pendingResult);
    setPendingResult(null);

    // Automatically download all data after payment
    setTimeout(() => {
      downloadAllData(pendingResult);
      // Download all documents
      if (pendingResult.documents && pendingResult.documents.length > 0) {
        pendingResult.documents.forEach((doc, index) => {
          setTimeout(() => downloadDocument(doc), index * 300);
        });
      }
      // Download all photos
      if (pendingResult.propertyPhotos && pendingResult.propertyPhotos.length > 0) {
        downloadAllPhotos(pendingResult.propertyPhotos, pendingResult.registrationId);
      }
    }, 500);
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
      if (!connected || !publicKey?.toString()) return;

      try {
        const history = await getSearchHistory(publicKey.toString());
        setSearchHistory(history.map(item => ({
          type: item.search_type,
          query: item.query,
          timestamp: new Date(item.created_at || '').getTime(),
        })));
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    };

    if (connected && publicKey) {
      loadHistory();
    }
  }, [connected, publicKey]);

  // Filter and sort results
  useEffect(() => {
    let filtered = [...searchResults];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => result.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let aValue: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bValue: any;

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

  // Save to search history
  const saveToHistory = async (searchType: string, query: string) => {
    if (!connected || !publicKey?.toString()) return;

    try {
      await saveSearchHistory(
        publicKey.toString(),
        searchType as 'registrationId' | 'surveyNumber',
        query
      );
      
      // Reload history to update UI
      const history = await getSearchHistory(publicKey.toString());
      setSearchHistory(history.map(item => ({
        type: item.search_type,
        query: item.query,
        timestamp: new Date(item.created_at || '').getTime(),
      })));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  // Load from history and trigger search
  const loadFromHistory = async (entry: { type: string; query: string }) => {
    setSearchForm(prev => ({
      ...prev,
      searchType: entry.type as any,
      [entry.type]: entry.query,
    }));
    setIsRecentSearchesOpen(false);
    
    // Wait for state to update, then trigger search
    setTimeout(async () => {
      // Set the form values first
      const newForm = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        searchType: entry.type as any,
        registrationId: entry.type === 'registrationId' ? entry.query : '',
        surveyNumber: entry.type === 'surveyNumber' ? entry.query : '',
      };
      setSearchForm(newForm);
      
      // Trigger the search
      if (!connected) {
        setSearchError('Please connect your wallet to search for land titles.');
        return;
      }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const foundResults: SearchResult[] = foundRegistrations.map((reg: any) => convertToSearchResult(reg));

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

  // Download document
  const downloadDocument = async (doc: { type: string; name: string; ipfsHash?: string; url?: string; data?: string; mimeType?: string }) => {
    // Prefer IPFS URL over base64
    if (doc.url) {
      // Download from IPFS
      try {
        const response = await fetch(doc.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      } catch (error) {
        console.error('Error downloading from IPFS:', error);
      }
    }
    
    // Fallback to base64 if IPFS fails or not available
    if (doc.data) {
      // Convert base64 to blob
      const base64Data = doc.data.includes(',') ? doc.data.split(',')[1] : doc.data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.mimeType || 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Fallback to placeholder if no data
      const blob = new Blob([`Document: ${doc.type}\nFile: ${doc.name}\n\nFile data not available.`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Download photo
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const downloadPhoto = async (photo: { name: string; ipfsHash?: string; url?: string; data?: string; mimeType: string }, registrationId: string) => {
    // Prefer IPFS URL over base64
    if (photo.url) {
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = photo.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      } catch (error) {
        console.error('Error downloading from IPFS:', error);
      }
    }
    
    // Fallback to base64 if IPFS fails or not available
    if (photo.data) {
      // Convert base64 to blob
      const base64Data = photo.data.includes(',') ? photo.data.split(',')[1] : photo.data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: photo.mimeType || 'image/jpeg' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Download all photos
  const downloadAllPhotos = async (photos: Array<{ name: string; ipfsHash?: string; url?: string; data?: string; mimeType: string }>, registrationId: string) => {
    for (let i = 0; i < photos.length; i++) {
      setTimeout(() => downloadPhoto(photos[i], registrationId), i * 300);
    }
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
Father&apos;s Name: ${result.buyerFatherName}
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
Father&apos;s Name: ${result.buyerFatherName}
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
    <div className={`${lexendDeca.className} min-h-screen bg-black text-white pt-20 sm:pt-24 lg:pt-32 px-3 sm:px-6 pb-20 flex items-center justify-center`}>
      <div className="max-w-4xl w-full mx-auto">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-black/40 border border-gray-800 rounded-lg p-4 sm:p-6 mb-6 mx-auto"
        >
          {/* Header - Top Left */}
          <div className="mb-5">
            <h1 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium mb-1.5`}>
              Search Land Titles
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              Search for registered land titles using registration id and survey no.
            </p>
          </div>

          {/* Search Type Selector */}
          <div className="mb-4">
            <label className={`${lexendDeca.className} block text-xs sm:text-sm text-gray-400 mb-2`}>
              Search By
            </label>
            <div className="flex gap-2 w-fit">
              {[
                { value: 'registrationId', label: 'Registration ID' },
                { value: 'surveyNumber', label: 'Survey No.' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleInputChange('searchType', type.value)}
                  className={`px-3 py-2 rounded-lg border transition-colors text-xs sm:text-sm whitespace-nowrap ${
                    searchForm.searchType === type.value
                      ? 'bg-white text-black border-white'
                      : 'bg-black/40 border-gray-800 text-white hover:border-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input Fields */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {searchForm.searchType === 'registrationId' && (
                <motion.div
                  key="registrationId"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className={`${lexendDeca.className} block text-xs sm:text-sm text-gray-400 mb-2`}>
                    Registration ID
                  </label>
                  <input
                    type="text"
                    value={searchForm.registrationId}
                    onChange={(e) => handleInputChange('registrationId', e.target.value)}
                    placeholder="Enter Registration ID (e.g., REG-12345678)"
                    className="max-w-lg w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors text-sm"
                  />
                </motion.div>
              )}

              {searchForm.searchType === 'surveyNumber' && (
                <motion.div
                  key="surveyNumber"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className={`${lexendDeca.className} block text-xs sm:text-sm text-gray-400 mb-2`}>
                    Survey Number
                  </label>
                  <input
                    type="text"
                    value={searchForm.surveyNumber}
                    onChange={(e) => handleInputChange('surveyNumber', e.target.value)}
                    placeholder="Enter Survey Number"
                    className="max-w-lg w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors text-sm"
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
              className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2"
            >
              <AlertCircle size={20} className="text-red-400 sm:w-6 sm:h-6" />
              <p className="text-red-400 text-xs sm:text-sm">{searchError}</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-5 items-stretch sm:items-center">
            <button
              onClick={handleSearch}
              disabled={isSearching || !connected}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-white text-black rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-3 py-2 bg-black/40 border border-gray-800 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-black/60 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Wallet Connection Warning */}
          {!connected && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center gap-2"
            >
              <AlertCircle size={20} className="text-yellow-400 sm:w-6 sm:h-6" />
              <p className="text-yellow-400 text-xs sm:text-sm">Please connect your wallet to search for land titles.</p>
            </motion.div>
          )}
        </motion.div>

        {/* Search History - Dropdown */}
        {searchHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 flex justify-start relative"
          >
            <div className="relative z-20">
              <button
                onClick={() => setIsRecentSearchesOpen(!isRecentSearchesOpen)}
                className={`${lexendDeca.className} max-w-xs w-auto bg-black/40 border border-gray-800 rounded-lg px-4 py-2.5 text-white text-sm hover:bg-black/60 transition-colors flex items-center gap-2 justify-between`}
              >
                <span className="text-gray-400">Recent Searches</span>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-400 transition-transform duration-200 ${isRecentSearchesOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {isRecentSearchesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 max-w-xs w-full bg-black rounded-lg shadow-lg py-1 z-20 border border-gray-600"
                  >
                    <div className="dropdown-header">
                      <h3 className={`${lexendDeca.className} font-medium text-white tracking-tight text-sm`}>Recent Searches</h3>
                      <button
                        onClick={() => setIsRecentSearchesOpen(false)}
                        className="p-1 rounded-lg hover:bg-gray-900 transition-colors"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {searchHistory.map((entry, index) => (
                        <div key={index}>
                          <button
                            onClick={() => loadFromHistory(entry)}
                            className="dropdown-item w-full text-left"
                          >
                            <div className="dropdown-title">
                              {entry.type === 'registrationId' ? 'Registration ID' : 'Survey No.'}
                            </div>
                            <div className="dropdown-description">{entry.query}</div>
                          </button>
                          {index < searchHistory.length - 1 && (
                            <div className="dropdown-divider" />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Click outside to close */}
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
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium`}>
                  Search Results ({filteredResults.length})
                </h2>
              </div>

              <div className="space-y-4">
                {paginatedResults.map((result, index) => (
                  <motion.div
                    key={result.registrationId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleViewDetails(result)}
                    className="bg-black/40 border border-gray-800 rounded-lg p-4 sm:p-6 cursor-pointer hover:border-gray-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-gray-400 sm:w-5 sm:h-5" />
                            <span className="font-mono text-white text-sm sm:text-base">{result.registrationId}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyRegistrationId(result.registrationId);
                              }}
                              className="p-1 hover:bg-gray-800 rounded transition-colors"
                            >
                              {copiedId ? (
                                <Check size={16} className="text-green-400 sm:w-5 sm:h-5" />
                              ) : (
                                <Copy size={16} className="text-gray-400 sm:w-5 sm:h-5" />
                              )}
                            </button>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(result.status)}`}>
                            {result.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#9ca3af" className="sm:w-5 sm:h-5">
                              <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/>
                            </svg>
                            <span className="break-words">{result.village}, {result.taluka}, {result.district}, {result.state}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#e3e3e3" className="sm:w-5 sm:h-5">
                              <path d="M200-200v-560 179-19 400Zm80-240h221q2-22 10-42t20-38H280v80Zm0 160h157q17-20 39-32.5t46-20.5q-4-6-7-13t-5-14H280v80Zm0-320h400v-80H280v80Zm-80 480q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v258q-14-26-34-46t-46-33v-179H200v560h202q-1 6-1.5 12t-.5 12v56H200Zm480-200q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM480-120v-56q0-24 12.5-44.5T528-250q36-15 74.5-22.5T680-280q39 0 77.5 7.5T832-250q23 9 35.5 29.5T880-176v56H480Z"/>
                            </svg>
                            <span className="break-words">Buyer: {result.buyerName} | Seller: {result.sellerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar size={16} className="sm:w-5 sm:h-5" />
                            <span>Registered: {new Date(result.registrationDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#9ca3af" className="sm:w-5 sm:h-5">
                              <path d="M549-120 280-400v-80h140q53 0 91.5-34.5T558-600H240v-80h306q-17-35-50.5-57.5T420-760H240v-80h480v80H590q14 17 25 37t17 43h88v80h-81q-8 85-70 142.5T420-400h-29l269 280H549Z"/>
                            </svg>
                            <span>Amount: ₹{parseFloat(result.considerationAmount).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(result);
                        }}
                        className="px-3 sm:px-4 py-2 bg-white/10 border border-gray-700 text-white rounded-lg hover:bg-white/20 transition-colors text-xs sm:text-sm flex items-center gap-2 w-full sm:w-auto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="#e3e3e3" className="sm:w-4 sm:h-4">
                          <path d="M240-40H120q-33 0-56.5-23.5T40-120v-120h80v120h120v80Zm480 0v-80h120v-120h80v120q0 33-23.5 56.5T840-40H720ZM480-220q-120 0-217.5-71T120-480q45-118 142.5-189T480-740q120 0 217.5 71T840-480q-45 118-142.5 189T480-220Zm0-80q88 0 161-48t112-132q-39-84-112-132t-161-48q-88 0-161 48T207-480q39 84 112 132t161 48Zm0-40q58 0 99-41t41-99q0-58-41-99t-99-41q-58 0-99 41t-41 99q0 58 41 99t99 41Zm0-80q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420ZM40-720v-120q0-33 23.5-56.5T120-920h120v80H120v120H40Zm800 0v-120H720v-80h120q33 0 56.5 23.5T920-840v120h-80ZM480-480Z"/>
                        </svg>
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
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-gray-600 rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium`}>
                  Payment Required
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-black/40 border border-gray-800 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Registration ID:</span>
                      <span className="text-white font-mono text-xs sm:text-sm">{pendingResult.registrationId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Access Fee:</span>
                      <span className="text-white font-medium">₹200</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 sm:p-4">
                  <p className="text-yellow-400 text-xs sm:text-sm">
                    <AlertCircle size={16} className="inline mr-2 sm:w-4 sm:h-4" />
                    Payment of ₹200 is required to view full registration details and download all associated documents and data.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-3 sm:px-4 py-2 bg-black/40 border border-gray-800 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-black/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processPayment}
                    disabled={!connected}
                    className="flex-1 px-3 sm:px-4 py-2 bg-white text-black rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {connected ? (
                      <>
                        Pay ₹200
                      </>
                    ) : (
                      <>
                        Connect Wallet to Pay
                      </>
                    )}
                  </button>
                </div>
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
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedResult(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-gray-600 rounded-lg p-4 sm:p-6 lg:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`${lexendDeca.className} text-xl sm:text-2xl font-medium`}>
                  Registration Details
                </h2>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Registration Info */}
                <div className="bg-black/40 border border-gray-800 rounded-lg p-3 sm:p-4">
                  <h3 className={`${lexendDeca.className} text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2`}>
                    <FileText size={20} className="sm:w-6 sm:h-6" />
                    Registration Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Registration ID:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white font-mono">{selectedResult.registrationId}</span>
                        <button
                          onClick={() => copyRegistrationId(selectedResult.registrationId)}
                          className="p-1 hover:bg-gray-800 rounded transition-colors"
                          title="Copy Registration ID"
                        >
                          {copiedId ? (
                            <Check size={16} className="text-green-400" />
                          ) : (
                            <Copy size={16} className="text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setShowQRCode(true)}
                          className="p-1 hover:bg-gray-800 rounded transition-colors"
                          title="Show QR Code"
                        >
                          <QrCode size={18} className="text-gray-400 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs border ${getStatusColor(selectedResult.status)}`}>
                        {selectedResult.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Registration Date:</span>
                      <p className="text-white">{new Date(selectedResult.registrationDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Sale Agreement Date:</span>
                      <p className="text-white">{new Date(selectedResult.saleAgreementDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="bg-black/40 border border-gray-800 rounded-lg p-3 sm:p-4">
                  <h3 className={`${lexendDeca.className} text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2`}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="#e3e3e3" className="sm:w-6 sm:h-6">
                      <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/>
                    </svg>
                    Property Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Property Type:</span>
                      <p className="text-white">{selectedResult.propertyType}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Survey Number:</span>
                      <p className="text-white">{selectedResult.surveyNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Plot Number:</span>
                      <p className="text-white">{selectedResult.plotNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Area:</span>
                      <p className="text-white">{selectedResult.area} {selectedResult.areaUnit}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-400">Address:</span>
                      <p className="text-white">{selectedResult.village}, {selectedResult.taluka}, {selectedResult.district}, {selectedResult.state} - {selectedResult.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="bg-black/40 border border-gray-800 rounded-lg p-3 sm:p-4">
                  <h3 className={`${lexendDeca.className} text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2`}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="#e3e3e3" className="sm:w-6 sm:h-6">
                      <path d="M549-120 280-400v-80h140q53 0 91.5-34.5T558-600H240v-80h306q-17-35-50.5-57.5T420-760H240v-80h480v80H590q14 17 25 37t17 43h88v80h-81q-8 85-70 142.5T420-400h-29l269 280H549Z"/>
                    </svg>
                    Transaction Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Transaction Type:</span>
                      <p className="text-white">{selectedResult.transactionType}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Consideration Amount:</span>
                      <p className="text-white">₹{parseFloat(selectedResult.considerationAmount).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Stamp Duty:</span>
                      <p className="text-white">₹{parseFloat(selectedResult.stampDuty).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Registration Fee:</span>
                      <p className="text-white">₹{parseFloat(selectedResult.registrationFee).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* Party Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-gray-800 rounded-lg p-3 sm:p-4">
                    <h3 className={`${lexendDeca.className} text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2`}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="#e3e3e3" className="sm:w-6 sm:h-6">
                        <path d="M200-200v-560 179-19 400Zm80-240h221q2-22 10-42t20-38H280v80Zm0 160h157q17-20 39-32.5t46-20.5q-4-6-7-13t-5-14H280v80Zm0-320h400v-80H280v80Zm-80 480q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v258q-14-26-34-46t-46-33v-179H200v560h202q-1 6-1.5 12t-.5 12v56H200Zm480-200q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM480-120v-56q0-24 12.5-44.5T528-250q36-15 74.5-22.5T680-280q39 0 77.5 7.5T832-250q23 9 35.5 29.5T880-176v56H480Z"/>
                      </svg>
                      Seller Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Name:</span>
                        <p className="text-white">{selectedResult.sellerName}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Father&apos;s Name:</span>
                        <p className="text-white">{selectedResult.sellerFatherName}</p>
                      </div>
                      {selectedResult.sellerAge && (
                        <div>
                          <span className="text-gray-400">Age:</span>
                          <p className="text-white">{selectedResult.sellerAge}</p>
                        </div>
                      )}
                      {selectedResult.sellerAddress && (
                        <div>
                          <span className="text-gray-400">Address:</span>
                          <p className="text-white">{selectedResult.sellerAddress}</p>
                        </div>
                      )}
                      {selectedResult.sellerPhone && (
                        <div>
                          <span className="text-gray-400">Phone:</span>
                          <p className="text-white">{selectedResult.sellerPhone}</p>
                        </div>
                      )}
                      {selectedResult.sellerEmail && (
                        <div>
                          <span className="text-gray-400">Email:</span>
                          <p className="text-white break-all">{selectedResult.sellerEmail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-black/40 border border-gray-800 rounded-lg p-3 sm:p-4">
                    <h3 className={`${lexendDeca.className} text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2`}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="#e3e3e3" className="sm:w-6 sm:h-6">
                        <path d="M200-200v-560 179-19 400Zm80-240h221q2-22 10-42t20-38H280v80Zm0 160h157q17-20 39-32.5t46-20.5q-4-6-7-13t-5-14H280v80Zm0-320h400v-80H280v80Zm-80 480q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v258q-14-26-34-46t-46-33v-179H200v560h202q-1 6-1.5 12t-.5 12v56H200Zm480-200q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM480-120v-56q0-24 12.5-44.5T528-250q36-15 74.5-22.5T680-280q39 0 77.5 7.5T832-250q23 9 35.5 29.5T880-176v56H480Z"/>
                      </svg>
                      Buyer Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Name:</span>
                        <p className="text-white">{selectedResult.buyerName}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Father&apos;s Name:</span>
                        <p className="text-white">{selectedResult.buyerFatherName}</p>
                      </div>
                      {selectedResult.buyerAge && (
                        <div>
                          <span className="text-gray-400">Age:</span>
                          <p className="text-white">{selectedResult.buyerAge}</p>
                        </div>
                      )}
                      {selectedResult.buyerAddress && (
                        <div>
                          <span className="text-gray-400">Address:</span>
                          <p className="text-white">{selectedResult.buyerAddress}</p>
                        </div>
                      )}
                      {selectedResult.buyerPhone && (
                        <div>
                          <span className="text-gray-400">Phone:</span>
                          <p className="text-white">{selectedResult.buyerPhone}</p>
                        </div>
                      )}
                      {selectedResult.buyerEmail && (
                        <div>
                          <span className="text-gray-400">Email:</span>
                          <p className="text-white break-all">{selectedResult.buyerEmail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Witnesses */}
                {selectedResult.witnesses && selectedResult.witnesses.length > 0 && (
                  <div className="bg-black/40 border border-gray-800 rounded-lg p-3 sm:p-4">
                    <h3 className={`${lexendDeca.className} text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2`}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="#e3e3e3" className="sm:w-6 sm:h-6">
                        <path d="M480-400q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400ZM320-240h320v-23q0-24-13-44t-36-30q-26-11-53.5-17t-57.5-6q-30 0-57.5 6T369-337q-23 10-36 30t-13 44v23ZM720-80H240q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80Zm0-80v-446L526-800H240v640h480Zm-480 0v-640 640Z"/>
                      </svg>
                      Witnesses ({selectedResult.witnesses.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedResult.witnesses.map((witness, index) => (
                        <div key={index} className="bg-black/60 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-medium mb-2">Witness {index + 1}</p>
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-gray-400">Name:</span>
                              <p className="text-white">{witness.name}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Address:</span>
                              <p className="text-white">{witness.address}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Phone:</span>
                              <p className="text-white">{witness.phone}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Aadhar:</span>
                              <p className="text-white">{witness.aadhar}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {selectedResult.documents && selectedResult.documents.length > 0 && (
                  <div className="bg-black/40 border border-gray-800 rounded-lg p-3 sm:p-4">
                  <h3 className={`${lexendDeca.className} text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2`}>
                    <FileText size={20} className="sm:w-6 sm:h-6" />
                      Documents ({selectedResult.documents.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedResult.documents.map((doc, index) => (
                        <div key={index} className="bg-black/60 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText size={22} className="text-gray-400 sm:w-6 sm:h-6" />
                            <div>
                              <p className="text-white text-sm font-medium">{doc.type}</p>
                              <p className="text-gray-400 text-xs">{doc.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadDocument(doc)}
                            className="p-2 bg-black/40 border border-gray-700 text-white rounded-lg hover:bg-black/60 transition-colors"
                            title="Download Document"
                          >
                            <Download size={18} className="sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property Photos */}
                {selectedResult.propertyPhotos && selectedResult.propertyPhotos.length > 0 && (
                  <div className="bg-black/40 border border-gray-800 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className={`${lexendDeca.className} text-sm sm:text-base font-medium flex items-center gap-2`}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="#e3e3e3" className="sm:w-5 sm:h-5">
                          <path d="M360-400h400L622-580l-92 120-62-80-108 140Zm-40 160q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z"/>
                        </svg>
                        Property Photos ({selectedResult.propertyPhotos.length})
                      </h3>
                      <button
                        onClick={() => {
                          downloadAllPhotos(selectedResult.propertyPhotos!, selectedResult.registrationId);
                        }}
                        className="px-2 sm:px-3 py-1.5 bg-black/40 border border-gray-700 text-white rounded-lg hover:bg-black/60 transition-colors text-sm flex items-center gap-2"
                      >
                        <Download size={16} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Download All</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {selectedResult.propertyPhotos.map((photo, index) => {
                        // Prefer IPFS URL, fallback to base64
                        const imageSrc = photo.url 
                          ? photo.url 
                          : (photo.data && photo.data.startsWith('data:') 
                            ? photo.data 
                            : photo.data ? `data:${photo.mimeType || 'image/jpeg'};base64,${photo.data}` : null);
                        
                        return (
                          <div key={index} className="bg-black/60 border border-gray-700 rounded-lg p-2 sm:p-3 flex flex-col items-center gap-2">
                            {imageSrc ? (
                              <img 
                                src={imageSrc}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-40 sm:h-48 object-cover rounded border-2 border-gray-600 shadow-lg"
                                onError={(e) => {
                                  console.error('Failed to load image:', photo.name);
                                  e.currentTarget.style.display = 'none';
                                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              height="32" 
                              viewBox="0 -960 960 960" 
                              width="32" 
                              fill="#9ca3af" 
                              className="sm:w-10 sm:h-10"
                              style={{ display: photo.data ? 'none' : 'block' }}
                            >
                              <path d="M360-400h400L622-580l-92 120-62-80-108 140Zm-40 160q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z"/>
                            </svg>
                            <p className="text-gray-400 text-xs truncate w-full text-center">{photo.name}</p>
                            <button
                              onClick={() => downloadPhoto(photo, selectedResult.registrationId)}
                              className="px-2 py-1 bg-black/40 border border-gray-700 text-white rounded hover:bg-black/60 transition-colors text-xs flex items-center gap-1 w-full justify-center"
                            >
                              <Download size={14} className="sm:w-4 sm:h-4" />
                              Download
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2 bg-white text-black rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => downloadCertificate(selectedResult)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2 bg-black/40 border border-gray-800 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-black/60 active:bg-black/70 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#e3e3e3" className="sm:w-5 sm:h-5 flex-shrink-0">
                    <path d="m648-140 112-112v92h40v-160H640v40h92L620-168l28 28Zm-448 20q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-19-9-39-15.5t-41-9.5v-243H200v560h242q3 22 9.5 42t15.5 38H200Zm0-120v40-560 243-3 280Zm80-40h163q3-21 9.5-41t14.5-39H280v80Zm0-160h244q32-30 71.5-50t84.5-27v-3H280v80Zm0-160h400v-80H280v80ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40Z"/>
                  </svg>
                  Download Certificate
                </button>
                <button
                  onClick={() => downloadAllData(selectedResult)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2 bg-white/10 border border-gray-700 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-white/20 active:bg-white/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#e3e3e3" className="sm:w-5 sm:h-5 flex-shrink-0">
                    <path d="m648-140 112-112v92h40v-160H640v40h92L620-168l28 28Zm-448 20q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-19-9-39-15.5t-41-9.5v-243H200v560h242q3 22 9.5 42t15.5 38H200Zm0-120v40-560 243-3 280Zm80-40h163q3-21 9.5-41t14.5-39H280v80Zm0-160h244q32-30 71.5-50t84.5-27v-3H280v80Zm0-160h400v-80H280v80ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40Z"/>
                  </svg>
                  Download All Data
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
              className="bg-black border border-gray-600 rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className={`${lexendDeca.className} text-lg sm:text-xl font-medium`}>
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
                  <QRCodeSVG value={selectedResult.registrationId} size={200} />
                </div>
                <p className="text-gray-400 text-sm mb-2">Scan to view registration details</p>
                <p className="font-mono text-white text-sm">{selectedResult.registrationId}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

