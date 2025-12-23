import React, { useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';
import { ResetButton } from '../ResetButton';

interface Step3Props {
    form: UseFormReturn<RegistrationFormSchema>;
    surveyOrDoor: 'survey' | 'door'; // passed from parent or watched
    downloadSummary: () => void;
    onReset: () => void;
}

export const Step3_ReviewPayment: React.FC<Step3Props> = ({
    form,
    surveyOrDoor, // Can also watch it if consistent
    downloadSummary,
    onReset
}) => {
    const { register, watch, setValue, formState: { errors } } = form;
    const formData = watch(); // Access all fields for review

    // Derived states for fee calculations
    // Note: duplicated logic from Step1. In a real app, should be centralized in hook or selector.
    // For now, I'll copy the logic as it's purely ensuring display consistency.
    const transactionType = formData.transactionType || '';
    const considerationAmount = Number(formData.considerationAmount || 0);
    const stampDuty = Number(formData.stampDuty || 0);
    const registrationFee = Number(formData.registrationFee || 0);

    const getDeedDocFee = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t === 'gift') return 1500;
        if (['partition', 'mortgage', 'exchange'].includes(t)) return 500;
        return 200;
    };
    const deedDocFee = getDeedDocFee(transactionType);
    const totalPayable = stampDuty + registrationFee + deedDocFee;

    // Local state for payment verification UI
    const [paymentVerified, setPaymentVerified] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const paymentId = watch('paymentId');

    const verifyPayment = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!paymentId) return;
        if (paymentId.startsWith('4')) { // Mock verification logic
            setPaymentVerified('valid');
        } else {
            setPaymentVerified('invalid');
        }
    };

    const handlePaymentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 7);
        setValue('paymentId', val, { shouldValidate: true });
        setPaymentVerified('idle');
    };

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 font-sans max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-dashed border-gray-300">
                <h3 className="text-lg font-semibold text-gray-800">Payment & Submit</h3>
                <div className="flex items-center gap-2">
                    <ResetButton
                        size="sm"
                        mobileIconOnly={true}
                        onReset={onReset}
                    />
                    <button
                        onClick={downloadSummary} // Ensure this handles RHF data or pass relevant data
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
                        type="button"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Download</span>
                    </button>
                </div>
            </div>

            {/* Property Info */}
            <div className="mb-4 pb-3 border-b border-dashed border-gray-300">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{surveyOrDoor === 'survey' ? 'Survey No:' : 'Door No:'}</span>
                    <span className="font-medium text-black text-right">
                        {surveyOrDoor === 'survey' ? formData.surveyNumber : formData.doorNumber}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium text-black text-right">{formData.village}, {formData.district}</span>
                </div>
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-2 text-sm mb-4 pb-3 border-b border-dashed border-gray-300">
                <div className="flex justify-between">
                    <span className="text-gray-500">Government Value:</span>
                    <span className="font-medium text-black">₹{considerationAmount.toLocaleString('en-IN') || '0'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Est. Market Value:</span>
                    <span className="font-medium text-black">₹{(considerationAmount * 1.1).toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Stamp Duty (5.5%):</span>
                    <span className="font-medium text-black">₹{stampDuty.toLocaleString('en-IN') || '0'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Registration Fee (0.5%):</span>
                    <span className="font-medium text-black">₹{registrationFee.toLocaleString('en-IN') || '0'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Deed Doc Fee:</span>
                    <span className="font-medium text-black">
                        ₹{deedDocFee.toLocaleString('en-IN')}
                    </span>
                </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 mb-6">
                <span className="text-base font-semibold text-gray-800">Total Payable:</span>
                <span className="text-xl font-bold text-black">
                    ₹{totalPayable.toLocaleString('en-IN')}
                </span>
            </div>

            <div className="border-b border-dashed border-gray-300 mb-6"></div>

            {/* Payment ID Input */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <label className="text-sm font-medium text-gray-700">Enter Payment ID</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={7}
                            value={paymentId}
                            onChange={handlePaymentIdChange}
                            disabled={paymentVerified === 'valid'}
                            placeholder="7 digits"
                            className={`w-32 px-4 py-2 text-sm border rounded-lg transition-all duration-200 outline-none
                                ${paymentVerified === 'valid'
                                    ? 'bg-green-50 border-green-200 text-green-800 font-medium cursor-not-allowed'
                                    : 'bg-white border-gray-200 text-black hover:border-gray-300 focus:border-black focus:ring-4 focus:ring-gray-100'
                                }`}
                        />
                        {paymentVerified === 'valid' ? (
                            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">Verified</span>
                            </div>
                        ) : (
                            <button
                                onClick={verifyPayment}
                                disabled={!paymentId}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${paymentId
                                    ? 'bg-black text-white border-black hover:bg-gray-800'
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    }`}
                                type="button"
                            >
                                Verify
                            </button>
                        )}
                    </div>
                </div>
                {paymentVerified === 'invalid' && (
                    <p className="text-red-500 text-xs text-right flex items-center justify-end gap-1 font-medium">
                        <AlertCircle size={14} />
                        Invalid Payment ID
                    </p>
                )}
            </div>

            <div className="border-b border-dashed border-black mb-4"></div>

            {/* Declaration Form */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        {...register('declarationChecked')}
                        className="w-5 h-5 mt-0.5 accent-green-600 rounded border-green-300 focus:ring-green-500 cursor-pointer"
                    />
                    <span className="text-sm text-green-800">
                        I hereby declare that the information and documents provided are true, accurate, and compliant with the Registration Act, 1908 and the New Registration Bill, 2025. I strictly consent to the use of my Aadhaar and biometric data for identity verification purposes. I acknowledge that the stamp duty and registration fees paid are non-refundable and any false representation is punishable by law.
                    </span>
                </label>
                {errors.declarationChecked && (
                    <p className="mt-1 text-sm text-red-500">{errors.declarationChecked.message}</p>
                )}
            </div>

            <div className="border-b border-dashed border-gray-300 mt-4"></div>
        </div>
    );
};
