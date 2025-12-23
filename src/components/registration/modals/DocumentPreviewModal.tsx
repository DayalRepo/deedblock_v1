import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface DocumentPreviewModalProps {
    file: File | null;
    fileUrl: string | null;
    showPropertyPhotos: boolean;
    propertyPhotos: File[];
    propertyPhotoUrls: Map<number, string>;
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
    showPropertyPhotos,
    propertyPhotos,
    propertyPhotoUrls,
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
    const totalPhotos = propertyPhotos.length;

    const currentFile = showPropertyPhotos ? currentPhoto : file;
    const currentUrl = showPropertyPhotos
        ? (propertyPhotoUrls.get(currentIndex) || (currentPhoto ? URL.createObjectURL(currentPhoto) : null))
        : fileUrl;

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
                className="fixed inset-0 z-50 flex flex-col bg-black/95"
                onClick={onClose}
            >
                {/* Top Bar */}
                <div
                    className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3 text-white min-w-0">
                        <div className="min-w-0">
                            <p className="text-sm sm:text-base font-medium truncate">
                                {currentFile?.name || 'Preview'}
                            </p>
                            <p className="text-xs text-white/60">
                                {currentFile ? formatFileSize(currentFile.size) : ''}
                                {showPropertyPhotos && totalPhotos > 1 && (
                                    <span className="ml-2">• {currentIndex + 1} / {totalPhotos}</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Main Content */}
                <div
                    className="flex-1 flex items-center justify-center relative overflow-hidden px-4 sm:px-12"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Navigation - Previous */}
                    {showPropertyPhotos && totalPhotos > 1 && (
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <ChevronLeft size={24} className="sm:w-8 sm:h-8" />
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
                            {currentFile && currentUrl ? (
                                currentFile.type.startsWith('image/') ? (
                                    <img
                                        src={currentUrl}
                                        alt="Preview"
                                        className={`max-w-full max-h-[70vh] sm:max-h-[75vh] object-contain transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                        onLoad={() => setIsLoaded(true)}
                                        style={{ borderRadius: '4px' }}
                                    />
                                ) : currentFile.type === 'application/pdf' ? (
                                    <div className="w-full max-w-3xl h-[70vh] sm:h-[75vh] bg-white rounded">
                                        <iframe
                                            src={currentUrl}
                                            title="PDF Preview"
                                            className="w-full h-full rounded"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center text-white/70 py-12">
                                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="text-sm">Preview not available</p>
                                    </div>
                                )
                            ) : (
                                <p className="text-white/50 text-sm">No file to preview</p>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation - Next */}
                    {showPropertyPhotos && totalPhotos > 1 && (
                        <button
                            onClick={goToNext}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <ChevronRight size={24} className="sm:w-8 sm:h-8" />
                        </button>
                    )}
                </div>

                {/* Bottom Bar - Thumbnail Strip for Multiple Photos */}
                {showPropertyPhotos && totalPhotos > 1 && (
                    <div
                        className="px-4 py-3 sm:py-4 overflow-x-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex gap-2 justify-center">
                            {propertyPhotos.map((photo, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={`relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden transition-all ${i === currentIndex
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-black opacity-100'
                                            : 'opacity-40 hover:opacity-70'
                                        }`}
                                >
                                    <img
                                        src={propertyPhotoUrls.get(i) || URL.createObjectURL(photo)}
                                        alt={`Thumbnail ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Bar - Single File */}
                {!showPropertyPhotos && (
                    <div
                        className="px-4 py-3 sm:py-4 flex justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                        >
                            Close
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
