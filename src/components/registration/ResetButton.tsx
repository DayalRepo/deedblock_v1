import React from 'react';

interface ResetButtonProps {
    onReset: () => void;
    size?: 'sm' | 'md' | 'lg';
    mobileIconOnly?: boolean;
}

export const ResetButton: React.FC<ResetButtonProps> = ({ onReset, size = 'md', mobileIconOnly = false }) => {
    const [showConfirm, setShowConfirm] = React.useState(false);

    if (showConfirm) {
        return (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <button
                    onClick={() => setShowConfirm(false)}
                    className={`text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors px-3 py-1.5 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
                    type="button"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        onReset();
                        setShowConfirm(false);
                    }}
                    className={`text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg transition-colors px-3 py-1.5 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
                    type="button"
                >
                    Reset
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className={`flex items-center gap-1.5 text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg transition-all duration-200 px-3 py-1.5 font-sans ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}
            type="button"
            title="Reset Form"
        >
            <svg xmlns="http://www.w3.org/2000/svg" height={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} viewBox="0 -960 960 960" width={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} fill="currentColor">
                <path d="M440-122q-121-15-200.5-105.5T160-440q0-66 26-126.5T260-672l57 57q-38 34-57.5 79T240-440q0 88 56 155.5T440-202v80Zm80 0v-80q87-16 143.5-83T720-440q0-100-70-170t-170-70h-3l44 44-56 56-140-140 140-140 56 56-44 44h3q134 0 227 93t93 227q0 121-79.5 211.5T520-122Z" />
            </svg>
            <span className={mobileIconOnly ? "hidden sm:inline" : ""}>Reset</span>
        </button>
    );
};
