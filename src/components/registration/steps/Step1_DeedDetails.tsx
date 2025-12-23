import React from 'react';
import { AlertCircle, Clock, Check, Loader2 } from 'lucide-react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { AnimatedSelect } from '@/components/ui/AnimatedSelect';

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
        formState: { errors },
        watch
    } = form;

    const {
        districts, talukas, villages, surveyNumbers, doorNumbers,
        selectedSurvey, selectedDoor, govtValue, estimatedFee, stampDutyRate,
        handleLocationChange, handleSurveyDoorToggle, locationData,
        surveyOrDoor, setSurveyOrDoor
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

    // Watch verification flags for UI state
    const sellerOtpVerified = watch('sellerOtpVerified');
    const buyerOtpVerified = watch('buyerOtpVerified');
    const sellerFingerprintVerified = watch('sellerFingerprintVerified');
    const buyerFingerprintVerified = watch('buyerFingerprintVerified');

    // Watch location fields for disabled states
    const state = watch('state');
    const district = watch('district');
    const taluka = watch('taluka');
    const village = watch('village');
    const transactionType = watch('transactionType');

    return (
        <div className="space-y-4 sm:space-y-6">

            {/* Location Heading */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-sans font-normal text-black">Location</h3>
                <ResetButton size="sm" onReset={onReset} mobileIconOnly={true} />
            </div>
            <div className="border-t border-dashed border-gray-300 mb-4 sm:mb-6"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                {/* 1. State */}
                <div>
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">State *</label>
                    <Controller
                        control={control}
                        name="state"
                        render={({ field }) => (
                            <AnimatedSelect
                                value={field.value}
                                onChange={(val) => handleLocationChange('state', val)}
                                placeholder="Select State"
                                options={indianStates.map(state => ({ value: state, label: state }))}
                                searchable={true}
                            />
                        )}
                    />
                    {errors.state && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.state.message}
                        </p>
                    )}
                </div>

                {/* 2. District */}
                <div>
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">District *</label>
                    <Controller
                        control={control}
                        name="district"
                        render={({ field }) => (
                            <AnimatedSelect
                                value={field.value}
                                onChange={(val) => handleLocationChange('district', val)}
                                placeholder="Select District"
                                options={districts.map(d => ({ value: d, label: d }))}
                                searchable={true}
                                disabled={!state}
                            />
                        )}
                    />
                    {errors.district && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.district.message}
                        </p>
                    )}
                </div>

                {/* 3. Mandal */}
                <div>
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">Mandal *</label>
                    <Controller
                        control={control}
                        name="taluka"
                        render={({ field }) => (
                            <AnimatedSelect
                                value={field.value}
                                onChange={(val) => handleLocationChange('taluka', val)}
                                placeholder="Select Mandal"
                                options={talukas.map(t => ({ value: t, label: t }))}
                                searchable={true}
                                disabled={!district}
                            />
                        )}
                    />
                    {errors.taluka && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.taluka.message}
                        </p>
                    )}
                </div>

                {/* 4. Village */}
                <div>
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">Village *</label>
                    <Controller
                        control={control}
                        name="village"
                        render={({ field }) => (
                            <AnimatedSelect
                                value={field.value}
                                onChange={(val) => handleLocationChange('village', val)}
                                placeholder="Select Village"
                                options={villages.map(v => ({ value: v, label: v }))}
                                searchable={true}
                                disabled={!taluka}
                            />
                        )}
                    />
                    {errors.village && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.village.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Survey or Door NO.s Heading */}
            <div className="border-t border-dashed border-gray-300 my-4 sm:my-6"></div>
            <h3 className="text-lg font-sans font-normal text-black mb-4">Survey NO. or Door NO.</h3>
            <div className="border-t border-dashed border-gray-300 mb-4 sm:mb-6"></div>

            {/* Radio Button Toggle */}
            <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="radio"
                            name="surveyOrDoor"
                            value="survey"
                            checked={surveyOrDoor === 'survey'}
                            onChange={() => handleSurveyDoorToggle('survey')}
                            className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-colors ${surveyOrDoor === 'survey' ? 'border-black' : 'border-gray-300 group-hover:border-gray-400'}`}>
                            {surveyOrDoor === 'survey' && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                        </div>
                    </div>
                    <span className="text-sm font-sans text-gray-700">Survey Number</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="radio"
                            name="surveyOrDoor"
                            value="door"
                            checked={surveyOrDoor === 'door'}
                            onChange={() => handleSurveyDoorToggle('door')}
                            className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-colors ${surveyOrDoor === 'door' ? 'border-black' : 'border-gray-300 group-hover:border-gray-400'}`}>
                            {surveyOrDoor === 'door' && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                        </div>
                    </div>
                    <span className="text-sm font-sans text-gray-700">Door Number</span>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">
                        {surveyOrDoor === 'survey' ? 'Survey number *' : 'Door number *'}
                    </label>
                    <Controller
                        control={control}
                        name={surveyOrDoor === 'survey' ? 'surveyNumber' : 'doorNumber'}
                        render={({ field }) => (
                            <AnimatedSelect
                                value={field.value || ''}
                                onChange={(val) => handleLocationChange(surveyOrDoor === 'survey' ? 'surveyNumber' : 'doorNumber', val)}
                                placeholder={`Select ${surveyOrDoor === 'survey' ? 'Survey' : 'Door'} Number`}
                                options={surveyOrDoor === 'survey'
                                    ? surveyNumbers.map(s => ({ value: s.number, label: s.number }))
                                    : doorNumbers.map(d => ({ value: d.number, label: d.number }))
                                }
                                searchable={true}
                                disabled={!village}
                            />
                        )}
                    />
                    {(errors.surveyNumber || errors.doorNumber) && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.surveyNumber ? errors.surveyNumber.message : errors.doorNumber?.message}
                        </p>
                    )}
                </div>

                {/* Fee Preview Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-sans md:-mt-9">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Estimated Fees</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Government Value:</span>
                            <span className="font-medium text-black">₹{(selectedSurvey?.govtValue || selectedDoor?.govtValue || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Stamp Duty ({stampDutyRate || 0}%):</span>
                            <span className="font-medium text-black">₹{(((selectedSurvey?.govtValue || selectedDoor?.govtValue || 0) * (stampDutyRate || 0)) / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-700 font-semibold">Total Est. Fee:</span>
                            <span className="font-bold text-black">₹{estimatedFee.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>


            {/* Transaction Details Heading */}
            <div className="border-t border-dashed border-gray-300 my-4 sm:my-6"></div>
            <h3 className="text-lg font-sans font-normal text-black mb-4">Transaction Details</h3>
            <div className="border-t border-dashed border-gray-300 mb-4 sm:mb-6"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 items-end relative">
                {/* Transaction Type */}
                <div className="relative">
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">Transaction type *</label>
                    <Controller
                        control={control}
                        name="transactionType"
                        render={({ field }) => (
                            <AnimatedSelect
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Transaction Type"
                                options={[
                                    { value: 'sale', label: 'Sale' },
                                    { value: 'gift', label: 'Gift' },
                                    { value: 'partition', label: 'Partition' },
                                    { value: 'lease', label: 'Lease' },
                                    { value: 'mortgage', label: 'Mortgage' },
                                    { value: 'exchange', label: 'Exchange' },
                                ]}
                            />
                        )}
                    />
                    {errors.transactionType && (
                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.transactionType.message}
                        </p>
                    )}
                    {/* Vertical Dashed Line Divider (Desktop Only) */}
                    <div className="hidden md:block absolute -right-3 top-8 bottom-0 w-px border-r-2 border-dashed border-gray-200"></div>
                </div>

                {/* Deed Doc Fee + Registration Fees */}
                <div className="relative">
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2 truncate" title="Deed Doc Fee + Registration Fees">
                        Deed Doc Fee + Registration Fees...
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={(() => {
                                const getDeedDocFee = (type: string) => {
                                    if (!type) return 0;
                                    switch (type) {
                                        case 'sale': return 200;
                                        case 'gift': return 1500;
                                        case 'partition': return 500;
                                        case 'lease': return 200;
                                        case 'mortgage': return 500;
                                        case 'exchange': return 500;
                                        default: return 200;
                                    }
                                };
                                const deedFee = getDeedDocFee(transactionType);
                                const regFee = parseFloat(watch('registrationFee') || '0');
                                if (!transactionType) return '';
                                return `${deedFee} + ${regFee}`;
                            })()}
                            readOnly={true}
                            className="w-full border rounded-lg px-4 py-3 focus:outline-none bg-gray-100 text-gray-600 cursor-not-allowed border-gray-300"
                            placeholder="Auto-calculated"
                        />
                    </div>
                    {/* Plus Sign */}
                    <div className="hidden md:flex absolute -right-6 bottom-0 h-11 w-6 items-center justify-center text-gray-400 font-bold text-xl pointer-events-none">
                        +
                    </div>
                </div>

                {/* Stamp Duty */}
                <div className="relative">
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">Stamp duty (₹) *</label>
                    <input
                        type="number"
                        {...register('stampDuty')}
                        readOnly={true}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
                        placeholder="Auto-calculated"
                    />
                    {/* Equals Sign */}
                    <div className="hidden md:flex absolute -right-6 bottom-0 h-11 w-6 items-center justify-center text-gray-400 font-bold text-xl pointer-events-none">
                        =
                    </div>
                </div>

                {/* Total Fee */}
                <div>
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">Total Fee (₹) *</label>
                    <input
                        type="text"
                        value={estimatedFee.toLocaleString()}
                        readOnly={true}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none bg-gray-50 text-black cursor-not-allowed font-bold"
                        placeholder="Auto-calculated"
                    />
                </div>
            </div>

            {/* Parties Involved Heading */}
            <div className="border-t border-dashed border-gray-300 my-4 sm:my-6"></div>
            <h3 className="text-lg font-sans font-normal text-black mb-4">Parties Involved</h3>
            <div className="border-t border-dashed border-gray-300 mb-4 sm:mb-6"></div>

            {/* Seller Details Heading */}
            <h3 className="text-lg font-sans font-normal text-black mb-4">Seller Details</h3>

            {/* Seller Aadhar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">Aadhar number *</label>
                    <div className="relative">
                        <input
                            type="text"
                            {...register('sellerAadhar')}
                            className={`w-full border rounded-lg px-4 py-3 pr-20 transition-all duration-200 outline-none
                                ${sellerFingerprintVerified
                                    ? 'bg-green-50 border-green-200 text-green-800 font-medium cursor-not-allowed'
                                    : errors.sellerAadhar
                                        ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                                        : 'border-gray-200 bg-white text-gray-900 focus:border-black focus:ring-4 focus:ring-gray-100'
                                }`}
                            placeholder="Enter 12-digit Aadhar number"
                            maxLength={12}
                            disabled={!!(sellerFingerprintVerified)}
                        />
                        {sellerFingerprintVerified && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs">
                                <Check size={14} />
                                Verified
                            </span>
                        )}
                    </div>
                    {errors.sellerAadhar && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle size={14} />{errors.sellerAadhar.message}</p>}

                    {/* Aadhar Action Row */}
                    <div className="mt-3">
                        {sellerFingerprintVerified ? (
                            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors">
                                <Check size={14} strokeWidth={2.5} />
                                <span className="text-xs font-medium">Biometric Verified</span>
                            </div>
                        ) : isSellerScanning ? (
                            <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg animate-pulse">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-xs font-medium">Scanning...</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSellerFingerprintScan}
                                className="inline-flex items-center gap-2 bg-black text-white border border-black px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <FingerprintIcon className="text-white w-4 h-4" />
                                <span className="text-xs font-medium">Fingerprint</span>
                            </button>
                        )}
                        {/* Biometric Validation Error */}
                        {!sellerFingerprintVerified && sellerAadharError && (
                            <p className="mt-1.5 text-xs text-red-500 font-medium">{sellerAadharError}</p>
                        )}
                    </div>
                </div>

                {/* Seller Phone */}
                <div>
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">Phone number *</label>
                    <div className="relative">
                        <input
                            type="tel"
                            {...register('sellerPhone')}
                            className={`w-full border rounded-lg px-4 py-3 pr-10 transition-all duration-200 outline-none
                                ${sellerOtpVerified
                                    ? 'bg-green-50 border-green-200 text-green-800 font-medium cursor-not-allowed'
                                    : errors.sellerPhone
                                        ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                                        : 'border-gray-200 bg-white text-gray-900 focus:border-black focus:ring-4 focus:ring-gray-100'
                                }`}
                            placeholder="Enter 10-digit phone number"
                            maxLength={10}
                            disabled={sellerOtpVerified}
                        />
                        {sellerOtpVerified && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs">
                                <Check size={14} />
                                Verified
                            </span>
                        )}
                    </div>
                    {errors.sellerPhone && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle size={14} />{errors.sellerPhone.message}</p>}

                    {/* Sellers OTP */}
                    {!sellerOtpVerified && (
                        <div className="mt-3 space-y-2">
                            <div className="flex items-stretch gap-2">
                                <input
                                    type="text"
                                    value={sellerOtp}
                                    onChange={(e) => setSellerOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className={`w-28 bg-white border rounded-lg px-3 py-1.5 text-black text-xs focus:outline-none focus:border-black transition-all ${sellerOtpError ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-gray-100'}`}
                                    placeholder="Enter OTP"
                                    maxLength={6}
                                />
                                {!sellerOtpSent ? (
                                    <button type="button" onClick={handleSendSellerOtp} className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors whitespace-nowrap">Send OTP</button>
                                ) : (
                                    <button type="button" onClick={handleVerifySellerOtp} disabled={sellerOtp.length !== 6} className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">Verify</button>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                {sellerOtpSent && (
                                    <div className="flex items-center gap-3 text-xs w-full">
                                        {sellerOtpTimer > 0 ? (
                                            <span className="flex items-center gap-1 text-gray-500 font-medium"><Clock size={12} /> Resend in {sellerOtpTimer}s</span>
                                        ) : (
                                            <button type="button" onClick={handleResendSellerOtp} className="text-black underline decoration-gray-400 hover:text-gray-700 font-medium">Resend OTP</button>
                                        )}
                                        {sellerMockOtp && <span className="text-gray-400 ml-auto font-mono bg-gray-100 px-2 py-0.5 rounded">Mock: {sellerMockOtp}</span>}
                                    </div>
                                )}
                                {sellerOtpError && <p className="text-xs text-red-500 font-medium flex-1 text-right">{sellerOtpError}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-300 my-6"></div>

            {/* Buyer Details Heading */}
            <h3 className="text-lg font-sans font-normal text-black mb-4">Buyer Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Buyer Aadhar */}
                <div>
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">Aadhar number *</label>
                    <div className="relative">
                        <input
                            type="text"
                            {...register('buyerAadhar')}
                            className={`w-full border rounded-lg px-4 py-3 pr-20 transition-all duration-200 outline-none
                                ${buyerFingerprintVerified
                                    ? 'bg-green-50 border-green-200 text-green-800 font-medium cursor-not-allowed'
                                    : errors.buyerAadhar
                                        ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                                        : 'border-gray-200 bg-white text-gray-900 focus:border-black focus:ring-4 focus:ring-gray-100'
                                }`}
                            placeholder="Enter 12-digit Aadhar number"
                            maxLength={12}
                            disabled={!!(buyerFingerprintVerified)}
                        />
                        {buyerFingerprintVerified && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs">
                                <Check size={14} />
                                Verified
                            </span>
                        )}
                    </div>
                    {errors.buyerAadhar && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle size={14} />{errors.buyerAadhar.message}</p>}

                    {/* Fingerprint */}
                    <div className="mt-3">
                        {buyerFingerprintVerified ? (
                            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors">
                                <Check size={14} strokeWidth={2.5} />
                                <span className="text-xs font-medium">Biometric Verified</span>
                            </div>
                        ) : isBuyerScanning ? (
                            <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg animate-pulse">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-xs font-medium">Scanning...</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleBuyerFingerprintScan}
                                className="inline-flex items-center gap-2 bg-black text-white border border-black px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <FingerprintIcon className="text-white w-4 h-4" />
                                <span className="text-xs font-medium">Fingerprint</span>
                            </button>
                        )}
                        {/* Biometric Validation Error */}
                        {!buyerFingerprintVerified && buyerAadharError && (
                            <p className="mt-1.5 text-xs text-red-500 font-medium">{buyerAadharError}</p>
                        )}
                    </div>
                </div>

                {/* Buyer Phone */}
                <div>
                    <label className="block text-sm font-sans font-normal text-gray-700 mb-2">Phone number *</label>
                    <div className="relative">
                        <input
                            type="tel"
                            {...register('buyerPhone')}
                            className={`w-full border rounded-lg px-4 py-3 pr-10 transition-all duration-200 outline-none
                                ${buyerOtpVerified
                                    ? 'bg-green-50 border-green-200 text-green-800 font-medium cursor-not-allowed'
                                    : errors.buyerPhone
                                        ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                                        : 'border-gray-200 bg-white text-gray-900 focus:border-black focus:ring-4 focus:ring-gray-100'
                                }`}
                            placeholder="Enter 10-digit phone number"
                            maxLength={10}
                            disabled={buyerOtpVerified}
                        />
                        {buyerOtpVerified && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs">
                                <Check size={14} />
                                Verified
                            </span>
                        )}
                    </div>
                    {errors.buyerPhone && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle size={14} />{errors.buyerPhone.message}</p>}

                    {/* Buyer OTP */}
                    {!buyerOtpVerified && (
                        <div className="mt-3 space-y-2">
                            <div className="flex items-stretch gap-2">
                                <input
                                    type="text"
                                    value={buyerOtp}
                                    onChange={(e) => setBuyerOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className={`w-28 bg-white border rounded-lg px-3 py-1.5 text-black text-xs focus:outline-none focus:border-black transition-all ${buyerOtpError ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-gray-100'}`}
                                    placeholder="Enter OTP"
                                    maxLength={6}
                                />
                                {!buyerOtpSent ? (
                                    <button type="button" onClick={handleSendBuyerOtp} className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors whitespace-nowrap">Send OTP</button>
                                ) : (
                                    <button type="button" onClick={handleVerifyBuyerOtp} disabled={buyerOtp.length !== 6} className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">Verify</button>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                {buyerOtpSent && (
                                    <div className="flex items-center gap-3 text-xs w-full">
                                        {buyerOtpTimer > 0 ? (
                                            <span className="flex items-center gap-1 text-gray-500 font-medium"><Clock size={12} /> Resend in {buyerOtpTimer}s</span>
                                        ) : (
                                            <button type="button" onClick={handleResendBuyerOtp} className="text-black underline decoration-gray-400 hover:text-gray-700 font-medium">Resend OTP</button>
                                        )}
                                        {buyerMockOtp && <span className="text-gray-400 ml-auto font-mono bg-gray-100 px-2 py-0.5 rounded">Mock: {buyerMockOtp}</span>}
                                    </div>
                                )}
                                {buyerOtpError && <p className="text-xs text-red-500 font-medium flex-1 text-right">{buyerOtpError}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};
