import React from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SuccessModalProps {
    registrationId: string;
    formTimeElapsed: number;
    downloadSummary: () => void;
    onCopyId: () => void;
    isIdCopied: boolean;
    onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
    registrationId,
    formTimeElapsed,
    downloadSummary,
    onCopyId,
    isIdCopied,
    onClose
}) => {
    const router = useRouter();

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-gray-200 rounded-lg w-full max-w-sm sm:max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 sm:p-6">
                    {/* Success Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
                            <Check className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg sm:text-xl font-sans font-normal text-black text-center mb-1">
                        Registration Submitted
                    </h2>
                    <p className="text-sm text-gray-500 text-center mb-4 sm:mb-6">
                        Completed in {formatTime(formTimeElapsed)}
                    </p>

                    <div className="border-t border-dashed border-gray-200 mb-4 sm:mb-6"></div>

                    {/* Registration ID */}
                    <div className="mb-4 sm:mb-6">
                        <label className="block text-sm text-gray-500 mb-1.5">Registration ID</label>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                            <span className="flex-1 text-black font-mono text-sm sm:text-base font-medium truncate">
                                {registrationId}
                            </span>
                            <button
                                onClick={onCopyId}
                                className="shrink-0 p-1.5 hover:bg-gray-200 rounded-md text-gray-400 hover:text-black transition-colors"
                                aria-label="Copy registration ID"
                            >
                                {isIdCopied ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        {isIdCopied && (
                            <p className="text-xs text-green-600 mt-1">Copied to clipboard</p>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4 sm:mb-6">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm text-gray-500">Progress</span>
                            <span className="text-sm font-medium text-green-600">100%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-full bg-green-500 rounded-full w-full"></div>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-gray-200 mb-4 sm:mb-6"></div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={downloadSummary}
                            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-black text-gray-700 hover:text-black font-medium py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
                        >
                            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                            Download Summary
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
