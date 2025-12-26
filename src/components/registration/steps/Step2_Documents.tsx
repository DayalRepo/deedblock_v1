import React, { useMemo, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';
import { PreviewIcon, CloseIcon } from '@/components/registration/icons/RegistrationIcons';
import { ResetButton } from '../ResetButton';
import { uploadDraftFile, deleteDraftFile } from '@/lib/supabase/supabaseStorage';

// Allowed file types
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CustomFolderIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className={className}>
        <path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
    </svg>
);

interface ErrorFlasherProps {
    error?: any;
    children: React.ReactElement<{ className?: string }>;
}

const ErrorFlasher: React.FC<ErrorFlasherProps> = ({ error, children }) => {
    const [flash, setFlash] = React.useState(false);

    React.useEffect(() => {
        if (error) {
            setFlash(true);
            const timer = setTimeout(() => setFlash(false), 3000);
            return () => clearTimeout(timer);
        } else {
            setFlash(false);
        }
    }, [error]);

    const errorClass = flash ? "ring-2 ring-red-400 bg-red-50 border-red-500 rounded-lg transition-all duration-300" : "";

    return React.cloneElement(children, {
        className: `${children.props.className || ''} ${errorClass}`.trim()
    });
};

interface Step2Props {
    form: UseFormReturn<RegistrationFormSchema>;
    userId: string | undefined;
    saveDocument: (key: string, file: File | null) => Promise<void>;
    savePhotos: (photos: File[]) => Promise<void>;
    previewDocument: (type: string, file?: File | null) => void;
    onPreviewDocumentUrl?: (type: string, url: string, name: string) => void;
    onPreviewPhotos?: (startIndex?: number) => void;
    onReset: () => void;
}

