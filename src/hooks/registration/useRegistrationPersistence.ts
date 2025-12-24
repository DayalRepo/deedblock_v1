import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';

// IndexedDB Helper Functions
const DB_NAME = 'DeedBlockDB';
const DB_VERSION = 1;
const STORE_NAME = 'registration_drafts';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME); // Key is userId
            }
        };

        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
};

export const saveDraftToIndexedDB = async (userId: string, data: Partial<RegistrationFormSchema>) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(data, userId);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error('Error saving draft:', error);
    }
};

export const getDraftFromIndexedDB = async (userId: string): Promise<Partial<RegistrationFormSchema> | null> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(userId);

        return new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    } catch (error) {
        console.error('Error loading draft:', error);
        return null;
    }
};

export const deleteDraftFromIndexedDB = async (userId: string) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(userId);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error('Error deleting draft:', error);
    }
};

// Hook
export function useRegistrationPersistence(
    form: UseFormReturn<RegistrationFormSchema>,
    userId: string | undefined
) {
    const { watch, reset, getValues } = form;
    const formData = watch(); // Watch all fields

    // Auto-Load on Mount (or when userId changes)
    useEffect(() => {
        if (!userId) return;

        const loadData = async () => {
            const savedData = await getDraftFromIndexedDB(userId);
            if (savedData) {
                // Merge saved data with current form values (to keep defaults)
                // Actually, reset() replaces values.
                // We only want to restore Step 1 fields mostly? 
                // User said "store every data including... state, district... all in step 1".
                // So we can restore the whole object if it matches schema.

                // Note: We need to handle deep merge if necessary, but reset() is usually fine.
                // However, we should exclude `documents` and `propertyPhotos` files since IndexedDB can't store File objects directly (easily).
                // Wait, IndexedDB CAN store blobs/files.
                // But `registrationSchema` expects `File` instances.
                // If we store them, we're good.

                // BUT, user asked to "make sure the data need to store in index db... and remove from index db once successfull".
                // I previously created `utils/indexedDB.ts` for files?
                // `clearUserFilesFromIndexedDB` was used in `page.tsx`.
                // Let's rely on that existing utility if it exists for files, or extend this new one.
                // For now, let's restore the JSON fields.

                console.log("Restoring draft for user:", userId);
                // We shouldn't overwrite if form is already dirty? 
                // User expects "if i login and logout the data is to be there".
                // Use reset to populate.
                reset(savedData as RegistrationFormSchema); // Cast if we trust it
            }
        };
        loadData();
    }, [userId, reset]);

    // Auto-Save on Change
    useEffect(() => {
        if (!userId) return;

        const timeout = setTimeout(() => {
            // Filter out File objects if they cause issues, or store them if supported.
            // Structured Clone algorithm used by IndexedDB supports Blob/File.
            // So saving the entire formData should work.
            saveDraftToIndexedDB(userId, formData);
        }, 1000); // 1 sec debounce

        return () => clearTimeout(timeout);
    }, [formData, userId]);

    // Explicit clear function
    const clearPersistedData = async () => {
        if (userId) {
            await deleteDraftFromIndexedDB(userId);
        }
    };

    return { clearPersistedData };
}
