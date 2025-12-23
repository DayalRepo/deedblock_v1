import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';

export interface AnimatedSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
    searchable?: boolean;
    disabled?: boolean;
}

export function AnimatedSelect({ value, onChange, options, placeholder = 'Select...', className = '', searchable = false, disabled = false }: AnimatedSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const selectRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus search input when dropdown opens (if searchable)
            if (searchable && searchInputRef.current) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, searchable]);

    // Filter options based on search query
    const filteredOptions = searchable && searchQuery
        ? options.filter(option =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    return (
        <div ref={selectRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(!isOpen);
                        setSearchQuery('');
                    }
                }}
                className={`w-full border rounded-lg px-4 py-3 flex items-center justify-between transition-all duration-200 ${disabled
                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                    : 'bg-white border-gray-200 text-black hover:border-gray-300 focus:outline-none focus:border-black focus:ring-4 focus:ring-gray-100'
                    }`}
            >
                <span className={`truncate ${value && !disabled ? 'text-black' : 'text-gray-500'}`}>{selectedLabel}</span>
                {!disabled && (
                    <ChevronDown
                        size={18}
                        className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
                    >
                        {searchable && (
                            <div className="p-2 border-b border-dashed border-gray-300">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-black text-sm focus:outline-none focus:border-black"
                                        placeholder="Search..."
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => (
                                    <div key={option.value}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange(option.value);
                                                setIsOpen(false);
                                                setSearchQuery('');
                                            }}
                                            className={`w-full text-left px-4 py-3 text-black hover:bg-gray-100 transition-colors ${value === option.value ? 'bg-gray-100' : ''
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                        {index < filteredOptions.length - 1 && (
                                            <div className="mx-4 border-t border-dashed border-gray-300" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                    No results found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
