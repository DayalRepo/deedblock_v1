'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/utils/logger';

interface UseFormStorageOptions<T> {
    pageName: string;
    initialData: T;
    debounceMs?: number;
}

export function useFormStorage<T extends Record<string, unknown>>({
    pageName,
    initialData,
    debounceMs = 1000,
}: UseFormStorageOptions<T>) {
    const [formData, setFormData] = useState<T>(initialData);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get storage key based on userId and pageName
    const getStorageKey = useCallback((uid: string) => {
        return `deedblock_${uid}_${pageName}`;
    }, [pageName]);

    // Load saved data on mount and when user changes
    useEffect(() => {
        const loadData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;

            if (uid) {
                setUserId(uid);
                const storageKey = getStorageKey(uid);

                try {
                    const savedData = localStorage.getItem(storageKey);
                    if (savedData) {
                        const parsed = JSON.parse(savedData);
                        setFormData((prev) => ({ ...prev, ...parsed }));
                    }
                } catch (error) {
                    logger.error('Error loading saved form data:', error);
                }
            }
            setIsLoaded(true);
        };

        loadData();

        // Listen for auth state changes (reconnection handling)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const uid = session?.user?.id;
            if (uid && uid !== userId) {
                setUserId(uid);
                const storageKey = getStorageKey(uid);

                try {
                    const savedData = localStorage.getItem(storageKey);
                    if (savedData) {
                        const parsed = JSON.parse(savedData);
                        setFormData((prev) => ({ ...prev, ...parsed }));
                    }
                } catch (error) {
                    logger.error('Error loading saved form data on reconnect:', error);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [getStorageKey, userId]);

    // Auto-save with debounce
    useEffect(() => {
        if (!userId || !isLoaded) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            const storageKey = getStorageKey(userId);
            try {
                localStorage.setItem(storageKey, JSON.stringify(formData));
            } catch (error) {
                logger.error('Error saving form data:', error);
            }
        }, debounceMs);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [formData, userId, isLoaded, getStorageKey, debounceMs]);

    // Update form data
    const updateFormData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
        if (typeof updates === 'function') {
            setFormData(updates);
        } else {
            setFormData((prev) => ({ ...prev, ...updates }));
        }
    }, []);

    // Reset current page's data
    const resetPageData = useCallback(() => {
        if (userId) {
            const storageKey = getStorageKey(userId);
            try {
                localStorage.removeItem(storageKey);
            } catch (error) {
                logger.error('Error clearing form data:', error);
            }
        }
        setFormData(initialData);
    }, [userId, getStorageKey, initialData]);

    // Reset specific step data (for multi-step forms)
    const resetStepData = useCallback((stepKeys: (keyof T)[]) => {
        setFormData((prev) => {
            const resetData = { ...prev };
            stepKeys.forEach((key) => {
                if (key in initialData) {
                    resetData[key] = initialData[key];
                }
            });
            return resetData;
        });
    }, [initialData]);

    return {
        formData,
        setFormData: updateFormData,
        resetPageData,
        resetStepData,
        isLoaded,
        userId,
    };
}
