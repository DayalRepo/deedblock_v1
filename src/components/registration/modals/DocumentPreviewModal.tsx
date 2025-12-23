import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, X, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

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
    const [isLoading, setIsLoading] = useState(true);

    // Reset loading state when file changes
    useEffect(() => {
        setIsLoading(true);
    }, [file]);

    const fileName = showPropertyPhotos ? `Property Photos (${propertyPhotos.length})` : (file?.name || 'Document');
    const fileSize = showPropertyPhotos
        ? formatFileSize(propertyPhotos.reduce((acc, curr) => acc + curr.size, 0))
        : (file ? formatFileSize(file.size) : '');

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Dashed Border */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-dashed border-gray-300 bg-white z-10">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-gray-100 p-2 rounded-lg shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className="text-gray-600">
                                <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate pr-4" title={fileName}>
                                {fileName}
                            </h3>
                            {fileSize && (
                                <p className="text-sm text-gray-500 font-mono">
                                    {fileSize}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 shrink-0"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 min-h-[300px]">
                    {showPropertyPhotos ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {propertyPhotos.map((photo, i) => (
                                <div key={i} className="group relative rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white aspect-[4/3]">
                                    <img
                                        src={propertyPhotoUrls.get(i) || URL.createObjectURL(photo)}
                                        alt={`Property ${i + 1}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-full min-h-[400px] relative">
                            {file && fileUrl ? (
                                <>
                                    {isLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center p-6">
                                            <Skeleton className="w-full h-full max-w-2xl max-h-[60vh] rounded-lg" />
                                        </div>
                                    )}
                                    {file.type.startsWith('image/') ? (
                                        <img
                                            src={fileUrl}
                                            alt="Preview"
                                            className={`max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                                            onLoad={() => setIsLoading(false)}
                                        />
                                    ) : file.type === 'application/pdf' ? (
                                        <iframe
                                            src={fileUrl}
                                            title="PDF Preview"
                                            className={`w-full h-[75vh] rounded-lg border border-gray-200 bg-white shadow-sm transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                                            onLoad={() => setIsLoading(false)}
                                        />
                                    ) : (
                                        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-200">
                                            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg text-gray-700 font-medium">Preview not available</p>
                                            <p className="text-gray-500 mt-2">This file type cannot be previewed directly.</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-gray-500">No file loaded</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with Dashed Border */}
                <div className="p-4 border-t border-dashed border-gray-300 bg-white flex justify-end gap-3 z-10">

                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                    >
                        Close Preview
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
