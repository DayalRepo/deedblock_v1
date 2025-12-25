'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle, Loader2, ArrowLeft, X } from 'lucide-react';
import { Toaster } from '@/components/ui/Toaster';
import { toast } from 'sonner';

// Supabase & IPFS
import { saveRegistration, type RegistrationData } from '@/lib/supabase/database';
import { uploadFileToIPFS, uploadFilesToIPFS, uploadJSONToIPFS } from '@/lib/ipfs/pinata';
import { supabase } from '@/lib/supabase/client';
import { clearUserDraftFiles, downloadDraftFile } from '@/lib/supabase/supabaseStorage';

// Components
import AuthGate from '@/components/AuthGate';
import { PropertyIcon, DocumentsIcon, ReviewIcon } from '@/components/registration/icons/RegistrationIcons';
import { Step1_DeedDetails } from '@/components/registration/steps/Step1_DeedDetails';
import { Step2_Documents } from '@/components/registration/steps/Step2_Documents';
import { Step3_ReviewPayment } from '@/components/registration/steps/Step3_ReviewPayment';

// Hooks & Types
import { useRegistrationForm, INITIAL_FORM_DATA } from '@/hooks/registration/useRegistrationForm';
import { useLocationData } from '@/hooks/registration/useLocationData';
import { useOTPVerification } from '@/hooks/registration/useOTPVerification';
import { useSupabaseDraft } from '@/hooks/registration/useSupabaseDraft';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema'; // Type

// Modals & Utils
import { CopyOverlay } from '@/components/registration/modals/CopyOverlay';
import { formatTime, calculateProgress } from '@/utils/registrationUtils';
import { downloadSummary } from '@/utils/downloadUtils';
import dynamic from 'next/dynamic';

const SuccessModal = dynamic(() => import('@/components/registration/modals/SuccessModal').then(mod => mod.SuccessModal), { ssr: false });
const DocumentPreviewModal = dynamic(() => import('@/components/registration/modals/DocumentPreviewModal').then(mod => mod.DocumentPreviewModal), { ssr: false });

const steps = [
  { id: 1, title: 'Deed Details', icon: PropertyIcon },
  { id: 2, title: 'Documents', icon: DocumentsIcon },
  { id: 3, title: 'Payment & Submit', icon: ReviewIcon },
];

