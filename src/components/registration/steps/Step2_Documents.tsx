import React, { useMemo, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';
import { PreviewIcon, CloseIcon } from '@/components/registration/icons/RegistrationIcons';
import { ResetButton } from '../ResetButton';

// Allowed file types
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const CustomFolderIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className={className}>
        <path d="M160-160q-33 0-56.5-23.5T80-240v-400q0-33 23.5-56.5T160-720h240l80-80h320q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm73-280h207v-207L233-440Zm-73-40 160-160H160v160Zm0 120v120h640v-480H520v280q0 33-23.5 56.5T440-360H160Zm280-160Z" />
    </svg>
);

interface Step2Props {
    form: UseFormReturn<RegistrationFormSchema>;
    saveDocument: (key: string, file: File | null) => Promise<void>;
    savePhotos: (photos: File[]) => Promise<void>;
    previewDocument: (type: string, file: File) => void;
    onReset: () => void;
}

export const Step2_Documents: React.FC<Step2Props> = ({
    form,
    saveDocument,
    savePhotos,
    previewDocument,
    onReset
}) => {
    const { watch, setValue, formState: { errors } } = form;

    const documents = watch('documents');
    const propertyPhotos = watch('propertyPhotos') || [];

    const [uploading, setUploading] = React.useState<Record<string, boolean>>({});
    const [dragActive, setDragActive] = React.useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = React.useState<Record<string, boolean>>({});
    const [fileErrors, setFileErrors] = React.useState<Record<string, string>>({});

    // Memoized object URLs for property photos (prevents re-creation on every render)
    const photoUrls = useMemo(() => {
        return propertyPhotos.map(photo => URL.createObjectURL(photo));
    }, [propertyPhotos]);

    // Memory cleanup: revoke object URLs on unmount or when photos change
    useEffect(() => {
        return () => {
            photoUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [photoUrls]);

    // Validate file type
    const validateFileType = useCallback((file: File, allowedTypes: string[]): boolean => {
        return allowedTypes.includes(file.type);
    }, []);

    // Check for duplicate files
    const isDuplicatePhoto = useCallback((file: File): boolean => {
        return propertyPhotos.some(
            photo => photo.name === file.name && photo.size === file.size
        );
    }, [propertyPhotos]);

    // Show success checkmark briefly
    const showSuccessAnimation = useCallback((key: string) => {
        setUploadSuccess(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
            setUploadSuccess(prev => ({ ...prev, [key]: false }));
        }, 1500);
    }, []);

    // Clear file error
    const clearFileError = useCallback((key: string) => {
        setFileErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[key];
            return newErrors;
        });
    }, []);

    const handleFileChange = async (key: keyof RegistrationFormSchema['documents'], file: File | null) => {
        clearFileError(key);

        if (!file) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`documents.${key}` as any, null, { shouldValidate: true });
            await saveDocument(key, null);
            return;
        }

        // Validate file type
        if (!validateFileType(file, ALLOWED_DOC_TYPES)) {
            setFileErrors(prev => ({ ...prev, [key]: 'Only PDF, JPG, and PNG files are allowed' }));
            return;
        }

        setUploading(prev => ({ ...prev, [key]: true }));
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`documents.${key}` as any, file, { shouldValidate: true });
            await saveDocument(key, file);
            showSuccessAnimation(key);
        } finally {
            setUploading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handlePhotoUpload = async (files: FileList | null) => {
        if (!files) return;
        clearFileError('photos');

        const newPhotos: File[] = [];
        const errors: string[] = [];

        Array.from(files).forEach(file => {
            // Validate file type
            if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
                errors.push(`${file.name}: Unsupported format`);
                return;
            }
            // Check for duplicates
            if (isDuplicatePhoto(file)) {
                errors.push(`${file.name}: Already uploaded`);
                return;
            }
            newPhotos.push(file);
        });

        if (errors.length > 0) {
            setFileErrors(prev => ({ ...prev, photos: errors.join(', ') }));
        }

        if (newPhotos.length === 0) return;

        setUploading(prev => ({ ...prev, photos: true }));
        try {
            const updatedPhotos = [...propertyPhotos, ...newPhotos].slice(0, 6);
            setValue('propertyPhotos', updatedPhotos, { shouldValidate: true });
            await savePhotos(updatedPhotos);
            showSuccessAnimation('photos');
        } finally {
            setUploading(prev => ({ ...prev, photos: false }));
        }
    };

    const removePhoto = async (index: number) => {
        const updatedPhotos = propertyPhotos.filter((_, i) => i !== index);
        setValue('propertyPhotos', updatedPhotos, { shouldValidate: true });
        await savePhotos(updatedPhotos);
    };

    // Drag & Drop Handlers
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

    // Render upload status icon
    const renderStatusIcon = (key: string, hasFile: boolean) => {
        if (uploading[key]) {
            return <Loader2 className="w-5 h-5 animate-spin text-black" />;
        }
        if (uploadSuccess[key]) {
            return <Check className="w-5 h-5 text-green-500" />;
        }
        if (!hasFile) {
            return <CustomFolderIcon className="w-5 h-5 text-gray-400" />;
        }
        return null;
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-sans font-normal text-black">Upload documents & photos</h2>
                <ResetButton size="sm" onReset={onReset} mobileIconOnly={true} />
            </div>
            <div className="border-t border-dashed border-gray-300 mb-2"></div>

            <div className="space-y-4 sm:space-y-6">
                <div>
                    <h3 className="text-lg font-sans font-normal text-black mb-2">Docs and ID Photos</h3>
                    <div className="border-t border-dashed border-gray-300 mb-6"></div>

                    <div className="flex flex-col md:flex-row gap-4 items-stretch w-full justify-between overflow-hidden">
                        {/* Deed Doc */}
                        {[{ key: 'saleDeed', label: 'Deed Doc *', accept: '.pdf,.jpg,.jpeg,.png' }].map(({ key, label, accept }) => (
                            <React.Fragment key={key}>
                                <div className="space-y-2 w-full md:flex-1 md:min-w-0">
                                    <label
                                        className="block text-sm font-sans font-medium text-gray-700 mb-2 truncate"
                                        id={`label-${key}`}
                                    >
                                        {label}
                                    </label>
                                    <div
                                        className="relative group"
                                        onDragEnter={(e) => handleDrag(e, key)}
                                        onDragLeave={(e) => handleDrag(e, key)}
                                        onDragOver={(e) => handleDrag(e, key)}
                                        onDrop={(e) => handleDrop(e, key)}
                                    >
                                        <input
                                            type="file"
                                            accept={accept}
                                            onChange={(e) => handleFileChange(key as keyof RegistrationFormSchema['documents'], e.target.files?.[0] || null)}
                                            className="hidden"
                                            id={`file-${key}`}
                                            disabled={uploading[key]}
                                            aria-labelledby={`label-${key}`}
                                            aria-describedby={fileErrors[key] ? `error-${key}` : undefined}
                                        />
                                        <label
                                            htmlFor={`file-${key}`}
                                            className={`flex flex-row items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all duration-200 w-full h-14 relative
                                                ${dragActive === key ? 'border-black ring-1 ring-black' : ''}
                                                ${documents?.[key as keyof RegistrationFormSchema['documents']]
                                                    ? 'bg-white border-gray-200 shadow-sm hover:border-black pr-24'
                                                    : 'bg-white border-gray-200 hover:border-black hover:bg-gray-50'
                                                } 
                                                ${(errors.documents?.[key as keyof RegistrationFormSchema['documents']] || fileErrors[key]) ? 'border-red-300 bg-red-50' : ''}`
                                            }
                                            role="button"
                                            aria-label={`Upload ${label}`}
                                            tabIndex={0}
                                        >
                                            <div className="shrink-0 flex items-center justify-center text-gray-400">
                                                {renderStatusIcon(key, !!documents?.[key as keyof RegistrationFormSchema['documents']])}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <span className={`block text-sm truncate ${documents?.[key as keyof RegistrationFormSchema['documents']] ? 'text-gray-900 font-medium' : 'text-gray-500 font-sans'}`}>
                                                    {(() => {
                                                        const file = documents?.[key as keyof RegistrationFormSchema['documents']];
                                                        if (uploading[key]) return 'Uploading...';
                                                        if (!file) return 'Click to upload';
                                                        return file.name;
                                                    })()}
                                                </span>
                                            </div>
                                        </label>
                                        {documents?.[key as keyof RegistrationFormSchema['documents']] && !uploading[key] && (
                                            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        const file = documents[key as keyof RegistrationFormSchema['documents']];
                                                        if (file) previewDocument(key, file);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Preview"
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
                                                    title="Remove"
                                                    type="button"
                                                    aria-label={`Remove ${label}`}
                                                >
                                                    <CloseIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {/* File type error */}
                                    {fileErrors[key] && (
                                        <p className="text-xs text-red-500 flex items-center gap-1" id={`error-${key}`} role="alert">
                                            <AlertCircle size={12} />
                                            {fileErrors[key]}
                                        </p>
                                    )}
                                    {/* Validation error */}
                                    {errors.documents?.[key as keyof RegistrationFormSchema['documents']] && (
                                        <p className="text-xs text-red-500 flex items-center gap-1" role="alert">
                                            <AlertCircle size={12} />
                                            {errors.documents[key as keyof RegistrationFormSchema['documents']]?.message}
                                        </p>
                                    )}
                                </div>
                                <div className="hidden md:block w-px border-r border-dashed border-gray-300 h-16 self-center"></div>
                            </React.Fragment>
                        ))}

                        {/* Seller and Buyer */}
                        <div className="flex flex-col md:flex-row gap-4 w-full md:flex-1 md:contents">
                            {[
                                { key: 'khata', label: 'Seller Aadhar ID *', accept: '.pdf,.jpg,.jpeg,.png' },
                                { key: 'taxReceipt', label: 'Buyer Aadhar ID *', accept: '.pdf,.jpg,.jpeg,.png' },
                            ].map(({ key, label, accept }, index) => (
                                <React.Fragment key={key}>
                                    <div className="space-y-2 w-full md:flex-1 md:min-w-0">
                                        <label
                                            className="block text-sm font-sans font-medium text-gray-700 mb-2 truncate"
                                            id={`label-${key}`}
                                        >
                                            {label}
                                        </label>
                                        <div
                                            className="relative group"
                                            onDragEnter={(e) => handleDrag(e, key)}
                                            onDragLeave={(e) => handleDrag(e, key)}
                                            onDragOver={(e) => handleDrag(e, key)}
                                            onDrop={(e) => handleDrop(e, key)}
                                        >
                                            <input
                                                type="file"
                                                accept={accept}
                                                onChange={(e) => handleFileChange(key as keyof RegistrationFormSchema['documents'], e.target.files?.[0] || null)}
                                                className="hidden"
                                                id={`file-${key}`}
                                                disabled={uploading[key]}
                                                aria-labelledby={`label-${key}`}
                                                aria-describedby={fileErrors[key] ? `error-${key}` : undefined}
                                            />
                                            <label
                                                htmlFor={`file-${key}`}
                                                className={`flex flex-row items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all duration-200 w-full h-14 relative
                                                    ${dragActive === key ? 'border-black ring-1 ring-black' : ''}
                                                    ${documents?.[key as keyof RegistrationFormSchema['documents']]
                                                        ? 'bg-white border-gray-200 shadow-sm hover:border-black pr-24'
                                                        : 'bg-white border-gray-200 hover:border-black hover:bg-gray-50'
                                                    } 
                                                    ${(errors.documents?.[key as keyof RegistrationFormSchema['documents']] || fileErrors[key]) ? 'border-red-300 bg-red-50' : ''}`
                                                }
                                                role="button"
                                                aria-label={`Upload ${label}`}
                                                tabIndex={0}
                                            >
                                                <div className="shrink-0 flex items-center justify-center text-gray-400">
                                                    {renderStatusIcon(key, !!documents?.[key as keyof RegistrationFormSchema['documents']])}
                                                </div>
                                                <div className="flex-1 min-w-0 text-left">
                                                    <span className={`block text-sm truncate ${documents?.[key as keyof RegistrationFormSchema['documents']] ? 'text-gray-900 font-medium' : 'text-gray-500 font-sans'}`}>
                                                        {(() => {
                                                            const file = documents?.[key as keyof RegistrationFormSchema['documents']];
                                                            if (uploading[key]) return 'Uploading...';
                                                            if (!file) return 'Click to upload';
                                                            return file.name;
                                                        })()}
                                                    </span>
                                                </div>
                                            </label>
                                            {documents?.[key as keyof RegistrationFormSchema['documents']] && !uploading[key] && (
                                                <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            const file = documents[key as keyof RegistrationFormSchema['documents']];
                                                            if (file) previewDocument(key, file);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Preview"
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
                                                        title="Remove"
                                                        type="button"
                                                        aria-label={`Remove ${label}`}
                                                    >
                                                        <CloseIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {/* File type error */}
                                        {fileErrors[key] && (
                                            <p className="text-xs text-red-500 flex items-center gap-1" id={`error-${key}`} role="alert">
                                                <AlertCircle size={12} />
                                                {fileErrors[key]}
                                            </p>
                                        )}
                                        {/* Validation error */}
                                        {errors.documents?.[key as keyof RegistrationFormSchema['documents']] && (
                                            <p className="text-xs text-red-500 flex items-center gap-1" role="alert">
                                                <AlertCircle size={12} />
                                                {errors.documents[key as keyof RegistrationFormSchema['documents']]?.message}
                                            </p>
                                        )}
                                    </div>
                                    {index === 0 && (
                                        <div className="hidden md:block w-px border-r border-dashed border-gray-300 h-16 self-center"></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-dashed border-gray-300 mt-4 sm:mt-6 mb-2"></div>

                <div>
                    <h3 className="text-lg font-sans font-normal text-black mb-2">Property photos</h3>
                    <div className="border-t border-dashed border-gray-300 mb-6"></div>
                    <p className="text-sm font-sans font-medium text-gray-700 mb-2">
                        Upload up to 6 photos of the property <span className="text-gray-500 font-normal">(Optional)</span>
                    </p>

                    <div
                        className="mb-4"
                        onDragEnter={(e) => handleDrag(e, 'photos')}
                        onDragLeave={(e) => handleDrag(e, 'photos')}
                        onDragOver={(e) => handleDrag(e, 'photos')}
                        onDrop={(e) => handleDrop(e, 'photos')}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handlePhotoUpload(e.target.files)}
                            className="hidden"
                            id="property-photos"
                            disabled={uploading.photos || propertyPhotos.length >= 6}
                            aria-label="Upload property photos"
                            aria-describedby={fileErrors.photos ? 'error-photos' : undefined}
                        />
                        <label
                            htmlFor="property-photos"
                            className={`flex items-center justify-center gap-2 p-3 bg-white border rounded-lg cursor-pointer hover:border-black hover:bg-gray-50 transition-all text-center w-full max-w-lg mx-auto h-14
                                ${dragActive === 'photos' ? 'border-black ring-1 ring-black' : 'border-gray-200'}
                                ${propertyPhotos.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            role="button"
                            aria-label="Upload property photos"
                            tabIndex={0}
                        >
                            <div className="shrink-0 text-gray-400">
                                {renderStatusIcon('photos', false)}
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-sans text-gray-500">
                                    {uploading.photos ? 'Processing...' : propertyPhotos.length >= 6 ? 'Maximum 6 photos reached' : 'Click to upload'}
                                </span>
                            </div>
                        </label>
                        {/* File type/duplicate error */}
                        {fileErrors.photos && (
                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1 justify-center" id="error-photos" role="alert">
                                <AlertCircle size={12} />
                                {fileErrors.photos}
                            </p>
                        )}
                        {errors.propertyPhotos && (
                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1 justify-center" role="alert">
                                <AlertCircle size={12} />
                                {errors.propertyPhotos.message}
                            </p>
                        )}
                    </div>

                    {propertyPhotos.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            {propertyPhotos.map((photo, index) => {
                                const name = photo.name;
                                const lastDot = name.lastIndexOf('.');
                                const ext = lastDot !== -1 ? name.substring(lastDot) : '';
                                const base = lastDot !== -1 ? name.substring(0, lastDot) : name;
                                const displayName = base.length > 12 ? base.substring(0, 12) + '...' + ext : name;

                                return (
                                    <div key={index} className="relative group">
                                        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-lg pr-20 transition-all hover:border-black h-14">
                                            <span className="text-sm text-gray-900 font-medium truncate flex-1" title={name}>
                                                {displayName}
                                            </span>
                                        </div>
                                        <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                onClick={() => previewDocument(`photo_${index}`, photo)}
                                                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Preview"
                                                type="button"
                                                aria-label={`Preview photo ${index + 1}`}
                                            >
                                                <PreviewIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => removePhoto(index)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove"
                                                type="button"
                                                aria-label={`Remove photo ${index + 1}`}
                                            >
                                                <CloseIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-4 sm:my-6"></div>

            <div className="flex justify-center items-center">
                <span className="text-gray-700 text-sm font-sans">2</span>
            </div>
        </div>
    );
};
