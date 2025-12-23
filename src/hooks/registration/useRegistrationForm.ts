import { useState, useEffect, useCallback } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase/client';
import { saveFormDataToIndexedDB, getFormDataFromIndexedDB, saveFileToindexedDB, getFileFromIndexedDB, deleteFileFromIndexedDB } from '@/utils/indexedDB';
import { registrationSchema, RegistrationFormSchema } from '@/lib/validations/registrationSchema';

export const INITIAL_FORM_DATA = {
    surveyNumber: '',
    doorNumber: '',
    village: '',
    taluka: '',
    district: '',
    state: '',
    transactionType: '',
    considerationAmount: '',
    stampDuty: '',
    registrationFee: '',
    sellerAadhar: '',
    sellerPhone: '',
    sellerEmail: '',
    buyerAadhar: '',
    buyerPhone: '',
    buyerEmail: '',
    documents: {
        saleDeed: null as File | null,
        khata: null as File | null,
        taxReceipt: null as File | null,
    },
    propertyPhotos: [] as File[],
    sellerOtpVerified: false,
    buyerOtpVerified: false,
    sellerFingerprintVerified: false,
    buyerFingerprintVerified: false,
    sellerAadharOtpVerified: false,
    buyerAadharOtpVerified: false,
    declarationChecked: false,
    paymentId: ''
};

export function useRegistrationForm() {
    const form = useForm<RegistrationFormSchema>({
        resolver: zodResolver(registrationSchema),
        defaultValues: INITIAL_FORM_DATA as RegistrationFormSchema,
        mode: 'onChange'
    });

    const { getValues, setValue, reset, watch, control } = form;

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStartTime, setFormStartTime] = useState<number>(Date.now());
    const [formTimeElapsed, setFormTimeElapsed] = useState<number>(0);

    // Load from IndexedDB
    useEffect(() => {
        const loadSavedData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) return;

            try {
                const saved = await getFormDataFromIndexedDB(userId);

                // Helper to load files
                const loadFiles = async () => {
                    const docsToRestore: any = {};
                    const docKeys = ['saleDeed', 'khata', 'taxReceipt'];
                    for (const key of docKeys) {
                        const file = await getFileFromIndexedDB(userId, `doc_${key}`);
                        if (file) docsToRestore[key] = file;
                    }

                    const photosToRestore: File[] = [];
                    for (let i = 0; i < 6; i++) {
                        const file = await getFileFromIndexedDB(userId, `photo_${i}`);
                        if (file) photosToRestore.push(file); else break;
                    }

                    return { docs: docsToRestore, photos: photosToRestore };
                };

                const files = await loadFiles();

                if (saved || files.photos.length > 0 || Object.keys(files.docs).length > 0) {
                    reset({
                        ...INITIAL_FORM_DATA,
                        ...saved,
                        documents: { ...INITIAL_FORM_DATA.documents, ...files.docs },
                        propertyPhotos: files.photos
                    });
                }

                if (saved?.currentStep) setCurrentStep(saved.currentStep);

            } catch (error) {
                console.error("Failed to load saved data", error);
            }
        };
        loadSavedData();
    }, [reset]);

    // Auto-Save Text Data
    useEffect(() => {
        const subscription = watch(async (value) => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) return;

            const { documents, propertyPhotos, ...textData } = value;
            const payload = { ...textData, currentStep };

            // Debounce save? relying on idb library or frequent overwrites
            // For now, save directly (maybe debounce in real app)
            saveFormDataToIndexedDB(userId, payload).catch(console.error);
        });
        return () => subscription.unsubscribe();
    }, [watch, currentStep]);


    // Handle File Saving
    const saveDocument = useCallback(async (key: string, file: File | null) => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        if (file) {
            await saveFileToindexedDB(userId, `doc_${key}`, file);
        } else {
            await deleteFileFromIndexedDB(userId, `doc_${key}`);
        }
    }, []);

    const savePhotos = useCallback(async (photos: File[]) => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        // Overwrite strategy: save all current, delete excess
        for (let i = 0; i < 6; i++) {
            if (i < photos.length) {
                await saveFileToindexedDB(userId, `photo_${i}`, photos[i]);
            } else {
                await deleteFileFromIndexedDB(userId, `photo_${i}`);
            }
        }
    }, []);


    // Timer
    useEffect(() => {
        const timer = setInterval(() => setFormTimeElapsed(Date.now() - formStartTime), 1000);
        return () => clearInterval(timer);
    }, [formStartTime]);

    const resetTimer = () => {
        setFormStartTime(Date.now());
        setFormTimeElapsed(0);
    };

    return {
        form: form as UseFormReturn<RegistrationFormSchema>,
        currentStep, setCurrentStep,
        isSubmitting, setIsSubmitting,
        formTimeElapsed, resetTimer,
        saveDocument,
        savePhotos
    };
}