export const Step2_Documents: React.FC<Step2Props> = ({
    form,
    userId,
    saveDocument,
    savePhotos,
    previewDocument,
    onPreviewDocumentUrl,
    onPreviewPhotos,
    onReset
}) => {
    const { watch, setValue, formState: { errors } } = form;

    const documents = watch('documents');
    const propertyPhotos = watch('propertyPhotos') || [];
    const draftDocumentUrls = watch('draftDocumentUrls');
    const draftPhotoUrls = watch('draftPhotoUrls') || [];

    // Filter valid File objects and count from draftPhotoUrls for hydrated state
    const validFilePhotos = propertyPhotos.filter(p => p instanceof File);
    const displayPhotoCount = Math.max(validFilePhotos.length, draftPhotoUrls.length);

    const [uploading, setUploading] = React.useState<Record<string, boolean>>({});
    const [dragActive, setDragActive] = React.useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = React.useState<Record<string, boolean>>({});
    const [fileErrors, setFileErrors] = React.useState<Record<string, string>>({});

    // Memoized object URLs
    const photoUrls = useMemo(() => {
        return propertyPhotos
            .filter(photo => photo instanceof File)
            .map(photo => URL.createObjectURL(photo));
    }, [propertyPhotos]);

    // Memory cleanup
    useEffect(() => {
        return () => {
            photoUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [photoUrls]);

    const validateFileType = useCallback((file: File, allowedTypes: string[]): boolean => {
        return allowedTypes.includes(file.type);
    }, []);

    const validateFileSize = useCallback((file: File): boolean => {
        return file.size <= MAX_FILE_SIZE;
    }, []);

    const formatFileSize = useCallback((bytes: number): string => {
        return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
    }, []);

    const isDuplicatePhoto = useCallback((file: File): boolean => {
        return propertyPhotos.some(
            photo => photo.name === file.name && photo.size === file.size
        );
    }, [propertyPhotos]);

    const showSuccessAnimation = useCallback((key: string) => {
        setUploadSuccess(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
            setUploadSuccess(prev => ({ ...prev, [key]: false }));
        }, 1500);
    }, []);

    const clearFileError = useCallback((key: string) => {
        setFileErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[key];
            return newErrors;
        });
    }, []);

    // Show error message and auto-clear after 3 seconds
    const showFileError = useCallback((key: string, message: string) => {
        setFileErrors(prev => ({ ...prev, [key]: message }));
        setTimeout(() => {
            clearFileError(key);
        }, 3000); // 3 seconds
    }, [clearFileError]);

    const handleFileChange = async (key: keyof RegistrationFormSchema['documents'], file: File | null) => {
        clearFileError(key);

        if (!file) {
            // Delete from Supabase Storage if exists
            const existingUrl = draftDocumentUrls?.[key];
            if (existingUrl?.path) {
                try {
                    await deleteDraftFile(existingUrl.path);
                } catch (err) {
                    console.error('[Storage] Delete error:', err);
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`documents.${key}` as any, null, { shouldValidate: true });
            setValue(`draftDocumentUrls.${key}` as any, null, { shouldDirty: true });
            await saveDocument(key, null);
            return;
        }

        if (!validateFileType(file, ALLOWED_DOC_TYPES)) {
            showFileError(key, 'Only PDF, JPG, and PNG files are allowed');
            return;
        }

        if (!validateFileSize(file)) {
            showFileError(key, `File size (${formatFileSize(file.size)}) exceeds 5MB limit`);
            return;
        }

        setUploading(prev => ({ ...prev, [key]: true }));
        try {
            // Set file locally for immediate use
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`documents.${key}` as any, file, { shouldValidate: true });

            // Upload to Supabase Storage for draft persistence
            if (userId) {
                try {
                    const { url, path } = await uploadDraftFile(file, userId, 'documents', key);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setValue(`draftDocumentUrls.${key}` as any, { url, path }, { shouldDirty: true });
                } catch (err) {
                    console.error('[Storage] Upload error:', err);
                    // Continue anyway - file is set locally
                }
            }

            await saveDocument(key, file);
            showSuccessAnimation(key);
        } finally {
            setUploading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handlePhotoUpload = async (files: FileList | null) => {
        if (!files) return;
        clearFileError('photos');

        // Check if adding these photos would exceed the 6 photo limit
        // Use Math.max because propertyPhotos (File objects) and draftPhotoUrls represent the SAME photos
        // - Fresh upload: propertyPhotos has Files, draftPhotoUrls has URLs for same photos
        // - After refresh: propertyPhotos has empty {}, draftPhotoUrls has URLs
        const validFileCount = propertyPhotos.filter(p => p instanceof File).length;
        const draftUrlCount = draftPhotoUrls?.length || 0;
        const currentPhotoCount = Math.max(validFileCount, draftUrlCount);
        const remainingSlots = 6 - currentPhotoCount;

        if (remainingSlots <= 0) {
            showFileError('photos', 'Maximum 6 photos allowed. Remove some photos to add new ones.');
            return;
        }

        const newPhotos: File[] = [];
        const errors: string[] = [];

        // Only process files up to remaining slots
        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        const excessFiles = files.length - remainingSlots;

        if (excessFiles > 0) {
            errors.push(`Maximum 6 photos allowed. ${excessFiles} photo(s) were not added.`);
        }

        filesToProcess.forEach(file => {
            if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
                errors.push(`${file.name}: Unsupported format`);
                return;
            }
            if (!validateFileSize(file)) {
                errors.push(`${file.name}: Exceeds 5MB limit (${formatFileSize(file.size)})`);
                return;
            }
            if (isDuplicatePhoto(file)) {
                errors.push(`${file.name}: Already uploaded`);
                return;
            }
            newPhotos.push(file);
        });

        if (errors.length > 0) {
            showFileError('photos', errors.join(', '));
        }

        if (newPhotos.length === 0) return;

        setUploading(prev => ({ ...prev, photos: true }));
        try {
            const updatedPhotos = [...propertyPhotos, ...newPhotos].slice(0, 6);
            setValue('propertyPhotos', updatedPhotos, { shouldValidate: true });

            // Upload new photos to Supabase Storage
            if (userId) {
                const currentUrls = watch('draftPhotoUrls') || [];
                const newUrls = [...currentUrls];

                for (let i = 0; i < newPhotos.length && currentUrls.length + i < 6; i++) {
                    const photo = newPhotos[i];
                    try {
                        const { url, path } = await uploadDraftFile(photo, userId, 'photos', `photo_${Date.now()}_${i}`);
                        newUrls.push({ url, path, name: photo.name });
                    } catch (err) {
                        console.error('[Storage] Photo upload error:', err);
                    }
                }

                setValue('draftPhotoUrls', newUrls, { shouldDirty: true });
            }

            await savePhotos(updatedPhotos);
            showSuccessAnimation('photos');
        } finally {
            setUploading(prev => ({ ...prev, photos: false }));
        }
    };

    const removePhoto = async (index: number) => {
        // Delete from Supabase Storage
        const currentUrls = watch('draftPhotoUrls') || [];
        if (currentUrls[index]?.path) {
            try {
                await deleteDraftFile(currentUrls[index].path);
            } catch (err) {
                console.error('[Storage] Photo delete error:', err);
            }
        }

        // Update form state
        const updatedPhotos = propertyPhotos.filter((_, i) => i !== index);
        const updatedUrls = currentUrls.filter((_, i) => i !== index);

        setValue('propertyPhotos', updatedPhotos, { shouldValidate: true });
        setValue('draftPhotoUrls', updatedUrls, { shouldDirty: true });
        await savePhotos(updatedPhotos);
    };

    const handleDrag = (e: React.DragEvent, key: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(key);
        } else if (e.type === "dragleave") {
            setDragActive(null);
        }
    };

    const handleDrop = (e: React.DragEvent, key: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(null);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (key === 'photos') {
                handlePhotoUpload(e.dataTransfer.files);
            } else {
                handleFileChange(key as keyof RegistrationFormSchema['documents'], e.dataTransfer.files[0]);
            }
        }
    };

    const renderStatusIcon = (key: string, hasFile: boolean, iconClass: string = "w-4 h-4 sm:w-6 sm:h-6") => {
        if (uploading[key]) {
            return <Loader2 className={`${iconClass} animate-spin text-black`} />;
        }
        if (uploadSuccess[key]) {
            return <Check className={`${iconClass} text-green-500`} />;
        }
        if (!hasFile) {
            return <CustomFolderIcon className={`${iconClass} text-gray-400`} />;
        }
        return null;
    };

    // ... (lines 201-359 omitted) ...

    <label
        htmlFor="property-photos"
        className={`flex items-center justify-center gap-3 px-4 py-8 border border-dashed rounded-lg cursor-pointer transition-all
                            ${dragActive === 'photos' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-300'}
                            ${propertyPhotos.length >= 6 ? 'opacity-50 cursor-not-allowed' : 'hover:border-black hover:bg-gray-50'}`}
    >
        <div className="flex items-center gap-4">
            <div className="text-gray-400">
                {renderStatusIcon('photos', false, "w-8 h-8 sm:w-10 sm:h-10")}
            </div>
            <div className="text-left">
                <p className="text-sm font-normal text-gray-500 mb-0.5">
                    Property Photos
                </p>
                <p className="text-sm font-medium text-gray-700">
                    {uploading.photos ? 'Uploading...' : propertyPhotos.length >= 6 ? 'Maximum 6 photos' : 'JPG, PNG up to 5MB each'}
                </p>
            </div>
        </div>
    </label>

    // Document rows: [Row 1: Deed Doc, EC], [Row 2: Seller ID, Buyer ID]
    const documentRows = [
        [
            { key: 'saleDeed', label: 'Deed Doc', accept: '.pdf,.jpg,.jpeg,.png', required: true },
            { key: 'ec', label: 'EC', accept: '.pdf,.jpg,.jpeg,.png', required: true },
        ],
        [
            { key: 'khata', label: 'Seller Aadhar', accept: '.pdf,.jpg,.jpeg,.png', required: true },
            { key: 'taxReceipt', label: 'Buyer Aadhar', accept: '.pdf,.jpg,.jpeg,.png', required: true },
        ],
    ];

    const renderDocumentUpload = (key: string, label: string, accept: string, required: boolean) => {
        const file = documents?.[key as keyof RegistrationFormSchema['documents']];
        const isValidFile = file instanceof File;
        const draftUrl = draftDocumentUrls?.[key as keyof typeof draftDocumentUrls];
        const hasDocument = isValidFile || !!draftUrl?.url;
        const hasError = errors.documents?.[key as keyof RegistrationFormSchema['documents']] || fileErrors[key];

        // Extract filename from draft path if available
        const getDocumentName = () => {
            if (isValidFile) return file.name;
            if (draftUrl?.path) {
                // Path format: userId/documents/fieldKey_timestamp_filename
                // We want to skip fieldKey and timestamp
                const pathParts = draftUrl.path.split('/');
                const fileName = pathParts[pathParts.length - 1];
                const fileNameParts = fileName.split('_');
                
                // If it follows fieldKey_timestamp_filename format, fileNameParts.length >= 3
                if (fileNameParts.length >= 3) {
                    // Rejoin everything after the second underscore to handle filenames with underscores
                    return fileNameParts.slice(2).join('_');
                }
                return fileName;
            }
            return 'Document uploaded';
        };

        return (
            <div key={key} className="w-full">
                <ErrorFlasher error={hasError ? hasError : undefined}>
                    <div
                        className="relative"
                        onDragEnter={(e) => handleDrag(e, key)}
                        onDragLeave={(e) => handleDrag(e, key)}
                        onDragOver={(e) => handleDrag(e, key)}
                        onDrop={(e) => handleDrop(e, key)}
                    >
                        <input
                            type="file"
                            accept={accept}
                            onChange={(e) => {
                                handleFileChange(key as keyof RegistrationFormSchema['documents'], e.target.files?.[0] || null);
                                // Reset input value to allow re-selecting the same file
                                e.target.value = '';
                            }}
                            className="hidden"
                            id={`file-${key}`}
                            disabled={uploading[key]}
                            aria-label={`Upload ${label}`}
                        />
                        <label
                            htmlFor={`file-${key}`}
                            className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all w-full
                                ${dragActive === key ? 'border-black ring-1 ring-black' : 'border-gray-200'}
                                ${hasDocument ? 'bg-white hover:border-black' : 'bg-white hover:border-black hover:bg-gray-50'}
                                ${hasError ? 'border-red-300 bg-red-50' : ''}`}
                        >
                            <div className="shrink-0 text-gray-400">
                                {renderStatusIcon(key, hasDocument, "w-4 h-4 sm:w-6 sm:h-6")}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm text-gray-500 truncate max-w-[140px] sm:max-w-none">{label}</span>
                                    {required && <span className="text-red-400 text-[10px] sm:text-xs shrink-0">*</span>}
                                </div>
                                {hasDocument && (
                                    <p className="text-xs sm:text-sm font-medium text-black truncate mt-0.5">{getDocumentName()}</p>
                                )}
                                {!hasDocument && !uploading[key] && (
                                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">PDF, JPG, PNG up to 5MB each</p>
                                )}
                                {uploading[key] && (
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Uploading...</p>
                                )}
                            </div>
                            {hasDocument && !uploading[key] && (
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            if (isValidFile) {
                                                previewDocument(key, file);
                                            } else if (draftUrl?.url && onPreviewDocumentUrl) {
                                                // Open in preview modal for hydrated documents
                                                onPreviewDocumentUrl(key, draftUrl.url, getDocumentName());
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                        type="button"
                                        aria-label={`Preview ${label}`}
                                    >
                                        <PreviewIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleFileChange(key as keyof RegistrationFormSchema['documents'], null);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        type="button"
                                        aria-label={`Remove ${label}`}
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </label>
                    </div >
                </ErrorFlasher>
            </div >
        );
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-sans font-normal text-black">Upload Documents</h2>
                <ResetButton size="sm" onReset={onReset} mobileIconOnly={true} />
            </div>
            <div className="border-t border-dashed border-gray-300"></div>

            {/* Required Documents Section */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-4">Required Documents</h3>

                <div className="space-y-4">
                    {documentRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                            {renderDocumentUpload(row[0].key, row[0].label, row[0].accept, row[0].required)}
                            {renderDocumentUpload(row[1].key, row[1].label, row[1].accept, row[1].required)}
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Property Photos Section */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-4">Property Photos</h3>

                <p className="text-sm text-gray-500 mb-4">
                    Upload up to 6 photos of the property <span className="text-gray-400">(Optional)</span>
                </p>

                <ErrorFlasher error={fileErrors.photos || (uploading.photos ? undefined : undefined)}>
                    <div
                        onDragEnter={(e) => handleDrag(e, 'photos')}
                        onDragLeave={(e) => handleDrag(e, 'photos')}
                        onDragOver={(e) => handleDrag(e, 'photos')}
                        onDrop={(e) => handleDrop(e, 'photos')}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                                handlePhotoUpload(e.target.files);
                                // Reset input value to allow re-selecting the same file
                                e.target.value = '';
                            }}
                            className="hidden"
                            id="property-photos"
                            disabled={uploading.photos || propertyPhotos.length >= 6}
                            aria-label="Upload property photos"
                        />
                        <label
                            htmlFor="property-photos"
                            className={`flex items-center justify-center gap-3 px-4 py-4 sm:py-5 border border-dashed rounded-lg cursor-pointer transition-all
                                ${dragActive === 'photos' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-300'}
                                ${displayPhotoCount >= 6 ? 'opacity-50 cursor-not-allowed' : 'hover:border-black hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-gray-400">
                                    {renderStatusIcon('photos', displayPhotoCount > 0, "w-8 h-8 sm:w-10 sm:h-10")}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs sm:text-sm font-normal text-gray-500 mb-0.5">
                                        Property Photos
                                    </p>
                                    <p className="text-xs sm:text-sm font-medium text-gray-400">
                                        {uploading.photos ? 'Uploading...' : displayPhotoCount >= 6 ? 'Maximum 6 photos' : 'JPG, PNG up to 5MB each'}
                                    </p>
                                </div>
                            </div>
                        </label>
                    </div>
                </ErrorFlasher>

                {/* Photo List - Document Style */}
                {displayPhotoCount > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        {/* Always show from draftPhotoUrls (Source of Truth for both hydrated and new photo URLs) */}
                        {draftPhotoUrls.map((photoData, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg bg-white hover:border-black transition-all w-full"
                            >
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs sm:text-sm text-gray-500 truncate max-w-[140px] sm:max-w-none block">
                                        Photo {index + 1}
                                    </span>
                                    <p className="text-xs sm:text-sm font-medium text-black truncate mt-0.5">{photoData.name}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => {
                                            if (onPreviewPhotos) {
                                                onPreviewPhotos(index);
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                        type="button"
                                        aria-label={`Preview photo ${index + 1}`}
                                    >
                                        <PreviewIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => removePhoto(index)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        type="button"
                                        aria-label={`Remove photo ${index + 1}`}
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Step Indicator */}
            <div className="flex justify-center items-center py-2">
                <span className="text-gray-400 text-sm font-sans">Step 2 of 3</span>
            </div>
        </div >
    );
};
