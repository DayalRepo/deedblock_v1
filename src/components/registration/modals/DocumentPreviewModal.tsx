import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';

// Custom close icon matching project design
const CloseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className={className}>
        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
    </svg>
);

interface DocumentPreviewModalProps {
    file: File | null;
    fileUrl: string | null;
    fileName?: string | null;
    showPropertyPhotos: boolean;
    propertyPhotos: File[];
    propertyPhotoUrls: Map<number, string>;
    draftPhotoUrls?: Array<{ url: string; path: string; name: string }>;
    onClose: () => void;
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
    file,
    fileUrl,
    fileName,
    showPropertyPhotos,
    propertyPhotos,
    propertyPhotoUrls,
    draftPhotoUrls = [],
    onClose
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(false);
    }, [file, currentIndex]);

    useEffect(() => {
        if (showPropertyPhotos) {
            setCurrentIndex(0);
        }
    }, [showPropertyPhotos]);

    const currentPhoto = showPropertyPhotos ? propertyPhotos[currentIndex] : null;
    // Use draftPhotoUrls length if propertyPhotos are empty objects (hydrated from draft)
    const totalPhotos = propertyPhotos.filter(p => p instanceof File).length || draftPhotoUrls.length;

    const currentFile = showPropertyPhotos ? currentPhoto : file;

    // Build current URL with fallback chain: propertyPhotoUrls -> draftPhotoUrls -> createObjectURL
    const getCurrentPhotoUrl = () => {
        if (!showPropertyPhotos) return fileUrl;

        // Try propertyPhotoUrls first (from parent state)
        const mapUrl = propertyPhotoUrls.get(currentIndex);
        if (mapUrl) return mapUrl;

        // Try draftPhotoUrls (from Supabase Storage)
        if (draftPhotoUrls[currentIndex]?.url) return draftPhotoUrls[currentIndex].url;

        // Try creating from File object
        if (currentPhoto instanceof File) return URL.createObjectURL(currentPhoto);

        return null;
    };

    const currentUrl = getCurrentPhotoUrl();

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showPropertyPhotos && totalPhotos > 1) {
                if (e.key === 'ArrowLeft') goToPrevious();
                if (e.key === 'ArrowRight') goToNext();
            }
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPropertyPhotos, totalPhotos, onClose]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex flex-col bg-white"
                onClick={onClose}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-dashed border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-sans font-normal text-black truncate">
                                {currentFile?.name || fileName || draftPhotoUrls[currentIndex]?.name || 'Document Preview'}
                            </h2>
                            <p className="text-xs text-gray-400">
                                {currentFile instanceof File ? formatFileSize(currentFile.size) : ''}
                                {showPropertyPhotos && totalPhotos > 1 && (
                                    <span className={currentFile instanceof File ? "ml-2" : ""}>
                                        {currentFile instanceof File ? '• ' : ''}Photo {currentIndex + 1} of {totalPhotos}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close preview"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Content */}
                <div
                    className="flex-1 flex items-center justify-center relative overflow-hidden px-4 sm:px-12 py-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Navigation - Previous */}
                    {showPropertyPhotos && totalPhotos > 1 && (
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Previous photo"
                        >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    )}

                    {/* Content Display */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={showPropertyPhotos ? currentIndex : 'single'}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            {currentUrl ? (() => {
                                // Determine if we should show as image
                                const isFileImage = currentFile instanceof File && currentFile.type.startsWith('image/');
                                const isFilePdf = currentFile instanceof File && currentFile.type === 'application/pdf';

                                // Check if URL is an image (for hydrated documents/photos without File object)
                                const urlLower = currentUrl.toLowerCase();
                                const isUrlImage = urlLower.includes('.png') || urlLower.includes('.jpg') ||
                                    urlLower.includes('.jpeg') || urlLower.includes('.gif') ||
                                    urlLower.includes('.webp');
                                const isUrlPdf = urlLower.includes('.pdf');

                                // Has URL without valid File (hydrated from draft)
                                const isHydratedPreview = !(currentFile instanceof File) && currentUrl;

                                // Show image if: File is image OR (hydrated and URL is image)
                                if (isFileImage || (isHydratedPreview && isUrlImage)) {
                                    return (
                                        <img
                                            src={currentUrl}
                                            alt="Preview"
                                            className={`max-w-full max-h-[65vh] sm:max-h-[72vh] object-contain transition-opacity duration-200 rounded-lg border border-gray-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                            onLoad={() => setIsLoaded(true)}
                                        />
                                    );
                                }

                                // Show PDF iframe if: File is PDF OR (hydrated and URL is PDF)
                                if (isFilePdf || (isHydratedPreview && isUrlPdf)) {
                                    return (
                                        <div className="w-full max-w-3xl h-[65vh] sm:h-[72vh] bg-white rounded-lg border border-gray-200 overflow-hidden relative">
                                            {/* Desktop: standard iframe */}
                                            <iframe
                                                src={currentUrl}
                                                title="PDF Preview"
                                                className="hidden sm:block w-full h-full"
                                            />
                                            
                                            {/* Mobile: Special handling */}
                                            <div className="sm:hidden w-full h-full">
                                                {!currentUrl.startsWith('blob:') ? (
                                                    // Remote URL (hydrated): Use Google Docs Viewer for better mobile inline support
                                                    <iframe 
                                                        src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(currentUrl)}`}
                                                        className="w-full h-full" 
                                                        title="PDF Preview (Mobile)"
                                                        frameBorder="0"
                                                    />
                                                ) : (
                                                    // Fresh upload (blob): Fallback to standard iframe (best browser support for local blobs)
                                                    <iframe
                                                        src={currentUrl}
                                                        className="w-full h-full"
                                                        title="PDF Preview"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                }

                                // Fallback: unknown file type
                                return (
                                    <div className="text-center text-gray-400 py-12">
                                        <FileText size={40} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-xs sm:text-sm">Preview not available for this file type</p>
                                    </div>
                                );
                            })() : (
                                <p className="text-gray-400 text-xs sm:text-sm">No file to preview</p>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation - Next */}
                    {showPropertyPhotos && totalPhotos > 1 && (
                        <button
                            onClick={goToNext}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Next photo"
                        >
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    )}
                </div>

                {/* Footer - Thumbnail Strip for Multiple Photos */}
                {showPropertyPhotos && totalPhotos > 1 && (
                    <div
                        className="px-4 py-3 sm:py-4 border-t border-dashed border-gray-300 overflow-x-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex gap-2 justify-center">
                            {Array.from({ length: totalPhotos }).map((_, i) => {
                                // Get thumbnail URL with fallback
                                const thumbUrl = propertyPhotoUrls.get(i)
                                    || draftPhotoUrls[i]?.url
                                    || (propertyPhotos[i] instanceof File ? URL.createObjectURL(propertyPhotos[i]) : null);

                                if (!thumbUrl) return null;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentIndex(i)}
                                        className={`relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden transition-all border
                                            ${i === currentIndex
                                                ? 'border-black ring-1 ring-black opacity-100'
                                                : 'border-gray-200 opacity-50 hover:opacity-80 hover:border-gray-400'
                                            }`}
                                    >
                                        <img
                                            src={thumbUrl}
                                            alt={`Thumbnail ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer - Single File Close Button */}
                {!showPropertyPhotos && (
                    <div
                        className="px-4 py-3 sm:py-4 border-t border-dashed border-gray-300 flex justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs sm:text-sm font-medium"
                        >
                            Close Preview
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
