import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';

// Custom close icon matching project design
const CloseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className={className}>
        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
    </svg>
);

// Custom Document SVG Icon
const CustomDocumentIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className={className}>
        <path d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v240h-80v-200H520v-200H240v640h360v80H240Zm638 15L760-183v89h-80v-226h226v80h-90l118 118-56 57Zm-638-95v-640 640Z" />
    </svg>
);

export interface PreviewItem {
    type: 'file' | 'url';
    url: string;
    name: string;
    file?: File; // Optional original file object
    category?: string; // e.g., 'Document', 'Photo'
    mimeType?: string;
}

interface DocumentPreviewModalProps {
    initialIndex: number;
    items: PreviewItem[];
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
    initialIndex = 0,
    items = [],
    onClose
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        setIsLoaded(false);
    }, [currentIndex]);

    const currentItem = items[currentIndex];
    const totalItems = items.length;

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (totalItems > 1) {
                if (e.key === 'ArrowLeft') goToPrevious();
                if (e.key === 'ArrowRight') goToNext();
            }
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalItems, onClose]);

    if (!currentItem) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 sm:p-6" // Backdrop with padding
                onClick={onClose}
            >
                {/* Modal Card - Centered, Rounded, Not Full Screen */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded shadow-2xl w-full max-w-6xl h-full max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-dashed border-gray-300 gap-4 shrink-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="min-w-0 flex flex-col">
                                <h2 className="text-base sm:text-lg font-sans font-normal text-black truncate max-w-[150px] sm:max-w-sm">
                                    {currentItem.name || 'Document Preview'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 truncate">
                                    {/* File Size */}
                                    {currentItem.file && (
                                        <span>{formatFileSize(currentItem.file.size)}</span>
                                    )}

                                    {/* File Type */}
                                    <span className="uppercase text-gray-400">
                                        {currentItem.name.split('.').pop() || 'FILE'}
                                    </span>

                                    {/* Counter */}
                                    {totalItems > 1 && (
                                        <span className="pl-2 border-l border-dashed border-gray-300">
                                            {currentIndex + 1}/{totalItems}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="group flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-lg transition-all text-xs sm:text-sm font-medium text-gray-600 hover:text-black"
                            aria-label="Close preview"
                        >
                            <span>Close</span>
                            <CloseIcon className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gray-50/30 p-4">
                        {/* Navigation - Previous */}
                        {totalItems > 1 && (
                            <button
                                onClick={goToPrevious}
                                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-400 hover:text-black hover:bg-white rounded-full shadow-sm border border-transparent hover:border-gray-200 transition-all"
                                aria-label="Previous item"
                            >
                                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 stroke-[1.5]" />
                            </button>
                        )}

                        {/* Content Display */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                {(() => {
                                    const url = currentItem.url;
                                    const urlLower = url.toLowerCase();
                                    const nameLower = currentItem.name.toLowerCase();
                                    const mimeType = currentItem.mimeType;

                                    const isImage =
                                        urlLower.includes('.png') || urlLower.includes('.jpg') ||
                                        urlLower.includes('.jpeg') || urlLower.includes('.gif') ||
                                        urlLower.includes('.webp') ||
                                        nameLower.includes('.png') || nameLower.includes('.jpg') ||
                                        nameLower.includes('.jpeg') || nameLower.includes('.gif') ||
                                        nameLower.includes('.webp') ||
                                        currentItem.file?.type.startsWith('image/') ||
                                        mimeType?.startsWith('image/');

                                    const isPdf =
                                        urlLower.includes('.pdf') ||
                                        nameLower.includes('.pdf') ||
                                        currentItem.file?.type === 'application/pdf' ||
                                        mimeType === 'application/pdf';

                                    if (isImage) {
                                        return (
                                            <img
                                                src={url}
                                                alt={currentItem.name}
                                                className={`max-w-full max-h-full object-contain shadow-sm rounded-lg transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                                onLoad={() => setIsLoaded(true)}
                                            />
                                        );
                                    }

                                    if (isPdf) {
                                        const isBlob = url.startsWith('blob:');
                                        return (
                                            <div className="w-full max-w-4xl h-full bg-white border border-gray-200 rounded-lg overflow-hidden relative shadow-sm">
                                                {!isBlob ? (
                                                    <iframe
                                                        src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`}
                                                        className="w-full h-full"
                                                        title="PDF Preview"
                                                        frameBorder="0"
                                                    />
                                                ) : (
                                                    <iframe
                                                        src={url}
                                                        className="w-full h-full"
                                                        title="PDF Preview"
                                                    />
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="text-center text-gray-400">
                                            <CustomDocumentIcon className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 opacity-30 text-gray-400" />
                                            <p className="text-sm font-normal">Preview not available for this file type</p>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation - Next */}
                        {totalItems > 1 && (
                            <button
                                onClick={goToNext}
                                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-400 hover:text-black hover:bg-white rounded-full shadow-sm border border-transparent hover:border-gray-200 transition-all"
                                aria-label="Next item"
                            >
                                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 stroke-[1.5]" />
                            </button>
                        )}
                    </div>

                    {/* Footer - Thumbnail Strip (Desktop Only) */}
                    {totalItems > 1 && (
                        <div
                            className="hidden sm:block px-4 py-4 border-t border-dashed border-gray-300 overflow-x-auto bg-white shrink-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex gap-3 justify-center">
                                {items.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentIndex(i)}
                                        className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all border
                                            ${i === currentIndex
                                                ? 'border-black ring-1 ring-black opacity-100'
                                                : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400'
                                            }`}
                                        title={item.name}
                                    >
                                        {(() => {
                                            const urlLower = item.url.toLowerCase();
                                            const isImage = urlLower.includes('.png') || urlLower.includes('.jpg') ||
                                                urlLower.includes('.jpeg') || urlLower.includes('.webp') ||
                                                item.file?.type.startsWith('image/');

                                            if (isImage) {
                                                return (
                                                    <img
                                                        src={item.url}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                );
                                            }

                                            return (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                    <CustomDocumentIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                            );
                                        })()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
