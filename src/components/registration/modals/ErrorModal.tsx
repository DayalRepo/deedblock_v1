import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ErrorModalProps {
    error: string | null;
    onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ error, onClose }) => {
    if (!error) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-2 border-red-500 rounded-lg p-8 max-w-md w-full text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-red-600 mb-2">Submission Failed</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-black text-white rounded-lg w-full hover:bg-gray-800 transition-colors"
                >
                    Try Again
                </button>
            </motion.div>
        </div>
    );
};
