import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const CopyOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl flex flex-col items-center shadow-xl border border-gray-100"
            >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4">
                    <Check size={48} className="text-white" />
                </div>
                <p className="text-black text-xl font-medium">Copied!</p>
            </motion.div>
        </div>
    );
};
