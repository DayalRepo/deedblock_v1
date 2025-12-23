'use client';

import { useState } from 'react';

interface ResetButtonProps {
    onReset: () => void;
    size?: 'sm' | 'md';
    className?: string;
    mobileIconOnly?: boolean;
}

export default function ResetButton({ onReset, size = 'md', className = '', mobileIconOnly = false }: ResetButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false);

    const handleReset = () => {
        onReset();
        setShowConfirm(false);
    };

    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
        <div className="relative">
            <button
                onClick={() => setShowConfirm(true)}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors ${className}`}
                title="Reset this step"
                aria-label="Reset this step"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 -960 960 960"
                    className={`${iconSize} fill-gray-500`}
                >
                    <path d="M440-122q-121-15-200.5-105.5T160-440q0-66 26-126.5T260-672l57 57q-38 34-57.5 79T240-440q0 88 56 155.5T440-202v80Zm80 0v-80q87-16 143.5-83T720-440q0-100-70-170t-170-70h-3l44 44-56 56-140-140 140-140 56 56-44 44h3q134 0 227 93t93 227q0 121-79.5 211.5T520-122Z" />
                </svg>
                <span className={`text-sm font-medium text-gray-600 ${mobileIconOnly ? 'hidden sm:inline' : ''}`}>Reset</span>
            </button>

            {/* Confirmation Modal */}
            {showConfirm && (
                <>
                    <div
                        className="fixed inset-0 bg-black/30 z-40"
                        onClick={() => setShowConfirm(false)}
                    />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 w-72 sm:w-80">
                        <p className="text-sm text-gray-700 mb-4 text-center">
                            Reset this step? All data in this section will be cleared.
                        </p>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
