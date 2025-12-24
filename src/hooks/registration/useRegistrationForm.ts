import { useState, useEffect, useCallback } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
        ec: null as File | null,
        khata: null as File | null,
        taxReceipt: null as File | null,
    },
    propertyPhotos: [] as File[],
    // Draft file storage - Supabase Storage URLs and paths
    draftDocumentUrls: {
        saleDeed: null,
        ec: null,
        khata: null,
        taxReceipt: null,
    },
    draftPhotoUrls: [] as Array<{ url: string; path: string; name: string }>,
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

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setFormTimeElapsed(Date.now() - formStartTime), 1000);
        return () => clearInterval(timer);
    }, [formStartTime]);

    const resetTimer = () => {
        setFormStartTime(Date.now());
        setFormTimeElapsed(0);
    };

    // Placeholder functions for backward compatibility or if we implement Storage later
    const saveDocument = useCallback(async (key: string, file: File | null) => {
        // No-op: Files are not persisted in Supabase Draft JSON
    }, []);

    const savePhotos = useCallback(async (photos: File[]) => {
        // No-op
    }, []);

    return {
        form: form as UseFormReturn<RegistrationFormSchema>,
        currentStep, setCurrentStep,
        isSubmitting, setIsSubmitting,
        formTimeElapsed, resetTimer,
        saveDocument,
        savePhotos
    };
}