export default function RegistrationPage() {
  const router = useRouter();

  // Custom Hooks
  const {
    form,
    currentStep,
    setCurrentStep,
    isSubmitting,
    setIsSubmitting,
    formTimeElapsed,
    saveDocument,
    savePhotos,
    resetTimer
  } = useRegistrationForm();

  const { setValue, watch, trigger, getValues, reset, handleSubmit } = form; // RHF methods

  // Child Hooks integration
  const locationDataHook = useLocationData({ setValue, watch });
  const otpVerification = useOTPVerification({ setValue, watch });

  // Local UI State
  const [documentPreview, setDocumentPreview] = useState<{ type: string; file: File } | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [documentPreviewName, setDocumentPreviewName] = useState<string | null>(null);
  const [showPropertyPhotos, setShowPropertyPhotos] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [registrationId, setRegistrationId] = useState<string>('');
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [copiedId, setCopiedId] = useState(false);
  const [showCopyOverlay, setShowCopyOverlay] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [countdown, setCountdown] = useState<number>(0);

  // Watch fields for logic/UI
  const surveyOrDoor = locationDataHook.surveyOrDoor;
  const paymentId = watch('paymentId');
  const declarationChecked = watch('declarationChecked');

  // Note: paymentVerified is managed locally in Step 3 for now, but to enable submit button we might need it?
  // Actually, I put the logic in Step 3 button disabled state.
  // But the main "Submit" button is here.
  // I need to know validation status of paymentId.
  // If I add validation rule to 'paymentId' in schema that it must start with '4', then `isValid` handles it.
  // The schema currently allows any string? No, I defined schema earlier.
  // Let's assume for now I will trust the "Verify" button in Step 3 to only allow proceed if valid?
  // Actually, I should probably block submit if paymentId is invalid.
  // I'll check `paymentId` value here.
  // Or better, I can rely on RHF validation if I update schema.
  // For now, I will assume Step 3 enforces verification visually, and here I check for presence.
  // However, I previously had `paymentVerified` state in `page.tsx`.
  // To keep it simple and consistent with previous logic, I'll assume users MUST verify in Step 3.
  // But "Verify" button in Step 3 is local.
  // I will check `paymentId?.startsWith('4')` here for enabling button.
  const isPaymentValid = paymentId && paymentId.startsWith('4');

  // Photo Preview Logic
  // Photo Preview Logic
  const propertyPhotosRaw = watch('propertyPhotos');
  // Memoize propertyPhotos to prevent infinite loops if watch returns new references for same files
  const propertyPhotos = React.useMemo(() => {
    return propertyPhotosRaw || [];
  }, [
    // Create a stable key from file metadata
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify((propertyPhotosRaw || []).map((f: File) => `${f.name}-${f.size}-${f.lastModified}`))
  ]);

  const [propertyPhotoUrls, setPropertyPhotoUrls] = useState<Map<number, string>>(new Map());

  // Supabase Persistence Hook
  const { clearDraft, isLoaded: isDraftLoaded } = useSupabaseDraft(form);

  // --- Effects ---

  // Get User ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  // Cleanup property photo URLs on unmount
  useEffect(() => {
    return () => {
      propertyPhotoUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [propertyPhotoUrls]);

  // Document preview URL - only create object URL for File objects
  // Don't clear the URL when documentPreview is null because we might be using URL-only preview
  useEffect(() => {
    if (documentPreview?.file && documentPreview.file instanceof File) {
      const url = URL.createObjectURL(documentPreview.file);
      setDocumentPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    // Don't set to null here - it would overwrite URLs set by previewDocumentUrl
  }, [documentPreview]);

  // Success Countdown
  useEffect(() => {
    if (submitSuccess) {
      setCountdown(600);
    } else {
      setCountdown(0);
    }
  }, [submitSuccess]);

  useEffect(() => {
    if (!submitSuccess || countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown(prev => {
        const next = prev - 1;
        if (next === 0) setTimeout(handleSuccessClose, 500);
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, submitSuccess]);

  // Sync photo URLs
  useEffect(() => {
    const photosToProcess = propertyPhotos || [];
    const newPropertyPhotoUrls = new Map<number, string>();
    const oldUrls = new Map(propertyPhotoUrls);

    photosToProcess.forEach((file: File, index: number) => {
      // Only create URLs for valid File objects (not hydrated plain objects)
      if (file instanceof File) {
        newPropertyPhotoUrls.set(index, URL.createObjectURL(file));
      }
    });
    // Clean old
    oldUrls.forEach(url => URL.revokeObjectURL(url));
    setPropertyPhotoUrls(newPropertyPhotoUrls);
    return () => {
      newPropertyPhotoUrls.forEach(url => URL.revokeObjectURL(url));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyPhotos]);
  // The above effect logic is a bit aggressive (recreates on every array change). Should be fine for now.


  // --- Logic ---

  // Gallery Mode State
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  // --- Logic ---

  // Helper to build the full gallery list (Documents + Photos)
  const buildGalleryItems = useCallback(() => {
    const items: any[] = [];
    const values = getValues();

    // 1. Add "Required Documents" in specific order
    const docKeys = ['saleDeed', 'ec', 'khata', 'taxReceipt'] as const;
    const docLabels: Record<string, string> = {
      'saleDeed': 'Sale Deed',
      'ec': 'Encumbrance Certificate',
      'khata': 'Seller Aadhar',
      'taxReceipt': 'Buyer Aadhar'
    };

    docKeys.forEach((key) => {
      // Cast the access to ensure TS understands the key is valid for both objects
      // We know these keys exist in the schema
      const file = values.documents?.[key as keyof typeof values.documents];
      const draft = values.draftDocumentUrls?.[key as keyof typeof values.draftDocumentUrls];

      if (file instanceof File) {
        items.push({
          type: 'file',
          url: URL.createObjectURL(file), // Create object URL for preview
          name: docLabels[key],
          file: file,
          category: 'Document',
          key: key // Original key to match for start index
        });
      } else if (draft?.url) {
        items.push({
          type: 'url',
          url: draft.url,
          name: docLabels[key],
          category: 'Document',
          key: key
        });
      }
    });

    // 2. Add "Property Photos"
    // Use the photoUrls map we already maintain for consistent object URLs
    const photos = propertyPhotos || [];
    const draftPhotoUrls = values.draftPhotoUrls || [];

    // Determine max count to iterate (max 6)
    const maxPhotos = Math.max(photos.length, draftPhotoUrls.length);

    for (let i = 0; i < maxPhotos; i++) {
      let url = null;
      let name = `Property Photo ${i + 1}`;
      let file = null;

      // Prefer File Object URL (fresh upload)
      if (photos[i] instanceof File) {
        url = propertyPhotoUrls.get(i);
        file = photos[i];
        name = photos[i].name;
      }
      // Fallback to Draft URL (hydrated)
      else if (draftPhotoUrls[i]?.url) {
        url = draftPhotoUrls[i].url;
        name = draftPhotoUrls[i].name;
      }

      if (url) {
        items.push({
          type: 'file', // Treat as file type for preview logic
          url: url,
          name: name,
          file: file,
          category: 'Photo',
          key: `photo_${i}`
        });
      }
    }

    return items;
  }, [getValues, propertyPhotos, propertyPhotoUrls]);

  const previewDocument = (type: string, file: File) => {
    // Legacy support for single file preview if needed, but now we prefer gallery
    // Find index of this file in the gallery
    const items = buildGalleryItems();
    const index = items.findIndex(item => item.file === file || item.key === type);

    setGalleryItems(items);
    setGalleryStartIndex(index >= 0 ? index : 0);
    setShowDocuments(true);
  };

  // Preview document from URL (for hydrated documents)
  const previewDocumentUrl = (type: string, url: string, name: string) => {
    const items = buildGalleryItems();
    // For URL-based docs, type is the key (e.g., 'saleDeed')
    const index = items.findIndex(item => item.key === type);

    setGalleryItems(items);
    setGalleryStartIndex(index >= 0 ? index : 0);
    setShowDocuments(true);
  };

  const previewPhotos = () => {
    // Open gallery starting at first photo
    const items = buildGalleryItems();
    const firstPhotoIndex = items.findIndex(item => item.category === 'Photo');

    setGalleryItems(items);
    setGalleryStartIndex(firstPhotoIndex >= 0 ? firstPhotoIndex : 0);
    setShowDocuments(true);
  };

  const resetFormFull = async () => {
    // Explicitly reset to initial empty state to clear UI
    reset(INITIAL_FORM_DATA);

    // Call reset on OTP hook
    otpVerification.resetOtpState();

    // Clear Supabase Draft
    await clearDraft();

    setCurrentStep(1);
    resetTimer();
    setRegistrationId('');
    setSubmitSuccess(false);
    window.scrollTo(0, 0);
  };

  const resetStep1Only = async () => {
    // Reset specific fields for Step 1
    const fieldsToReset: (keyof RegistrationFormSchema)[] = [
      'surveyNumber', 'doorNumber', 'village', 'taluka', 'district', 'state',
      'transactionType', 'considerationAmount', 'stampDuty', 'registrationFee',
      'sellerAadhar', 'sellerPhone',
      'buyerAadhar', 'buyerPhone',
      'sellerOtpVerified', 'buyerOtpVerified',
      'sellerFingerprintVerified', 'buyerFingerprintVerified',
      'sellerAadharOtpVerified', 'buyerAadharOtpVerified'
      // Note: Add other fields if missing from schema types
    ];

    // Reset form values to default/empty for these keys
    fieldsToReset.forEach((field) => {
      setValue(field, INITIAL_FORM_DATA[field] as any);
    });

    // Reset OTP hook
    otpVerification.resetOtpState();

    // Clear Draft
    await clearDraft();
  };




  const resetStep2Only = async () => {
    // 1. Clear Form State (Documents & Photos)
    // We explicitly set to null/empty as per schema
    setValue('documents', {
      saleDeed: null,
      ec: null,
      khata: null,
      taxReceipt: null
    }, { shouldValidate: true, shouldDirty: true });

    setValue('draftDocumentUrls', {
      saleDeed: null,
      ec: null,
      khata: null,
      taxReceipt: null
    }, { shouldDirty: true });

    setValue('propertyPhotos', [], { shouldValidate: true, shouldDirty: true });
    setValue('draftPhotoUrls', [], { shouldDirty: true });

    // 2. Clear Local State
    setPropertyPhotoUrls(new Map());

    // 3. Clear Supabase Storage Files
    if (userId) {
      try {
        await clearUserDraftFiles(userId);
        toast.success("All documents and photos cleared.");
      } catch (err) {
        console.error("Error clearing storage:", err);
        // Toast already handled?
      }
    }
  };


  const resetStep3Only = async () => {
    // Reset only Step 3 specific fields
    // Payment ID and Declaration
    setValue('paymentId', '', { shouldValidate: true, shouldDirty: true });
    setValue('paymentIdVerified', false, { shouldDirty: true });
    setValue('declarationChecked', false, { shouldDirty: true });

    // We do NOT call clearDraft() here because we want to preserve Step 1 & 2 data.
    // The useSupabaseDraft hook will automatically sync these empty values to the draft.
  };

  const handleSuccessClose = useCallback(() => {
    setSubmitSuccess(false);
    setCountdown(0);
    resetFormFull();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const copyRegistrationId = async () => {
    if (registrationId) {
      try {
        await navigator.clipboard.writeText(registrationId);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } catch (err) {
        console.error('Failed to copy ID:', err);
      }
    }
  };

  const validateCurrentStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = [
        'state', 'district', 'taluka', 'village',
        surveyOrDoor === 'survey' ? 'surveyNumber' : 'doorNumber',
        'transactionType', 'sellerAadhar', 'sellerPhone', 'buyerAadhar', 'buyerPhone'
      ];
      // Note: RHF validation doesn't automatically check 'true' for custom boolean flags unless validation schema enforces it.
      // We manually enforcing proceed logic for "Next" button?
      // User requested "submit button" blocked. We will block Next too if needed, but let's stick to Submit first or strict check.
      // Actually, if they are stuck on Step 1, they can't go to Step 3.
      // So ensuring validation here helps.
    } else if (currentStep === 2) {
      // For step 2, we need custom validation that checks both File objects AND draftDocumentUrls
      // because after refresh, File objects are empty {} but draftDocumentUrls contain valid URLs
      const values = getValues();
      const documents = values.documents;
      const draftUrls = values.draftDocumentUrls;

      const requiredDocs = ['saleDeed', 'ec', 'khata', 'taxReceipt'] as const;
      let allDocsValid = true;

      for (const key of requiredDocs) {
        const file = documents?.[key];
        const draftUrl = draftUrls?.[key];
        const isValidFile = file instanceof File && file.size > 0;
        const hasDraftUrl = !!draftUrl?.url && !!draftUrl?.path;

        if (!isValidFile && !hasDraftUrl) {
          allDocsValid = false;
          // Set error for this field
          form.setError(`documents.${key}` as any, {
            type: 'manual',
            message: 'File is required (upload or re-upload after refresh)'
          });
        }
      }

      // If documents validation failed, return false without triggering schema validation
      if (!allDocsValid) {
        return false;
      }

      // Clear any leftover document errors since validation passed
      for (const key of requiredDocs) {
        form.clearErrors(`documents.${key}` as any);
      }

      // propertyPhotos is optional, no validation needed
      return true;
    }

    // Trigger validation for non-step-2 fields
    const result = await trigger(fieldsToValidate);
    if (!result) {
      // Find first error and show toast?
      // Or RHF shows errors inline.
      // We can show a toast saying "Please fix errors".
    }
    return result;
  };

  const nextStep = async () => {
    if (await validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const onFinalSubmit = async (data: RegistrationFormSchema) => {
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      const regId = `DB-${Date.now().toString().slice(-8)}`;
      setRegistrationId(regId);

      // Helper to upload IPFS
      // ... (Logic from previous file)
      const documentsIPFS: Record<string, { name: string; ipfsHash: string; mimeType: string }> = {};
      const documentUploadPromises = [];

      // Helper to process document (upload File OR download draft then upload)
      const processDocument = async (key: string, file: any, draft: any) => {
        let fileToUpload: File | null = null;

        if (file instanceof File) {
          fileToUpload = file;
        } else if (draft?.path) {
          // Download from Supabase Storage
          console.log(`Downloading draft ${key} from ${draft.path}...`);
          fileToUpload = await downloadDraftFile(draft.path, draft.name || `${key}.pdf`);
        }

        if (fileToUpload) {
          try {
            const res = await uploadFileToIPFS(fileToUpload, fileToUpload.name);
            if (res?.hash) {
              documentsIPFS[key] = {
                name: fileToUpload.name,
                ipfsHash: res.hash,
                mimeType: fileToUpload.type
              };
            }
          } catch (err) {
            console.error(`Failed to process ${key}:`, err);
            throw new Error(`Failed to upload ${key}. Please try again.`);
          }
        }
      };

      // Process all required docs
      if (data.documents.saleDeed || data.draftDocumentUrls?.saleDeed)
        documentUploadPromises.push(processDocument('saleDeed', data.documents.saleDeed, data.draftDocumentUrls?.saleDeed));

      if (data.documents.ec || data.draftDocumentUrls?.ec)
        documentUploadPromises.push(processDocument('ec', data.documents.ec, data.draftDocumentUrls?.ec));

      if (data.documents.khata || data.draftDocumentUrls?.khata)
        documentUploadPromises.push(processDocument('khata', data.documents.khata, data.draftDocumentUrls?.khata));

      if (data.documents.taxReceipt || data.draftDocumentUrls?.taxReceipt)
        documentUploadPromises.push(processDocument('taxReceipt', data.documents.taxReceipt, data.draftDocumentUrls?.taxReceipt));

      await Promise.all(documentUploadPromises);

      let photosIPFS: Array<{ name: string; ipfsHash: string; mimeType: string }> = [];
      const photosToUpload: File[] = [];

      // Collect photos (mix of Files and Drafts)
      const maxPhotos = Math.max(data.propertyPhotos?.length || 0, data.draftPhotoUrls?.length || 0);

      // We need to gather all valid File objects first
      for (let i = 0; i < maxPhotos; i++) {
        const file = data.propertyPhotos?.[i];
        const draft = data.draftPhotoUrls?.[i];

        if (file instanceof File) {
          photosToUpload.push(file);
        } else if (draft?.path) {
          const downloaded = await downloadDraftFile(draft.path, draft.name || `photo_${i}.jpg`);
          if (downloaded) photosToUpload.push(downloaded);
        }
      }

      if (photosToUpload.length > 0) {
        const uploadedPhotos = await uploadFilesToIPFS(photosToUpload);
        photosIPFS = uploadedPhotos.map(p => ({
          name: p.name,
          ipfsHash: p.hash,
          mimeType: p.mimeType || 'image/jpeg'
        }));
      }

      const registrationDate = new Date().toISOString().split('T')[0];
      const walletAddress = `guest-${regId}`;

      const jsonData = {
        registrationId: regId,
        registrationDate,
        walletAddress,
        formData: data,
        documents: documentsIPFS,
        propertyPhotos: photosIPFS
      };

      await uploadJSONToIPFS(jsonData, `registration-${regId}.json`);

      const registrationData: RegistrationData = {
        user_id: userId,
        registration_id: regId,
        registration_date: registrationDate,
        status: 'verified',
        survey_number: data.surveyNumber || '',
        door_number: data.doorNumber || '',
        village: data.village,
        taluka: data.taluka,
        district: data.district,
        state: data.state,
        transaction_type: data.transactionType,
        consideration_amount: data.considerationAmount,
        stamp_duty: data.stampDuty || '0',
        registration_fee: data.registrationFee || '0',
        seller_aadhar: data.sellerAadhar ? data.sellerAadhar.replace(/\s/g, '') : '',
        seller_phone: data.sellerPhone ? data.sellerPhone.replace(/\s/g, '') : '',
        seller_otp_verified: data.sellerOtpVerified,
        seller_biometric_verified: data.sellerFingerprintVerified,
        buyer_aadhar: data.buyerAadhar ? data.buyerAadhar.replace(/\s/g, '') : '',
        buyer_phone: data.buyerPhone ? data.buyerPhone.replace(/\s/g, '') : '',
        buyer_otp_verified: data.buyerOtpVerified,
        buyer_biometric_verified: data.buyerFingerprintVerified,
        documents: Object.keys(documentsIPFS).length > 0 ? documentsIPFS : undefined,
        property_photos: photosIPFS.length > 0 ? photosIPFS : undefined,
      };

      await saveRegistration(registrationData);

      await clearDraft();

      // Clean up Supabase Storage files (now moved to permanent IPFS)
      if (userId) {
        await clearUserDraftFiles(userId);
      }

      setSubmitSuccess(true);
      toast.success("Registration submitted successfully!");

    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Submission failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1_DeedDetails
            form={form}
            locationDataHook={locationDataHook}
            otpVerification={otpVerification}
            onReset={resetStep1Only}
          />
        );
      case 2:
        return (
          <Step2_Documents
            form={form}
            userId={userId}
            saveDocument={saveDocument}
            savePhotos={savePhotos}
            previewDocument={previewDocument}
            onPreviewDocumentUrl={previewDocumentUrl}
            onPreviewPhotos={previewPhotos}
            onReset={resetStep2Only} // Use specific reset for Step 2
          />
        );
      case 3:
        return (
          <Step3_ReviewPayment
            form={form}
            surveyOrDoor={surveyOrDoor}
            downloadSummary={() => downloadSummary(getValues(), registrationId)}
            onReset={resetStep3Only}
            previewDocument={previewDocument}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-white pt-24 sm:pt-32 pb-8 px-4 sm:px-6 font-sans">
        <Toaster />
        <div className="w-full max-w-4xl mx-auto">
          {/* Navigation Header */}
          <div className="flex justify-between items-center mb-6 px-4 sm:px-8">
            <button
              onClick={() => {
                if (currentStep === 1) {
                  router.push('/');
                } else {
                  prevStep();
                }
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline font-medium">Back</span>
            </button>

            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-black transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-2 sm:mb-4 px-4 sm:px-8">
            <div className="bg-white border border-gray-300 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-normal text-gray-500">Form Progress</span>
                  {/* calculateProgress logic might need update if it relied on formData structure matching. RHF data matches Schema which matches old FormData mostly. */}
                  {/* Actually calculateProgress expects (step, success, paymentVerified, declarationChecked). */}
                  {/* I can pass values. */}
                  <span className="text-base font-normal text-gray-500">{calculateProgress(currentStep, submitSuccess, paymentId && paymentId.startsWith('4') ? 'valid' : 'idle', declarationChecked)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateProgress(currentStep, submitSuccess, paymentId && paymentId.startsWith('4') ? 'valid' : 'idle', declarationChecked)}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Steps Header (Desktop) */}
          <div className="mb-4 sm:mb-6 px-6 sm:px-12 hidden sm:block">
            <div className="flex items-center justify-between">
              {/* Deed Details - Left aligned */}
              <span className={`text-base font-normal whitespace-nowrap ${currentStep === 1 ? 'text-black' : 'text-gray-400'}`}>
                Deed Details
              </span>

              {/* Dashed line */}
              <div className="flex-1 mx-6 border-t border-dashed border-gray-300"></div>

              {/* Documents - Center aligned */}
              <span className={`text-base font-normal whitespace-nowrap ${currentStep === 2 ? 'text-black' : 'text-gray-400'}`}>
                Documents
              </span>

              {/* Dashed line */}
              <div className="flex-1 mx-6 border-t border-dashed border-gray-300"></div>

              {/* Payment & Submit - Right aligned */}
              <span className={`text-base font-normal whitespace-nowrap ${currentStep === 3 ? 'text-black' : 'text-gray-400'}`}>
                Payment & Submit
              </span>
            </div>
          </div>

          {/* Mobile Step Heading */}
          <div className="sm:hidden px-4 mb-2">
            <h2 className="text-base font-normal text-black">{steps.find(s => s.id === currentStep)?.title}</h2>
          </div>

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={`relative bg-white border border-gray-300 rounded-lg p-3 sm:p-6 mb-6 mx-4 sm:mx-8`}
          >
            {renderStepContent()}
          </motion.div>

          {/* Navigation Buttons */}
          <div className="flex justify-between px-4 sm:px-8 mb-4">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base transition-colors ${currentStep === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-black hover:bg-gray-200 border border-gray-300'}`}
              type="button"
            >
              <ChevronLeft size={18} /> <span className="hidden sm:inline">Previous</span>
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base transition-colors bg-black text-white hover:bg-gray-800"
                type="button"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              // Submit Button
              <button
                // We wrap this inside handleSubmit only if clicked. Or we call handleSubmit manually.
                onClick={handleSubmit(onFinalSubmit)}
                // Disabled conditions: submitting, payment invalid, declaration unchecked.
                // We check payment and declaration from watched values.
                disabled={isSubmitting || !isPaymentValid || !declarationChecked}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base transition-colors ${(isSubmitting || !isPaymentValid || !declarationChecked) ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50' : 'bg-black text-white hover:bg-gray-800'}`}
                type="button"
              >
                {isSubmitting ? (
                  <> <Loader2 size={18} className="animate-spin" /> Submitting... </>
                ) : (
                  <><CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> Submit</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {submitSuccess && (
            <SuccessModal
              key="success-modal"
              registrationId={registrationId}
              formTimeElapsed={formTimeElapsed}
              downloadSummary={() => downloadSummary(getValues(), registrationId)}
              onCopyId={copyRegistrationId}
              isIdCopied={copiedId}
              onClose={handleSuccessClose}
            />
          )}


          {(showDocuments || showPropertyPhotos) && (
            <DocumentPreviewModal
              key="document-preview-modal"
              items={galleryItems}
              initialIndex={galleryStartIndex}
              onClose={() => {
                setShowDocuments(false);
                setShowPropertyPhotos(false);
                setGalleryItems([]);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </AuthGate>
  );
}
