import { useEffect, useState, useCallback, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';

const TABLE_NAME = 'registration_drafts';

export function useSupabaseDraft(form: UseFormReturn<RegistrationFormSchema>) {
    const { watch, reset, getValues, formState: { isDirty } } = form;
    const formData = watch(); // Watch all fields

    const [isLoaded, setIsLoaded] = useState(false);
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const lastSavedData = useRef<string>('');

    // Listen to Auth State
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data }) => {
            const id = data.session?.user?.id;
            console.log('[Draft] Initial Session User:', id);
            setUserId(id);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const id = session?.user?.id;
            console.log('[Draft] Auth Change User:', id);
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
            console.log('[Draft] Fetching for user:', userId);
            try {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select('draft_data')
                    .eq('user_id', userId)
                    .single();

                if (error) {
                    if (error.code !== 'PGRST116') {
                        console.error('[Draft] Error fetching:', error);
                        // CRITICAL: Do NOT enable loading/saving if we failed to fetch.
                        toast.error("Failed to load draft. Auto-save is disabled.");
                        return;
                    } else {
                        console.log('[Draft] No existing draft found.');
                        // CRITICAL FIX: Initialize lastSaved with current defaults.
                        lastSavedData.current = JSON.stringify(getValues());
                        setIsLoaded(true);
                    }
                } else {
                    if (data?.draft_data) {
                        console.log('[Draft] Restoring data:', data.draft_data);
                        const parsedData = data.draft_data;
                        reset(parsedData);
                        lastSavedData.current = JSON.stringify(parsedData);
                    }
                    setIsLoaded(true);
                }
            } catch (err) {
                console.error('[Draft] Unexpected fetch error:', err);
                toast.error("Connection error. Auto-save is disabled.");
            }
        };

        fetchDraft();
    }, [userId, reset]);

    // Save Draft Debounced
    useEffect(() => {
        if (!userId || !isLoaded) return;

        // Optimization: Don't save if data hasn't changed since last save
        const currentString = JSON.stringify(formData);
        if (currentString === lastSavedData.current) return;

        const timeout = setTimeout(async () => {
            console.log('[Draft] Saving change...');
            // console.log('Diff:', currentString.length, lastSavedData.current.length);

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
                console.log('[Draft] Saved successfully.');
                toast.success("Draft saved", { duration: 1000, id: 'draft-save' });
            } catch (err) {
                console.error('[Draft] Save Error:', err);
                // Don't toast on every background save error to avoid spam, but log it.
            }
        }, 500); // 500ms Debounce

        return () => clearTimeout(timeout);
    }, [formData, userId, isLoaded]); // Removed isDirty dependency

    const clearDraft = useCallback(async () => {
        if (!userId) return;
        try {
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq('user_id', userId);

            if (error) throw error;
            console.log('Draft cleared from Supabase');
            lastSavedData.current = '';
        } catch (err) {
            console.error('Error clearing draft:', err);
        }
    }, [userId]);

    return { clearDraft, isLoaded };
}
