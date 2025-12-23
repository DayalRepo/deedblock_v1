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
import { clearUserFilesFromIndexedDB, deleteFormDataFromIndexedDB } from '@/utils/indexedDB';
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
  const [showPropertyPhotos, setShowPropertyPhotos] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [registrationId, setRegistrationId] = useState<string>('');
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

  // --- Effects ---

  // Cleanup property photo URLs on unmount
  useEffect(() => {
    return () => {
      propertyPhotoUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [propertyPhotoUrls]);

  // Document preview URL
  useEffect(() => {
    if (documentPreview?.file) {
      const url = URL.createObjectURL(documentPreview.file);
      setDocumentPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setDocumentPreviewUrl(null);
      };
    } else {
      setDocumentPreviewUrl(null);
    }
  }, [documentPreview]);

  // Success Countdown
  useEffect(() => {
    if (submitSuccess) {
      setCountdown(60);
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
      // Just create new URLs for simplicity as before, but now effect only runs when propertyPhotos actually changes reference from RHF
      // RHF ensures reference stability for the same value usually.
      newPropertyPhotoUrls.set(index, URL.createObjectURL(file));
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

  const previewDocument = (type: string, file: File) => {
    setDocumentPreview({ type, file });
    if (type.startsWith('photo_')) {
      setShowPropertyPhotos(true);
    } else {
      setShowDocuments(true);
    }
  };

  const resetFormFull = async () => {
    // Explicitly reset to initial empty state to clear UI
    reset(INITIAL_FORM_DATA);

    // Call reset on OTP hook
    otpVerification.resetOtpState();

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      // Clear IndexedDB
      await clearUserFilesFromIndexedDB(session.user.id);
      await deleteFormDataFromIndexedDB(session.user.id);
    }
    setCurrentStep(1);
    resetTimer();
    setRegistrationId('');
    setSubmitSuccess(false);
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
        setShowCopyOverlay(true);
        setTimeout(() => setCopiedId(false), 2000);
        setTimeout(() => setShowCopyOverlay(false), 1500);
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
    } else if (currentStep === 2) {
      fieldsToValidate = ['documents.saleDeed', 'documents.ec', 'documents.khata', 'documents.taxReceipt', 'propertyPhotos'];
    }

    // Trigger validation
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
      const regId = `REG-${Date.now().toString().slice(-8)}`;
      setRegistrationId(regId);

      // Helper to upload IPFS
      // ... (Logic from previous file)
      const documentsIPFS: Record<string, { name: string; ipfsHash: string; mimeType: string }> = {};
      const documentUploadPromises = [];

      if (data.documents.saleDeed) {
        const f = data.documents.saleDeed;
        documentUploadPromises.push(uploadFileToIPFS(f, f.name).then(res => {
          if (res?.hash) documentsIPFS['saleDeed'] = { name: f.name, ipfsHash: res.hash, mimeType: f.type };
        }));
      }
      if (data.documents.ec) {
        const f = data.documents.ec;
        documentUploadPromises.push(uploadFileToIPFS(f, f.name).then(res => {
          if (res?.hash) documentsIPFS['ec'] = { name: f.name, ipfsHash: res.hash, mimeType: f.type };
        }));
      }
      if (data.documents.khata) {
        const f = data.documents.khata;
        documentUploadPromises.push(uploadFileToIPFS(f, f.name).then(res => {
          if (res?.hash) documentsIPFS['khata'] = { name: f.name, ipfsHash: res.hash, mimeType: f.type };
        }));
      }
      if (data.documents.taxReceipt) {
        const f = data.documents.taxReceipt;
        documentUploadPromises.push(uploadFileToIPFS(f, f.name).then(res => {
          if (res?.hash) documentsIPFS['taxReceipt'] = { name: f.name, ipfsHash: res.hash, mimeType: f.type };
        }));
      }
      await Promise.all(documentUploadPromises);

      let photosIPFS: Array<{ name: string; ipfsHash: string; mimeType: string }> = [];
      if (data.propertyPhotos && data.propertyPhotos.length > 0) {
        const uploadedPhotos = await uploadFilesToIPFS(data.propertyPhotos);
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
        wallet_address: walletAddress,
        status: 'verified',
        survey_number: data.surveyNumber || '',
        door_number: data.doorNumber || '',
        village: data.village,
        taluka: data.taluka,
        district: data.district,
        state: data.state,
        area: '0',
        area_unit: 'sqft',
        transaction_type: data.transactionType,
        consideration_amount: data.considerationAmount,
        stamp_duty: data.stampDuty || '0',
        registration_fee: data.registrationFee || '0',
        seller_name: '',
        seller_aadhar: data.sellerAadhar ? data.sellerAadhar.replace(/\s/g, '') : '',
        seller_phone: data.sellerPhone ? data.sellerPhone.replace(/\s/g, '') : '',
        seller_email: data.sellerEmail,
        buyer_name: '',
        buyer_aadhar: data.buyerAadhar ? data.buyerAadhar.replace(/\s/g, '') : '',
        buyer_phone: data.buyerPhone ? data.buyerPhone.replace(/\s/g, '') : '',
        buyer_email: data.buyerEmail,
        property_type: 'land',
        plot_number: '',
        pincode: '',
        documents: Object.keys(documentsIPFS).length > 0 ? documentsIPFS : undefined,
        property_photos: photosIPFS.length > 0 ? photosIPFS : undefined,
      };

      await saveRegistration(registrationData);

      await clearUserFilesFromIndexedDB(userId);
      await deleteFormDataFromIndexedDB(userId);

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
            onReset={resetFormFull}
          />
        );
      case 2:
        return (
          <Step2_Documents
            form={form}
            saveDocument={saveDocument}
            savePhotos={savePhotos}
            previewDocument={previewDocument}
            onReset={resetFormFull}
          />
        );
      case 3:
        return (
          <Step3_ReviewPayment
            form={form}
            surveyOrDoor={surveyOrDoor}
            downloadSummary={() => downloadSummary(getValues(), registrationId)}
            onReset={resetFormFull}
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
              onClick={() => router.push('/')}
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
                  <>Submit</>
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



          {showCopyOverlay && <CopyOverlay key="copy-overlay" />}

          {(showDocuments || showPropertyPhotos) && (
            <DocumentPreviewModal
              key="document-preview-modal"
              file={documentPreview?.file || null}
              fileUrl={documentPreviewUrl}
              showPropertyPhotos={showPropertyPhotos}
              propertyPhotos={propertyPhotos}
              propertyPhotoUrls={propertyPhotoUrls}
              onClose={() => { setShowDocuments(false); setShowPropertyPhotos(false); }}
            />
          )}
        </AnimatePresence>
      </div>
    </AuthGate>
  );
}
