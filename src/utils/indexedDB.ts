import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DeedBlockDB extends DBSchema {
    files: {
        key: [string, string]; // [userId, fileKey]
        value: {
            userId: string;
            key: string;
            file: Blob;
            name: string;
            type: string;
            lastModified: number;
        };
        indexes: { 'by-user': string };
    };
    forms: {
        key: string; // userId
        value: {
            userId: string;
            formData: any;
            updatedAt: number;
        };
    };
}

const DB_NAME = 'deedblock_files_db';
const DB_VERSION = 2; // Incremented version

let dbPromise: Promise<IDBPDatabase<DeedBlockDB>> | null = null;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<DeedBlockDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if (!db.objectStoreNames.contains('files')) {
                    const store = db.createObjectStore('files', { keyPath: ['userId', 'key'] });
                    store.createIndex('by-user', 'userId');
                }
                if (!db.objectStoreNames.contains('forms')) {
                    db.createObjectStore('forms', { keyPath: 'userId' });
                }
            },
        });
    }
    return dbPromise;
};

export const saveFileToindexedDB = async (userId: string, key: string, file: File) => {
    try {
        const db = await getDB();
        await db.put('files', {
            userId,
            key,
            file: file, // IDB can store Blobs/Files directly
            name: file.name,
            type: file.type,
            lastModified: file.lastModified,
        });
    } catch (error) {
        console.error(`Error saving file ${key} to IndexedDB:`, error);
    }
};

export const getFileFromIndexedDB = async (userId: string, key: string): Promise<File | null> => {
    try {
        const db = await getDB();
        const result = await db.get('files', [userId, key]);
        if (result) {
            // Reconstruct File object
            return new File([result.file], result.name, {
                type: result.type,
                lastModified: result.lastModified,
            });
        }
        return null;
    } catch (error) {
        console.error(`Error getting file ${key} from IndexedDB:`, error);
        return null;
    }
};

export const deleteFileFromIndexedDB = async (userId: string, key: string) => {
    try {
        const db = await getDB();
        await db.delete('files', [userId, key]);
    } catch (error) {
        console.error(`Error deleting file ${key} from IndexedDB:`, error);
    }
};

export const clearUserFilesFromIndexedDB = async (userId: string) => {
    try {
        const db = await getDB();
        const tx = db.transaction('files', 'readwrite');
        const index = tx.store.index('by-user');
        let cursor = await index.openCursor(IDBKeyRange.only(userId));

        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }
        await tx.done;
    } catch (error) {
        console.error('Error clearing user files from IndexedDB:', error);
    }
};

// Form Data Functions
export const saveFormDataToIndexedDB = async (userId: string, formData: any) => {
    try {
        const db = await getDB();
        await db.put('forms', {
            userId,
            formData,
            updatedAt: Date.now(),
        });
    } catch (error) {
        console.error('Error saving form data to IndexedDB:', error);
    }
};

export const getFormDataFromIndexedDB = async (userId: string) => {
    try {
        const db = await getDB();
        const result = await db.get('forms', userId);
        return result?.formData || null;
    } catch (error) {
        console.error('Error getting form data from IndexedDB:', error);
        return null;
    }
};

export const deleteFormDataFromIndexedDB = async (userId: string) => {
    try {
        const db = await getDB();
        await db.delete('forms', userId);
    } catch (error) {
        console.error('Error deleting form data from IndexedDB:', error);
    }
};
