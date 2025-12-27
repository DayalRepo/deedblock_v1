import { supabase } from './client';
import { logger } from '@/utils/logger';

const BUCKET_NAME = 'draft-files';

/**
 * Upload a file to Supabase Storage for draft persistence.
 * Files are stored under the user's folder: {userId}/{category}/{filename}
 */
export async function uploadDraftFile(
    file: File,
    userId: string,
    category: 'documents' | 'photos',
    fieldKey: string
): Promise<{ url: string; path: string }> {
    // Create unique filename with timestamp to avoid collisions
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${category}/${fieldKey}_${timestamp}_${sanitizedName}`;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) {
        logger.error('[Storage] Upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get signed URL for accessing the file (valid for 7 days)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 days

    if (signedUrlError || !signedUrlData?.signedUrl) {
        logger.error('[Storage] Signed URL error:', signedUrlError);
        throw new Error('Failed to get signed URL for uploaded file');
    }

    logger.debug(`[Storage] Uploaded: ${filePath}`);
    return {
        url: signedUrlData.signedUrl,
        path: data.path
    };
}

/**
 * Delete a single file from Supabase Storage by its path.
 */
export async function deleteDraftFile(path: string): Promise<void> {
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

    if (error) {
        logger.error('[Storage] Delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
    }

    logger.debug(`[Storage] Deleted: ${path}`);
}

/**
 * Delete all draft files for a user.
 * Called after successful transaction submission.
 */
export async function clearUserDraftFiles(userId: string): Promise<void> {
    try {
        // List all files in user's folder
        const { data: documentFiles, error: docError } = await supabase.storage
            .from(BUCKET_NAME)
            .list(`${userId}/documents`);

        const { data: photoFiles, error: photoError } = await supabase.storage
            .from(BUCKET_NAME)
            .list(`${userId}/photos`);

        if (docError) logger.error('[Storage] List documents error:', docError);
        if (photoError) logger.error('[Storage] List photos error:', photoError);

        const filesToDelete: string[] = [];

        if (documentFiles) {
            filesToDelete.push(...documentFiles.map(f => `${userId}/documents/${f.name}`));
        }
        if (photoFiles) {
            filesToDelete.push(...photoFiles.map(f => `${userId}/photos/${f.name}`));
        }

        if (filesToDelete.length > 0) {
            const { error: deleteError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove(filesToDelete);

            if (deleteError) {
                logger.error('[Storage] Batch delete error:', deleteError);
            } else {
                logger.debug(`[Storage] Cleared ${filesToDelete.length} files for user ${userId}`);
            }
        }
    } catch (err) {
        logger.error('[Storage] Clear user files error:', err);
        // Don't throw - this is cleanup, we don't want to block the main flow
    }
}

/**
 * Download a file from Supabase Storage and return as a File object.
 * Used for hydrating File objects from stored URLs.
 */
export async function downloadDraftFile(path: string, fileName: string): Promise<File | null> {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(path);

        if (error || !data) {
            logger.error('[Storage] Download error:', error);
            return null;
        }

        // Convert Blob to File
        return new File([data], fileName, { type: data.type });
    } catch (err) {
        logger.error('[Storage] Download error:', err);
        return null;
    }
}

/**
 * Refresh a signed URL from the stored path.
 * Signed URLs expire after 7 days, so we need to regenerate them on load.
 */
export async function refreshSignedUrl(path: string): Promise<string | null> {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

        if (error || !data?.signedUrl) {
            // Squelch "Object not found" errors as they are expected when drafts outlive files
            if (error?.message?.includes('Object not found')) {
                // logger.warn('[Storage] File missing for path:', path);
                return null;
            }
            logger.error('[Storage] Refresh signed URL error:', error);
            return null;
        }

        return data.signedUrl;
    } catch (err) {
        logger.error('[Storage] Refresh signed URL error:', err);
        return null;
    }
}

/**
 * Refresh all signed URLs for draftPhotoUrls.
 * Returns updated array with fresh URLs.
 */
export async function refreshDraftPhotoUrls(
    draftPhotoUrls: Array<{ url: string; path: string; name: string }> | null | undefined
): Promise<Array<{ url: string; path: string; name: string }>> {
    // Defensive check for null/undefined/non-array
    if (!draftPhotoUrls || !Array.isArray(draftPhotoUrls) || draftPhotoUrls.length === 0) {
        return [];
    }

    try {
        const refreshed = await Promise.all(
            draftPhotoUrls.map(async (photo) => {
                try {
                    // Skip if photo object is malformed
                    if (!photo || typeof photo !== 'object' || !photo.path) {
                        return null; // Remove malformed
                    }
                    const newUrl = await refreshSignedUrl(photo.path);
                    if (!newUrl) return null; // File missing -> Remove

                    return {
                        ...photo,
                        url: newUrl
                    };
                } catch (err) {
                    // On unexpected error, keep original? Or remove?
                    // Safer to keep original if network blip, but if file gone, remove.
                    // refreshSignedUrl handles the specific 404.
                    return photo;
                }
            })
        );
        // Filter out nulls (removed files)
        return refreshed.filter((p): p is { url: string; path: string; name: string } => !!p);
    } catch (err) {
        logger.error('[Storage] Error in refreshDraftPhotoUrls:', err);
        return draftPhotoUrls; // Return original on error
    }
}

/**
 * Refresh signed URLs for draftDocumentUrls.
 * Returns updated object with fresh URLs.
 */
export async function refreshDraftDocumentUrls(
    draftDocumentUrls: {
        DeedDoc?: { url: string; path: string } | null;
        EC?: { url: string; path: string } | null;
        SellerAadhar?: { url: string; path: string } | null;
        BuyerAadhar?: { url: string; path: string } | null;
    } | null | undefined
): Promise<typeof draftDocumentUrls> {
    // Defensive check for null/undefined
    if (!draftDocumentUrls || typeof draftDocumentUrls !== 'object') {
        return {};
    }

    try {
        const keys = ['DeedDoc', 'EC', 'SellerAadhar', 'BuyerAadhar'] as const;
        const refreshed = { ...draftDocumentUrls };

        await Promise.all(
            keys.map(async (key) => {
                try {
                    const doc = draftDocumentUrls[key];
                    if (doc && typeof doc === 'object' && doc.path) {
                        const newUrl = await refreshSignedUrl(doc.path);
                        if (newUrl) {
                            refreshed[key] = { ...doc, url: newUrl };
                        } else {
                            // File missing -> Set to null to clear it from form
                            refreshed[key] = null;
                        }
                    }
                } catch (err) {
                    logger.error(`[Storage] Error refreshing ${key} URL:`, err);
                    // Keep original on error
                }
            })
        );

        return refreshed;
    } catch (err) {
        logger.error('[Storage] Error in refreshDraftDocumentUrls:', err);
        return draftDocumentUrls; // Return original on error
    }
}
