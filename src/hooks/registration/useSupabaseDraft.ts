import { useEffect, useState, useCallback, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';
import { refreshDraftPhotoUrls, refreshDraftDocumentUrls } from '@/lib/supabase/supabaseStorage';
import { logger } from '@/utils/logger';

const TABLE_NAME = 'registration_drafts';

export function useSupabaseDraft(form: UseFormReturn<RegistrationFormSchema>) {
    const { watch, reset, getValues, setValue, formState: { isDirty } } = form;
    const formData = watch(); // Watch all fields

    const [isLoaded, setIsLoaded] = useState(false);
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const lastSavedData = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Listen to Auth State
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data }) => {
            const id = data.session?.user?.id;
            logger.debug('[Draft] Initial Session User:', id);
            setUserId(id);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const id = session?.user?.id;
            logger.debug('[Draft] Auth Change User:', id);
            setUserId(id);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load Draft on Mount/Auth Change
    useEffect(() => {
        if (!userId) {
            setIsLoaded(false);
            return;
        }

        const fetchDraft = async () => {
            logger.debug('[Draft] Fetching for user:', userId);
            try {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select('draft_data')
                    .eq('user_id', userId)
                    .single();

                if (error) {
                    if (error.code !== 'PGRST116') {
                        logger.error('[Draft] Error fetching:', error);
                        // CRITICAL: Do NOT enable loading/saving if we failed to fetch.
                        toast.error("Failed to load draft. Auto-save is disabled.");
                        return;
                    } else {
                        logger.debug('[Draft] No existing draft found.');
                        // CRITICAL FIX: Initialize lastSaved with current defaults.
                        lastSavedData.current = JSON.stringify(getValues());
                        setIsLoaded(true);
                    }
                } else {
                    if (data?.draft_data) {
                        logger.debug('[Draft] Restoring data:', data.draft_data);
                        const parsedData = data.draft_data;
                        reset(parsedData);
                        lastSavedData.current = JSON.stringify(parsedData);

                        // Refresh signed URLs for Supabase Storage files
                        // These URLs expire after 7 days, so we regenerate them on load
                        try {
                            if (parsedData.draftPhotoUrls && parsedData.draftPhotoUrls.length > 0) {
                                logger.debug('[Draft] Refreshing photo URLs...');
                                const refreshedPhotos = await refreshDraftPhotoUrls(parsedData.draftPhotoUrls);
                                setValue('draftPhotoUrls', refreshedPhotos, { shouldDirty: false });
                                logger.debug('[Draft] Photo URLs refreshed:', refreshedPhotos);
                            }

                            if (parsedData.draftDocumentUrls) {
                                logger.debug('[Draft] Refreshing document URLs...');
                                const refreshedDocs = await refreshDraftDocumentUrls(parsedData.draftDocumentUrls);
                                // Only set if we got a valid object back
                                if (refreshedDocs && typeof refreshedDocs === 'object') {
                                    setValue('draftDocumentUrls', refreshedDocs as typeof parsedData.draftDocumentUrls, { shouldDirty: false });
                                    logger.debug('[Draft] Document URLs refreshed:', refreshedDocs);
                                }
                            }
                        } catch (refreshErr) {
                            logger.error('[Draft] URL refresh error:', refreshErr);
                            // Don't fail the load, just log the error
                        }
                    }
                    setIsLoaded(true);
                }
            } catch (err) {
                logger.error('[Draft] Unexpected fetch error:', err);
                toast.error("Connection error. Auto-save is disabled.");
                // Still set isLoaded to true to allow the app to function
                setIsLoaded(true);
            }
        };

        fetchDraft();
    }, [userId, reset, setValue, getValues]);

    // Save Draft Debounced
    useEffect(() => {
        if (!userId || !isLoaded) return;

        // Optimization: Don't save if data hasn't changed since last save
        const currentString = JSON.stringify(formData);
        if (currentString === lastSavedData.current) return;

        // Clear any existing timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            logger.debug('[Draft] Saving change...');
            // logger.debug('Diff:', currentString.length, lastSavedData.current.length);

            try {
                const { error } = await supabase
                    .from(TABLE_NAME)
                    .upsert({
                        user_id: userId,
                        draft_data: formData,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
                lastSavedData.current = currentString;
                logger.debug('[Draft] Saved successfully.');
            } catch (err) {
                logger.error('[Draft] Save Error:', err);
                // Don't toast on every background save error to avoid spam, but log it.
            }
        }, 500); // 500ms Debounce

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [formData, userId, isLoaded]); // Removed isDirty dependency

    const clearDraft = useCallback(async () => {
        if (!userId) return;

        // CRITICAL FIX: Cancel any pending save to prevent resurrection of the draft
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        try {
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq('user_id', userId);

            if (error) throw error;
            logger.log('Draft cleared from Supabase');

            // Mark current state as "saved" (even if empty) to prevent immediate auto-save check from triggering
            lastSavedData.current = JSON.stringify(watch());
        } catch (err) {
            logger.error('Error clearing draft:', err);
        }
    }, [userId, watch]);

    return { clearDraft, isLoaded };
}
