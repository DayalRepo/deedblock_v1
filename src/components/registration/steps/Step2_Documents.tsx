import React, { useMemo, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';
import { PreviewIcon, CloseIcon } from '@/components/registration/icons/RegistrationIcons';
import { ResetButton } from '../ResetButton';

// Allowed file types
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

    // Memoized object URLs
    const photoUrls = useMemo(() => {
        return propertyPhotos.map(photo => URL.createObjectURL(photo));
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

    const handleFileChange = async (key: keyof RegistrationFormSchema['documents'], file: File | null) => {
        clearFileError(key);

        if (!file) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`documents.${key}` as any, null, { shouldValidate: true });
            await saveDocument(key, null);
            return;
        }

        if (!validateFileType(file, ALLOWED_DOC_TYPES)) {
            setFileErrors(prev => ({ ...prev, [key]: 'Only PDF, JPG, and PNG files are allowed' }));
            return;
        }

        if (!validateFileSize(file)) {
            setFileErrors(prev => ({ ...prev, [key]: `File size (${formatFileSize(file.size)}) exceeds 5MB limit` }));
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

    const renderStatusIcon = (key: string, hasFile: boolean) => {
        if (uploading[key]) {
            return <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-black" />;
        }
        if (uploadSuccess[key]) {
            return <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />;
        }
        if (!hasFile) {
            return <CustomFolderIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />;
        }
        return null;
    };

    // Document rows: [Row 1: Deed Doc, EC], [Row 2: Seller ID, Buyer ID]
    const documentRows = [
        [
            { key: 'saleDeed', label: 'Deed Document', accept: '.pdf,.jpg,.jpeg,.png', required: true },
            { key: 'ec', label: 'EC (Encumbrance Certificate)', accept: '.pdf,.jpg,.jpeg,.png', required: true },
        ],
        [
            { key: 'khata', label: 'Seller Aadhar ID', accept: '.pdf,.jpg,.jpeg,.png', required: true },
            { key: 'taxReceipt', label: 'Buyer Aadhar ID', accept: '.pdf,.jpg,.jpeg,.png', required: true },
        ],
    ];

    const renderDocumentUpload = (key: string, label: string, accept: string, required: boolean) => {
        const file = documents?.[key as keyof RegistrationFormSchema['documents']];
        const hasError = errors.documents?.[key as keyof RegistrationFormSchema['documents']] || fileErrors[key];

        return (
            <div key={key}>
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
                        onChange={(e) => handleFileChange(key as keyof RegistrationFormSchema['documents'], e.target.files?.[0] || null)}
                        className="hidden"
                        id={`file-${key}`}
                        disabled={uploading[key]}
                        aria-label={`Upload ${label}`}
                    />
                    <label
                        htmlFor={`file-${key}`}
                        className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all w-full
                            ${dragActive === key ? 'border-black ring-1 ring-black' : 'border-gray-200'}
                            ${file ? 'bg-white hover:border-black' : 'bg-white hover:border-black hover:bg-gray-50'}
                            ${hasError ? 'border-red-300 bg-red-50' : ''}`}
                    >
                        <div className="shrink-0 text-gray-400">
                            {renderStatusIcon(key, !!file)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{label}</span>
                                {required && <span className="text-red-400 text-xs">*</span>}
                            </div>
                            {file && (
                                <p className="text-sm font-medium text-black truncate mt-0.5">{file.name}</p>
                            )}
                            {!file && !uploading[key] && (
                                <p className="text-xs text-gray-400 mt-0.5">Click to upload or drag & drop</p>
                            )}
                            {uploading[key] && (
                                <p className="text-xs text-gray-500 mt-0.5">Uploading...</p>
                            )}
                        </div>
                        {file && !uploading[key] && (
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        previewDocument(key, file);
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
                </div>
                {fileErrors[key] && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle size={12} />
                        {fileErrors[key]}
                    </p>
                )}
                {errors.documents?.[key as keyof RegistrationFormSchema['documents']] && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle size={12} />
                        {errors.documents[key as keyof RegistrationFormSchema['documents']]?.message}
                    </p>
                )}
            </div>
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
                <h3 className="text-lg font-sans font-normal text-black mb-2">Required Documents</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <div className="space-y-3">
                    {documentRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {row.map(({ key, label, accept, required }) =>
                                renderDocumentUpload(key, label, accept, required)
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Property Photos Section */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Property Photos</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <p className="text-sm text-gray-500 mb-4">
                    Upload up to 6 photos of the property <span className="text-gray-400">(Optional)</span>
                </p>

                {/* Upload Area */}
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
                        onChange={(e) => handlePhotoUpload(e.target.files)}
                        className="hidden"
                        id="property-photos"
                        disabled={uploading.photos || propertyPhotos.length >= 6}
                        aria-label="Upload property photos"
                    />
                    <label
                        htmlFor="property-photos"
                        className={`flex items-center justify-center gap-3 px-4 py-4 sm:py-5 border border-dashed rounded-lg cursor-pointer transition-all
                            ${dragActive === 'photos' ? 'border-black bg-gray-50' : 'border-gray-300'}
                            ${propertyPhotos.length >= 6 ? 'opacity-50 cursor-not-allowed' : 'hover:border-black hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="shrink-0 text-gray-400">
                                {renderStatusIcon('photos', false)}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    {uploading.photos ? 'Uploading...' : propertyPhotos.length >= 6 ? 'Maximum 6 photos' : 'Click to upload photos'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, GIF up to 10MB each</p>
                            </div>
                        </div>
                    </label>
                </div>

                {fileErrors.photos && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle size={12} />
                        {fileErrors.photos}
                    </p>
                )}

                {/* Photo Grid */}
                {propertyPhotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                        {propertyPhotos.map((photo, index) => {
                            const name = photo.name;
                            const lastDot = name.lastIndexOf('.');
                            const ext = lastDot !== -1 ? name.substring(lastDot) : '';
                            const base = lastDot !== -1 ? name.substring(0, lastDot) : name;
                            const displayName = base.length > 10 ? base.substring(0, 10) + '...' + ext : name;

                            return (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-black transition-colors group"
                                >
                                    <span className="text-sm text-gray-700 truncate flex-1" title={name}>
                                        {displayName}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => previewDocument(`photo_${index}`, photo)}
                                            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
                                            type="button"
                                            aria-label={`Preview photo ${index + 1}`}
                                        >
                                            <PreviewIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => removePhoto(index)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            type="button"
                                            aria-label={`Remove photo ${index + 1}`}
                                        >
                                            <CloseIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Step Indicator */}
            <div className="flex justify-center items-center">
                <span className="text-gray-500 text-sm font-sans">2</span>
            </div>
        </div>
    );
};
