import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Check, Copy, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SuccessModalProps {
    registrationId: string;
    formTimeElapsed: number;
    downloadSummary: () => void;
    // We can handle copy logic inside or pass it. Passing for consistency if reused. 
    // Actually, SuccessModal has its own copy button for ID.
    onCopyId: () => void;
    isIdCopied: boolean;
    onClose: () => void; // Usually just redirects or resets
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
        return `${minutes}min ${seconds}s`;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white border border-gray-300 rounded-lg p-8 max-w-md w-full text-center"
            >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <CheckCircle size={40} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-medium mb-2">Registration Submitted Successfully!</h3>
                <div className="w-full mb-6">
                    <div className="flex justify-between mb-2 text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-bold text-green-600">100%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="h-full bg-green-500 rounded-full w-full"></div>
                    </div>
                    <div className="mt-2 text-right text-xs text-gray-500">
                        Time: {formatTime(formTimeElapsed)}
                    </div>
                </div>
                <div className="mb-4 text-left">
                    <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">
                        Registration ID
                    </label>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <span className="flex-1 text-black font-mono font-medium text-sm">
                            {registrationId}
                        </span>
                        <button
                            onClick={onCopyId}
                            className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 hover:text-black transition-colors"
                        >
                            {isIdCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={downloadSummary}
                        className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
                    >
                        <FileText size={18} /> Download Summary
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-2 text-sm font-medium text-gray-500 hover:text-black transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
