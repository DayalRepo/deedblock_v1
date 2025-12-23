import React, { useState } from 'react';
import { Download, AlertCircle, Loader2, Check, Copy } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';
import { ResetButton } from '../ResetButton';
import { PreviewIcon } from '@/components/registration/icons/RegistrationIcons';

interface Step3Props {
    form: UseFormReturn<RegistrationFormSchema>;
    surveyOrDoor: 'survey' | 'door';
    downloadSummary: () => void;
    onReset: () => void;
    previewDocument?: (type: string, file: File) => void;
}

export const Step3_ReviewPayment: React.FC<Step3Props> = ({
    form,
    surveyOrDoor,
    downloadSummary,
    onReset,
    previewDocument
}) => {
    const { register, watch, setValue, formState: { errors } } = form;
    const formData = watch();

    // Fee calculations
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

    // Payment verification state
    const [paymentVerified, setPaymentVerified] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
    const [copiedPaymentId, setCopiedPaymentId] = useState(false);
    const paymentId = watch('paymentId');

    // Documents
    const documents = watch('documents');
    const propertyPhotos = watch('propertyPhotos') || [];

    const verifyPayment = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!paymentId) return;

        setPaymentVerified('verifying');
        await new Promise(resolve => setTimeout(resolve, 800));

        if (paymentId.startsWith('4')) {
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

    const copyPaymentId = async () => {
        if (!paymentId) return;
        await navigator.clipboard.writeText(paymentId);
        setCopiedPaymentId(true);
        setTimeout(() => setCopiedPaymentId(false), 2000);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-sans font-normal text-black">Review & Payment</h2>
                <div className="flex items-center gap-2">
                    <ResetButton size="sm" onReset={onReset} mobileIconOnly={true} />
                    <button
                        onClick={downloadSummary}
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                        type="button"
                        aria-label="Download summary"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Download</span>
                    </button>
                </div>
            </div>
            <div className="border-t border-dashed border-gray-300 mb-2"></div>

            {/* Property Summary */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Property Details</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                        <span className="text-gray-500">{surveyOrDoor === 'survey' ? 'Survey No' : 'Door No'}</span>
                        <p className="font-medium text-black mt-0.5">
                            {surveyOrDoor === 'survey' ? formData.surveyNumber || '-' : formData.doorNumber || '-'}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Transaction Type</span>
                        <p className="font-medium text-black mt-0.5 capitalize">{formData.transactionType || '-'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Village</span>
                        <p className="font-medium text-black mt-0.5">{formData.village || '-'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">District</span>
                        <p className="font-medium text-black mt-0.5">{formData.district || '-'}</p>
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Documents Summary */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Uploaded Documents</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <div className="flex flex-wrap gap-2">
                    {documents?.saleDeed && (
                        <button
                            onClick={() => previewDocument?.('saleDeed', documents.saleDeed!)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-black transition-colors"
                            type="button"
                        >
                            <PreviewIcon className="w-4 h-4 text-gray-400" />
                            Deed Doc
                        </button>
                    )}
                    {documents?.ec && (
                        <button
                            onClick={() => previewDocument?.('ec', documents.ec!)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-black transition-colors"
                            type="button"
                        >
                            <PreviewIcon className="w-4 h-4 text-gray-400" />
                            EC
                        </button>
                    )}
                    {documents?.khata && (
                        <button
                            onClick={() => previewDocument?.('khata', documents.khata!)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-black transition-colors"
                            type="button"
                        >
                            <PreviewIcon className="w-4 h-4 text-gray-400" />
                            Seller ID
                        </button>
                    )}
                    {documents?.taxReceipt && (
                        <button
                            onClick={() => previewDocument?.('taxReceipt', documents.taxReceipt!)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-black transition-colors"
                            type="button"
                        >
                            <PreviewIcon className="w-4 h-4 text-gray-400" />
                            Buyer ID
                        </button>
                    )}
                    {propertyPhotos.length > 0 && (
                        <button
                            onClick={() => previewDocument?.('photos', propertyPhotos[0])}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-black transition-colors"
                            type="button"
                        >
                            <PreviewIcon className="w-4 h-4 text-gray-400" />
                            {propertyPhotos.length} Photo{propertyPhotos.length > 1 ? 's' : ''}
                        </button>
                    )}
                    {!documents?.saleDeed && !documents?.ec && !documents?.khata && !documents?.taxReceipt && propertyPhotos.length === 0 && (
                        <p className="text-sm text-gray-400">No documents uploaded</p>
                    )}
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Fee Breakdown */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Fee Breakdown</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Government Value</span>
                        <span className="font-medium text-black">₹{considerationAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Est. Market Value</span>
                        <span className="font-medium text-black">₹{(considerationAmount * 1.1).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Stamp Duty (5.5%)</span>
                        <span className="font-medium text-black">₹{stampDuty.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Registration Fee (0.5%)</span>
                        <span className="font-medium text-black">₹{registrationFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Deed Doc Fee</span>
                        <span className="font-medium text-black">₹{deedDocFee.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="border-t border-dashed border-gray-300 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                            <span className="text-base font-medium text-black">Total Payable</span>
                            <span className="text-xl font-semibold text-black">₹{totalPayable.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Payment Verification */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Payment Verification</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="text-sm text-gray-500 shrink-0">Payment ID</label>
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={7}
                            value={paymentId || ''}
                            onChange={handlePaymentIdChange}
                            disabled={paymentVerified === 'valid' || paymentVerified === 'verifying'}
                            placeholder="Enter 7 digits"
                            className={`flex-1 max-w-[160px] px-3 py-2 text-sm border rounded-lg transition-all outline-none
                                ${paymentVerified === 'valid'
                                    ? 'bg-green-50 border-green-300 text-green-800 font-medium'
                                    : paymentVerified === 'invalid'
                                        ? 'bg-red-50 border-red-300 text-red-800'
                                        : 'bg-white border-gray-200 hover:border-gray-300 focus:border-black'
                                }`}
                            aria-label="Payment ID"
                        />

                        {paymentVerified === 'valid' ? (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                    <Check size={16} />
                                    <span className="hidden sm:inline">Verified</span>
                                </span>
                                <button
                                    onClick={copyPaymentId}
                                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                    type="button"
                                    title="Copy Payment ID"
                                >
                                    {copiedPaymentId ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={verifyPayment}
                                disabled={!paymentId || paymentVerified === 'verifying'}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${paymentId && paymentVerified !== 'verifying'
                                    ? 'bg-black text-white hover:bg-gray-800'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                type="button"
                            >
                                {paymentVerified === 'verifying' ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : null}
                                {paymentVerified === 'verifying' ? 'Verifying...' : 'Verify'}
                            </button>
                        )}
                    </div>
                </div>

                {paymentVerified === 'invalid' && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle size={12} />
                        Invalid Payment ID. Please check and try again.
                    </p>
                )}
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Declaration */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Declaration</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <label className="flex items-start gap-3 cursor-pointer p-4 bg-green-50 border border-green-200 rounded-lg hover:border-green-300 transition-colors">
                    <input
                        type="checkbox"
                        {...register('declarationChecked')}
                        className="w-5 h-5 mt-0.5 accent-green-600 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-sm text-green-800 leading-relaxed">
                        I hereby declare that the information and documents provided are true, accurate, and compliant with the Registration Act, 1908 and the New Registration Bill, 2025. I consent to the use of my Aadhaar and biometric data for identity verification. I acknowledge that fees paid are non-refundable.
                    </span>
                </label>
                {errors.declarationChecked && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle size={12} />
                        {errors.declarationChecked.message}
                    </p>
                )}
            </div>

            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Step Indicator */}
            <div className="flex justify-center items-center">
                <span className="text-gray-500 text-sm font-sans">3</span>
            </div>
        </div>
    );
};
