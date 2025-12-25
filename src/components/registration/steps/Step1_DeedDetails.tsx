import React from 'react';
import { AlertCircle, Clock, Check, Loader2 } from 'lucide-react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { AnimatedSelect } from '@/components/ui/AnimatedSelect';

import { motion, AnimatePresence } from 'framer-motion';
import { RegistrationFormSchema } from '@/lib/validations/registrationSchema';
import { useLocationData } from '@/hooks/registration/useLocationData';
import { useOTPVerification } from '@/hooks/registration/useOTPVerification';
import { FingerprintIcon } from '@/components/registration/icons/RegistrationIcons';
import { ResetButton } from '../ResetButton';

interface Step1Props {
    form: UseFormReturn<RegistrationFormSchema>;
    locationDataHook: ReturnType<typeof useLocationData>;
    otpVerification: ReturnType<typeof useOTPVerification>;
    onReset: () => void;
}

export const Step1_DeedDetails: React.FC<Step1Props> = ({
    form,
    locationDataHook,
    otpVerification,
    onReset
}) => {
    const {
        register,
        control,
        formState: { errors, isDirty },
        watch
    } = form;

    const {
        districts, talukas, villages, surveyNumbers, doorNumbers,
        selectedSurvey, selectedDoor, estimatedFee, stampDutyRate,
        handleLocationChange, handleSurveyDoorToggle, locationData,
        surveyOrDoor
    } = locationDataHook;

    const {
        sellerOtp, setSellerOtp, sellerOtpSent, handleSendSellerOtp, handleVerifySellerOtp, handleResendSellerOtp, sellerOtpTimer, sellerOtpError, sellerMockOtp,
        buyerOtp, setBuyerOtp, buyerOtpSent, handleSendBuyerOtp, handleVerifyBuyerOtp, handleResendBuyerOtp, buyerOtpTimer, buyerOtpError, buyerMockOtp,
        sellerAadharOtp, setSellerAadharOtp, sellerAadharOtpSent, handleSendSellerAadharOtp, handleVerifySellerAadharOtp, handleResendSellerAadharOtp, sellerAadharOtpTimer, sellerAadharOtpError, sellerAadharMockOtp,
        buyerAadharOtp, setBuyerAadharOtp, buyerAadharOtpSent, handleSendBuyerAadharOtp, handleVerifyBuyerAadharOtp, handleResendBuyerAadharOtp, buyerAadharOtpTimer, buyerAadharOtpError, buyerAadharMockOtp,
        isSellerScanning, isBuyerScanning, handleSellerFingerprintScan, handleBuyerFingerprintScan,
        sellerAadharError, buyerAadharError
    } = otpVerification;

    const indianStates = Object.keys(locationData);

    // Watch verification flags
    const sellerOtpVerified = watch('sellerOtpVerified');
    const buyerOtpVerified = watch('buyerOtpVerified');
    const sellerFingerprintVerified = watch('sellerFingerprintVerified');
    const buyerFingerprintVerified = watch('buyerFingerprintVerified');
    const sellerAadharOtpVerified = watch('sellerAadharOtpVerified');
    const buyerAadharOtpVerified = watch('buyerAadharOtpVerified');
    const isSellerAadharVerified = sellerFingerprintVerified && sellerAadharOtpVerified;
    const isBuyerAadharVerified = buyerFingerprintVerified && buyerAadharOtpVerified;

    // Watch location fields
    const sellerAadhar = watch('sellerAadhar');
    const buyerAadhar = watch('buyerAadhar');
    const sellerPhone = watch('sellerPhone');
    const buyerPhone = watch('buyerPhone');
    const state = watch('state');
    const district = watch('district');
    const taluka = watch('taluka');
    const village = watch('village');
    const transactionType = watch('transactionType');

    // Fee calculation
    const getDeedDocFee = (type: string) => {
        if (!type) return 0;
        switch (type) {
            case 'gift': return 1500;
            case 'partition': case 'mortgage': case 'exchange': return 500;
            default: return 200;
        }
    };

    // Auto-populate Seller Aadhar based on property selection
    React.useEffect(() => {
        const ownerAadhar = selectedSurvey?.ownerAadhar || selectedDoor?.ownerAadhar;
        const currentAadhar = form.getValues('sellerAadhar');
        // Only update if value is different to avoid triggering change events or dirtying form unnecessarily
        if (ownerAadhar && ownerAadhar !== currentAadhar) {
            form.setValue('sellerAadhar', ownerAadhar, { shouldValidate: true, shouldDirty: true });
        }
    }, [selectedSurvey, selectedDoor, form]);

    // Refs to track previous values for reset logic
    const prevSellerAadhar = React.useRef(sellerAadhar);
    const prevSellerPhone = React.useRef(sellerPhone);

    // Reset Seller Verification on Aadhar Change
    React.useEffect(() => {
        // Only run reset logic if the form is dirty (user interaction), not on initial load/hydration
        if (isDirty && sellerAadhar !== prevSellerAadhar.current) {
            form.setValue('sellerFingerprintVerified', false);
            form.setValue('sellerAadharOtpVerified', false);
            prevSellerAadhar.current = sellerAadhar;
        } else if (!isDirty) {
            // Sync ref if not dirty (hydration case)
            prevSellerAadhar.current = sellerAadhar;
        }
    }, [sellerAadhar, form, isDirty]);

    // Reset Seller Phone Verification on Phone Change
    React.useEffect(() => {
        if (isDirty && sellerPhone !== prevSellerPhone.current) {
            form.setValue('sellerOtpVerified', false);
            prevSellerPhone.current = sellerPhone;
        } else if (!isDirty) {
            prevSellerPhone.current = sellerPhone;
        }
    }, [sellerPhone, form, isDirty]);

    // Refs for Buyer reset logic
    const prevBuyerAadhar = React.useRef(buyerAadhar);
    const prevBuyerPhone = React.useRef(buyerPhone);

    // Reset Buyer Verification on Aadhar Change
    React.useEffect(() => {
        if (isDirty && buyerAadhar !== prevBuyerAadhar.current) {
            form.setValue('buyerFingerprintVerified', false);
            form.setValue('buyerAadharOtpVerified', false);
            prevBuyerAadhar.current = buyerAadhar;
        } else if (!isDirty) {
            prevBuyerAadhar.current = buyerAadhar;
        }
    }, [buyerAadhar, form, isDirty]);

    // Reset Buyer Phone Verification on Phone Change
    React.useEffect(() => {
        if (isDirty && buyerPhone !== prevBuyerPhone.current) {
            form.setValue('buyerOtpVerified', false);
            prevBuyerPhone.current = buyerPhone;
        } else if (!isDirty) {
            prevBuyerPhone.current = buyerPhone;
        }
    }, [buyerPhone, form, isDirty]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-sans font-normal text-black">Deed Details</h2>
                <ResetButton size="sm" onReset={onReset} mobileIconOnly={true} />
            </div>
            <div className="border-t border-dashed border-gray-300"></div>

            {/* Location Section */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Location</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
                    {/* Row 1: State & District */}
                    <div className="flex items-end gap-2 w-full sm:contents">
                        {/* State */}
                        <div className="flex-1 sm:flex-1 min-w-0">
                            <label className="block text-sm text-gray-500 mb-1.5">State <span className="text-red-400">*</span></label>
                            <Controller
                                control={control}
                                name="state"
                                render={({ field }) => (
                                    <AnimatedSelect
                                        value={field.value}
                                        onChange={(val) => handleLocationChange('state', val)}
                                        placeholder="Select"
                                        options={indianStates.map(s => ({ value: s, label: s }))}
                                        searchable={true}
                                        className="text-sm"
                                        error={!!errors.state}
                                    />
                                )}
                            />
                        </div>

                        <div className="w-px border-l border-dashed border-gray-300 h-10 self-end mb-1.5"></div>

                        {/* District */}
                        <div className="flex-1 sm:flex-1 min-w-0">
                            <label className="block text-sm text-gray-500 mb-1.5">District <span className="text-red-400">*</span></label>
                            <Controller
                                control={control}
                                name="district"
                                render={({ field }) => (
                                    <AnimatedSelect
                                        value={field.value}
                                        onChange={(val) => handleLocationChange('district', val)}
                                        placeholder="Select"
                                        options={districts.map(d => ({ value: d, label: d }))}
                                        searchable={true}
                                        disabled={!state}
                                        className="text-sm"
                                        error={!!errors.district}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="hidden sm:block w-px border-l border-dashed border-gray-300 h-10 self-end mb-1.5"></div>

                    {/* Row 2: Mandal & Village */}
                    <div className="flex items-end gap-2 w-full sm:contents">
                        {/* Mandal */}
                        <div className="flex-1 sm:flex-1 min-w-0">
                            <label className="block text-sm text-gray-500 mb-1.5">Mandal <span className="text-red-400">*</span></label>
                            <Controller
                                control={control}
                                name="taluka"
                                render={({ field }) => (
                                    <AnimatedSelect
                                        value={field.value}
                                        onChange={(val) => handleLocationChange('taluka', val)}
                                        placeholder="Select"
                                        options={talukas.map(t => ({ value: t, label: t }))}
                                        searchable={true}
                                        disabled={!district}
                                        className="text-sm"
                                        error={!!errors.taluka}
                                    />
                                )}
                            />
                        </div>

                        <div className="w-px border-l border-dashed border-gray-300 h-10 self-end mb-1.5"></div>

                        {/* Village */}
                        <div className="flex-1 sm:flex-1 min-w-0">
                            <label className="block text-sm text-gray-500 mb-1.5">Village <span className="text-red-400">*</span></label>
                            <Controller
                                control={control}
                                name="village"
                                render={({ field }) => (
                                    <AnimatedSelect
                                        value={field.value}
                                        onChange={(val) => handleLocationChange('village', val)}
                                        placeholder="Select"
                                        options={villages.map(v => ({ value: v, label: v }))}
                                        searchable={true}
                                        disabled={!taluka}
                                        className="text-sm"
                                        error={!!errors.village}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Property Identification */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Property Identification</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Radio Toggle */}
                    <div className="w-full sm:flex-1 sm:flex sm:flex-col min-w-0 relative">
                        <label className="block text-sm text-gray-500 mb-2">Select Type</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="surveyOrDoor"
                                    checked={surveyOrDoor === 'survey'}
                                    onChange={() => handleSurveyDoorToggle('survey')}
                                    className="w-4 h-4 accent-black"
                                />
                                <span className="text-sm text-gray-700">Survey No.</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="surveyOrDoor"
                                    checked={surveyOrDoor === 'door'}
                                    onChange={() => handleSurveyDoorToggle('door')}
                                    className="w-4 h-4 accent-black"
                                />
                                <span className="text-sm text-gray-700">Door No.</span>
                            </label>
                        </div>

                        <div className="mt-3 sm:mt-auto relative">
                            <label className="block text-sm text-gray-500 mb-1.5">
                                {surveyOrDoor === 'survey' ? 'Survey Number' : 'Door Number'} <span className="text-red-400">*</span>
                            </label>
                            <Controller
                                control={control}
                                name={surveyOrDoor === 'survey' ? 'surveyNumber' : 'doorNumber'}
                                render={({ field }) => (
                                    <AnimatedSelect
                                        value={field.value || ''}
                                        onChange={(val) => handleLocationChange(surveyOrDoor === 'survey' ? 'surveyNumber' : 'doorNumber', val)}
                                        placeholder="Select"
                                        options={surveyOrDoor === 'survey'
                                            ? surveyNumbers.map(s => ({ value: s.number, label: s.number }))
                                            : doorNumbers.map(d => ({ value: d.number, label: d.number }))
                                        }
                                        searchable={true}
                                        disabled={!village}
                                        className="w-[50%] sm:w-[80%]"
                                        error={!!(errors.surveyNumber || errors.doorNumber)}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* Vertical Dashed Line - Removed for Desktop */}
                    {/* <div className="hidden sm:block w-px border-l border-dashed border-gray-300 mx-auto sm:h-auto sm:mx-auto sm:self-stretch"></div> */}

                    {/* Fee Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-full sm:flex-1">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 border-b border-dashed border-gray-300 pb-2">Estimated Fees</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Government Value</span>
                                <span className="font-medium text-black">₹{(selectedSurvey?.govtValue || selectedDoor?.govtValue || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Stamp Duty ({stampDutyRate || 0}%)</span>
                                <span className="font-medium text-black">₹{(((selectedSurvey?.govtValue || selectedDoor?.govtValue || 0) * (stampDutyRate || 0)) / 100).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-dashed border-gray-200 pt-2 mt-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-700 font-medium">Total Est. Fee</span>
                                    <span className="font-semibold text-black">₹{estimatedFee.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Transaction Details */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Transaction Details</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
                    {/* Transaction Type */}
                    <div className="w-full sm:flex-1 min-w-0">
                        <label className="block text-sm text-gray-500 mb-1.5">Type <span className="text-red-400">*</span></label>
                        <Controller
                            control={control}
                            name="transactionType"
                            render={({ field }) => (
                                <AnimatedSelect
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select"
                                    options={[
                                        { value: 'sale', label: 'Sale' },
                                        { value: 'gift', label: 'Gift' },
                                        { value: 'partition', label: 'Partition' },
                                        { value: 'lease', label: 'Lease' },
                                        { value: 'mortgage', label: 'Mortgage' },
                                        { value: 'exchange', label: 'Exchange' },
                                    ]}
                                    className="w-[70%] sm:w-full text-sm"
                                    error={!!errors.transactionType}
                                />
                            )}
                        />
                    </div>

                    <div className="hidden sm:block w-px border-l border-dashed border-gray-300 h-10 self-end mb-1.5"></div>

                    {/* Wrapper for Deed Fee & Stamp Duty */}
                    <div className="flex items-end gap-2 w-full sm:contents">
                        {/* Deed Doc Fee */}
                        <div className="flex-1 sm:flex-1">
                            <label className="block text-sm text-gray-500 mb-1.5">Deed Fee</label>
                            <input
                                type="text"
                                value={transactionType ? `₹${getDeedDocFee(transactionType)}` : '-'}
                                readOnly
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
                            />
                        </div>

                        <div className="pb-4 text-gray-400 font-medium text-lg">+</div>

                        {/* Stamp Duty */}
                        <div className="flex-1 sm:flex-1">
                            <label className="block text-sm text-gray-500 mb-1.5">Stamp Duty</label>
                            <input
                                type="text"
                                {...register('stampDuty')}
                                readOnly
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
                                placeholder="-"
                            />
                        </div>
                    </div>

                    <div className="hidden sm:block pb-4 text-gray-400 font-medium text-lg">=</div>

                    {/* Total Fee */}
                    <div className="w-full sm:flex-1">
                        <label className="block text-sm text-gray-500 mb-1.5">Total Fee</label>
                        <input
                            type="text"
                            value={`₹${estimatedFee.toLocaleString()}`}
                            readOnly
                            className="w-[calc(48%-0.25rem)] sm:w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-black font-medium text-sm cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Parties Involved */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Parties Involved</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                {/* Seller Details */}
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Seller Details</h4>

                    <div className="flex flex-col sm:flex-row sm:gap-4">
                        {/* Seller Aadhar */}
                        <div className="w-full sm:flex-1">
                            <label className="block text-sm text-gray-500 mb-1.5">Aadhar Number <span className="text-red-400">*</span></label>
                            <div className="relative w-[85%]">
                                <Controller
                                    control={control}
                                    name="sellerAadhar"
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                                const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                                                field.onChange(formatted);
                                            }}
                                            className={`w-full border rounded-lg px-3 py-2.5 pr-20 text-sm transition-all outline-none
                                                ${isSellerAadharVerified
                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                    : errors.sellerAadhar
                                                        ? 'border-red-300 bg-red-50'
                                                        : 'border-gray-200 focus:border-black'
                                                }
                                                ${(selectedSurvey?.ownerAadhar || selectedDoor?.ownerAadhar) ? 'bg-gray-100 cursor-not-allowed' : ''}
                                                `}
                                            placeholder="0000 0000 0000"
                                            maxLength={14}
                                            disabled={isSellerAadharVerified || !!(selectedSurvey?.ownerAadhar || selectedDoor?.ownerAadhar)}
                                        />
                                    )}
                                />
                                {isSellerAadharVerified && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs font-medium">
                                        <Check size={14} />Verified
                                    </span>
                                )}
                            </div>


                            {/* Aadhar Verification */}
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                                {/* OTP Section */}
                                {sellerAadharOtpVerified ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <Check size={12} />OTP Verified
                                    </span>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="text"
                                            value={sellerAadharOtp}
                                            onChange={(e) => setSellerAadharOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className={`w-16 border rounded px-2 py-1 text-xs outline-none
                                                ${!sellerAadhar || sellerAadhar.replace(/\D/g, '').length !== 12
                                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-white border-gray-200 focus:border-black text-black'
                                                }`}
                                            placeholder="OTP"
                                            maxLength={6}
                                            disabled={!sellerAadhar || sellerAadhar.replace(/\D/g, '').length !== 12}
                                        />
                                        {!sellerAadharOtpSent ? (
                                            <button
                                                type="button"
                                                onClick={handleSendSellerAadharOtp}
                                                disabled={!sellerAadhar || sellerAadhar.replace(/\D/g, '').length !== 12}
                                                className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Send OTP
                                            </button>
                                        ) : (
                                            <button type="button" onClick={handleVerifySellerAadharOtp} disabled={sellerAadharOtp.length !== 6} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50">Verify</button>
                                        )}
                                    </div>
                                )}

                                {/* Fingerprint Section */}
                                {sellerFingerprintVerified ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <Check size={12} />Biometric Verified
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-xs hidden sm:inline">&</span>
                                        {isSellerScanning ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Loader2 size={12} className="animate-spin" />Scanning...</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSellerFingerprintScan}
                                                disabled={!sellerAadhar || sellerAadhar.replace(/\D/g, '').length !== 12}
                                                className="inline-flex items-center gap-1 bg-black text-white px-2.5 sm:px-2 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <FingerprintIcon className="w-3 h-3 sm:w-4 sm:h-4" />Fingerprint
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="space-y-1 mt-1">
                                {sellerAadharOtpSent && !sellerAadharOtpVerified && sellerAadharOtpTimer > 0 && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />Resend in {sellerAadharOtpTimer}s</p>
                                )}
                                {sellerAadharMockOtp && !sellerAadharOtpVerified && <p className="text-xs text-gray-400">Mock: {sellerAadharMockOtp}</p>}
                                {sellerAadharOtpError && <p className="text-xs text-red-500">{sellerAadharOtpError}</p>}
                                {sellerAadharError && <p className="text-xs text-red-500">{sellerAadharError}</p>}
                            </div>
                        </div>

                        {/* Vertical Separator */}
                        <div className="hidden sm:block w-px border-l border-dashed border-gray-300 mx-4 self-stretch"></div>

                        {/* Seller Phone */}
                        <div className="w-full mt-4 sm:mt-0 sm:flex-1 sm:pl-6">
                            <label className="block text-sm text-gray-500 mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                            <div className="relative w-[85%]">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                                    <span className="text-gray-400 text-sm">+91</span>
                                    <div className="h-4 w-px border-l border-dashed border-gray-300 ml-2"></div>
                                </div>
                                <Controller
                                    control={control}
                                    name="sellerPhone"
                                    render={({ field }) => (
                                        <input
                                            type="tel"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                const formatted = val.replace(/(\d{5})(?=\d)/g, '$1 ');
                                                field.onChange(formatted);
                                            }}
                                            className={`w-full border rounded-lg py-2.5 pl-16 pr-20 text-sm transition-all outline-none
                                                ${sellerOtpVerified
                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                    : errors.sellerPhone
                                                        ? 'border-red-300 bg-red-50'
                                                        : 'border-gray-200 focus:border-black'
                                                }`}
                                            placeholder="98765 43210"
                                            maxLength={11}
                                            disabled={sellerOtpVerified}
                                        />
                                    )}
                                />
                                {sellerOtpVerified && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs font-medium">
                                        <Check size={14} />Verified
                                    </span>
                                )}
                            </div>


                            {/* Phone OTP */}
                            {sellerOtpVerified ? (
                                <div className="mt-2">
                                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <Check size={12} />Phone Verified
                                    </span>
                                </div>
                            ) : (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        value={sellerOtp}
                                        onChange={(e) => setSellerOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-16 border border-gray-200 rounded px-2 py-1 text-xs focus:border-black outline-none disabled:opacity-50 disabled:bg-gray-100"
                                        placeholder="OTP"
                                        maxLength={6}
                                        disabled={!sellerPhone || sellerPhone.replace(/\D/g, '').length !== 10}
                                    />
                                    {!sellerOtpSent ? (
                                        <button
                                            type="button"
                                            onClick={handleSendSellerOtp}
                                            disabled={!sellerPhone || sellerPhone.replace(/\D/g, '').length !== 10}
                                            className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Send OTP
                                        </button>
                                    ) : (
                                        <button type="button" onClick={handleVerifySellerOtp} disabled={sellerOtp.length !== 6} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50">Verify</button>
                                    )}
                                    {sellerOtpSent && sellerOtpTimer > 0 && (
                                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{sellerOtpTimer}s</span>
                                    )}
                                    {sellerMockOtp && <span className="text-xs text-gray-400">Mock: {sellerMockOtp}</span>}
                                    {sellerOtpError && <p className="text-xs text-red-500 w-full">{sellerOtpError}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-dashed border-gray-200 my-4"></div>

                {/* Buyer Details */}
                <div>
                    <h4 className="font-medium text-gray-700 mb-4">Buyer Details</h4>

                    <div className="flex flex-col sm:flex-row sm:gap-4">
                        {/* Buyer Aadhar */}
                        <div className="w-full sm:flex-1">
                            <label className="block text-sm text-gray-500 mb-1.5">Aadhar Number <span className="text-red-400">*</span></label>
                            <div className="relative w-[85%]">
                                <Controller
                                    control={control}
                                    name="buyerAadhar"
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                                const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                                                field.onChange(formatted);
                                            }}
                                            className={`w-full border rounded-lg px-3 py-2.5 pr-20 text-sm transition-all outline-none
                                                ${isBuyerAadharVerified
                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                    : errors.buyerAadhar
                                                        ? 'border-red-300 bg-red-50'
                                                        : 'border-gray-200 focus:border-black'
                                                }`}
                                            placeholder="0000 0000 0000"
                                            maxLength={14}
                                            disabled={isBuyerAadharVerified}
                                        />
                                    )}
                                />
                                {isBuyerAadharVerified && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs font-medium">
                                        <Check size={14} />Verified
                                    </span>
                                )}
                            </div>
                            {/* Aadhar Verification */}
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                                {/* OTP Section */}
                                {buyerAadharOtpVerified ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <Check size={12} />OTP Verified
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={buyerAadharOtp}
                                            onChange={(e) => setBuyerAadharOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className={`w-16 border rounded px-2 py-1 text-xs outline-none
                                                ${!buyerAadhar || buyerAadhar.replace(/\D/g, '').length !== 12
                                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-white border-gray-200 focus:border-black text-black'
                                                }`}
                                            placeholder="OTP"
                                            maxLength={6}
                                            disabled={!buyerAadhar || buyerAadhar.replace(/\D/g, '').length !== 12}
                                        />
                                        {!buyerAadharOtpSent ? (
                                            <button
                                                type="button"
                                                onClick={handleSendBuyerAadharOtp}
                                                disabled={!buyerAadhar || buyerAadhar.replace(/\D/g, '').length !== 12}
                                                className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Send OTP
                                            </button>
                                        ) : (
                                            <button type="button" onClick={handleVerifyBuyerAadharOtp} disabled={buyerAadharOtp.length !== 6} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50">Verify</button>
                                        )}
                                    </div>
                                )}

                                {/* Fingerprint Section */}
                                {buyerFingerprintVerified ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <Check size={12} />Biometric Verified
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-xs hidden sm:inline">&</span>
                                        {isBuyerScanning ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Loader2 size={12} className="animate-spin" />Scanning...</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleBuyerFingerprintScan}
                                                disabled={!buyerAadhar || buyerAadhar.replace(/\D/g, '').length !== 12}
                                                className="inline-flex items-center gap-1 bg-black text-white px-2.5 sm:px-2 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <FingerprintIcon className="w-3 h-3 sm:w-4 sm:h-4" />Fingerprint
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="space-y-1 mt-1">
                                {buyerAadharOtpSent && !buyerAadharOtpVerified && buyerAadharOtpTimer > 0 && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />Resend in {buyerAadharOtpTimer}s</p>
                                )}
                                {buyerAadharMockOtp && !buyerAadharOtpVerified && <p className="text-xs text-gray-400">Mock: {buyerAadharMockOtp}</p>}
                                {buyerAadharError && <p className="text-xs text-red-500 mt-1">{buyerAadharError}</p>}
                            </div>
                        </div>

                        {/* Vertical Separator */}
                        <div className="hidden sm:block w-px border-l border-dashed border-gray-300 mx-4 self-stretch"></div>

                        {/* Buyer Phone */}
                        <div className="w-full mt-4 sm:mt-0 sm:flex-1 sm:pl-6">
                            <label className="block text-sm text-gray-500 mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                            <div className="relative w-[85%]">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                                    <span className="text-gray-400 text-sm">+91</span>
                                    <div className="h-4 w-px border-l border-dashed border-gray-300 ml-2"></div>
                                </div>
                                <Controller
                                    control={control}
                                    name="buyerPhone"
                                    render={({ field }) => (
                                        <input
                                            type="tel"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                const formatted = val.replace(/(\d{5})(?=\d)/g, '$1 ');
                                                field.onChange(formatted);
                                            }}
                                            className={`w-full border rounded-lg py-2.5 pl-16 pr-20 text-sm transition-all outline-none
                                                ${buyerOtpVerified
                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                    : errors.buyerPhone
                                                        ? 'border-red-300 bg-red-50'
                                                        : 'border-gray-200 focus:border-black'
                                                }`}
                                            placeholder="98765 43210"
                                            maxLength={11}
                                            disabled={buyerOtpVerified}
                                        />
                                    )}
                                />
                                {buyerOtpVerified && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs font-medium">
                                        <Check size={14} />Verified
                                    </span>
                                )}
                            </div>
                            {/* Phone OTP */}
                            {buyerOtpVerified ? (
                                <div className="mt-2">
                                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <Check size={12} />Phone Verified
                                    </span>
                                </div>
                            ) : (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        value={buyerOtp}
                                        onChange={(e) => setBuyerOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-16 border border-gray-200 rounded px-2 py-1 text-xs focus:border-black outline-none disabled:opacity-50 disabled:bg-gray-100"
                                        placeholder="OTP"
                                        maxLength={6}
                                        disabled={!buyerPhone || buyerPhone.replace(/\D/g, '').length !== 10}
                                    />
                                    {!buyerOtpSent ? (
                                        <button
                                            type="button"
                                            onClick={handleSendBuyerOtp}
                                            disabled={!buyerPhone || buyerPhone.replace(/\D/g, '').length !== 10}
                                            className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Send OTP
                                        </button>
                                    ) : (
                                        <button type="button" onClick={handleVerifyBuyerOtp} disabled={buyerOtp.length !== 6} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50">Verify</button>
                                    )}
                                    {buyerOtpSent && buyerOtpTimer > 0 && (
                                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{buyerOtpTimer}s</span>
                                    )}
                                    {buyerMockOtp && <span className="text-xs text-gray-400">Mock: {buyerMockOtp}</span>}
                                    {buyerOtpError && <p className="text-xs text-red-500 w-full">{buyerOtpError}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Step Indicator */}
            <div className="flex justify-center items-center">
                <span className="text-gray-500 text-sm font-sans">Step 1 of 3</span>
            </div>
        </div >
    );
};
