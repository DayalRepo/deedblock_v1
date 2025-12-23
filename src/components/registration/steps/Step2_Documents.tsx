import React from 'react';
import { AlertCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';
import { UploadIcon, PreviewIcon, CloseIcon } from '@/components/registration/icons/RegistrationIcons';
import { ResetButton } from '../ResetButton';

interface Step2Props {
    form: UseFormReturn<RegistrationFormSchema>;
    saveDocument: (key: string, file: File | null) => Promise<void>;
    savePhotos: (photos: File[]) => Promise<void>; // actually hook had photos: File[]
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
    const { register, watch, setValue, formState: { errors } } = form;

    const documents = watch('documents');
    const propertyPhotos = watch('propertyPhotos') || [];


    const handleFileChange = async (key: keyof RegistrationFormSchema['documents'], file: File | null) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(`documents.${key}` as any, file, { shouldValidate: true });
        await saveDocument(key, file);
    };

    const handlePhotoUpload = async (files: FileList | null) => {
        if (!files) return;
        const newPhotos = Array.from(files);
        const updatedPhotos = [...propertyPhotos, ...newPhotos].slice(0, 6);
        setValue('propertyPhotos', updatedPhotos, { shouldValidate: true });
        await savePhotos(updatedPhotos);
    };

    const removePhoto = async (index: number) => {
        const updatedPhotos = propertyPhotos.filter((_, i) => i !== index);
        setValue('propertyPhotos', updatedPhotos, { shouldValidate: true });
        await savePhotos(updatedPhotos);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-sans font-normal text-black">Upload documents & photos</h2>
                <ResetButton size="sm" onReset={onReset} />
            </div>
            <div className="border-t border-dashed border-gray-300 mb-2"></div>

            <div className="space-y-4 sm:space-y-6">
                <div>
                    <h3 className="text-lg font-sans font-normal text-black mb-2">Docs and ID Photos</h3>
                    <div className="border-t border-dashed border-gray-300 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        {[
                            { key: 'saleDeed', label: 'Deed Doc *', accept: '.pdf,.jpg,.jpeg,.png' },
                            { key: 'khata', label: 'Seller Aadhar ID *', accept: '.pdf,.jpg,.jpeg,.png' },
                            { key: 'taxReceipt', label: 'Buyer Aadhar ID *', accept: '.pdf,.jpg,.jpeg,.png' },
                        ].map(({ key, label, accept }) => (
                            <div key={key} className="space-y-2">
                                <label className="block text-sm font-sans font-medium text-gray-700 mb-2">{label}</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept={accept}
                                        onChange={(e) => handleFileChange(key as keyof RegistrationFormSchema['documents'], e.target.files?.[0] || null)}
                                        className="hidden"
                                        id={`file-${key}`}
                                    />
                                    <label
                                        htmlFor={`file-${key}`}
                                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200 
                                            ${documents?.[key as keyof RegistrationFormSchema['documents']]
                                                ? 'bg-white border-gray-200 shadow-sm hover:border-black pr-20'
                                                : 'bg-gray-50 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                                            } 
                                            ${errors.documents?.[key as keyof RegistrationFormSchema['documents']] ? 'border-red-300 bg-red-50' : ''}`
                                        }
                                    >
                                        <div className={`p-2 rounded-lg ${documents?.[key as keyof RegistrationFormSchema['documents']] ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            <UploadIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={`block text-sm truncate ${documents?.[key as keyof RegistrationFormSchema['documents']] ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                {(() => {
                                                    const file = documents?.[key as keyof RegistrationFormSchema['documents']];
                                                    if (!file) return 'Click to upload';
                                                    const name = file.name;
                                                    const lastDot = name.lastIndexOf('.');
                                                    const ext = lastDot !== -1 ? name.substring(lastDot) : '';
                                                    const base = lastDot !== -1 ? name.substring(0, lastDot) : name;
                                                    return name.length > 20 ? base.substring(0, 15) + '...' + ext : name;
                                                })()}
                                            </span>
                                            {!documents?.[key as keyof RegistrationFormSchema['documents']] && (
                                                <span className="text-xs text-gray-400 block mt-0.5">PDF, JPG, PNG (Max 5MB)</span>
                                            )}
                                        </div>
                                    </label>

                                    {documents?.[key as keyof RegistrationFormSchema['documents']] && (
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
                                            >
                                                <CloseIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {errors.documents?.[key as keyof RegistrationFormSchema['documents']] && (
                                    <p className="text-sm text-red-500 flex items-center gap-1 font-medium">
                                        <AlertCircle size={14} />
                                        {errors.documents[key as keyof RegistrationFormSchema['documents']]?.message}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-dashed border-gray-300 mt-4 sm:mt-6 mb-2"></div>

                <div>
                    <h3 className="text-lg font-sans font-normal text-black mb-2">Property photos</h3>
                    <div className="border-t border-dashed border-gray-300 mb-6"></div>
                    <p className="text-sm font-sans font-normal text-gray-700 mb-2">Upload up to 6 photos of the property <span className="text-gray-500">(Optional)</span></p>

                    <div className="mb-4">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handlePhotoUpload(e.target.files)}
                            className="hidden"
                            id="property-photos"
                        />
                        <label
                            htmlFor="property-photos"
                            className="flex flex-col items-center justify-center gap-3 p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-black hover:bg-gray-100 transition-all text-center"
                        >
                            <div className="p-3 bg-gray-200 text-gray-600 rounded-full">
                                <UploadIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-gray-900">Click to upload photos</span>
                                <span className="block text-xs text-gray-500 mt-1">Accepts JPG, PNG (Max 6 photos)</span>
                            </div>
                        </label>
                        {/* Error for max photos or size could be shown here if in errors */}
                        {errors.propertyPhotos && (
                            <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
                                <AlertCircle size={14} />
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
                                        <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 shadow-sm rounded-xl pr-20 transition-all hover:border-black">
                                            <div className="p-2 bg-black text-white rounded-lg">
                                                <UploadIcon className="w-4 h-4" />
                                            </div>
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
                                            >
                                                <PreviewIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => removePhoto(index)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove"
                                                type="button"
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
