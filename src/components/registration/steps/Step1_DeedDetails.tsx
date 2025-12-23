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
    const isSellerAadharVerified = sellerFingerprintVerified || sellerAadharOtpVerified;
    const isBuyerAadharVerified = buyerFingerprintVerified || buyerAadharOtpVerified;

    // Watch location fields
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {/* State */}
                    <div>
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
                                />
                            )}
                        />
                        {errors.state && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} />{errors.state.message}
                            </p>
                        )}
                    </div>

                    {/* District */}
                    <div>
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
                                />
                            )}
                        />
                        {errors.district && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} />{errors.district.message}
                            </p>
                        )}
                    </div>

                    {/* Mandal */}
                    <div>
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
                                />
                            )}
                        />
                        {errors.taluka && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} />{errors.taluka.message}
                            </p>
                        )}
                    </div>

                    {/* Village */}
                    <div>
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
                                />
                            )}
                        />
                        {errors.village && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} />{errors.village.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Property Identification */}
            <div>
                <h3 className="text-lg font-sans font-normal text-black mb-2">Property Identification</h3>
                <div className="border-t border-dashed border-gray-300 mb-4"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Radio Toggle */}
                    <div>
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

                        <div className="mt-3">
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
                                    />
                                )}
                            />
                            {(errors.surveyNumber || errors.doorNumber) && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    {errors.surveyNumber?.message || errors.doorNumber?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Fee Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Estimated Fees</h4>
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-end">
                    {/* Transaction Type */}
                    <div>
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
                                />
                            )}
                        />
                        {errors.transactionType && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} />{errors.transactionType.message}
                            </p>
                        )}
                    </div>

                    {/* Deed Doc Fee */}
                    <div>
                        <label className="block text-sm text-gray-500 mb-1.5">Deed Fee</label>
                        <input
                            type="text"
                            value={transactionType ? `₹${getDeedDocFee(transactionType)}` : '-'}
                            readOnly
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
                        />
                    </div>

                    {/* Stamp Duty */}
                    <div>
                        <label className="block text-sm text-gray-500 mb-1.5">Stamp Duty</label>
                        <input
                            type="text"
                            {...register('stampDuty')}
                            readOnly
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
                            placeholder="-"
                        />
                    </div>

                    {/* Total Fee */}
                    <div>
                        <label className="block text-sm text-gray-500 mb-1.5">Total Fee</label>
                        <input
                            type="text"
                            value={`₹${estimatedFee.toLocaleString()}`}
                            readOnly
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-black font-medium text-sm cursor-not-allowed"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Seller Aadhar */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-1.5">Aadhar Number <span className="text-red-400">*</span></label>
                            <div className="relative">
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
                                            className={`w-full border rounded-lg px-3 py-2.5 pr-16 text-sm transition-all outline-none
                                                ${isSellerAadharVerified
                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                    : errors.sellerAadhar
                                                        ? 'border-red-300 bg-red-50'
                                                        : 'border-gray-200 focus:border-black'
                                                }`}
                                            placeholder="0000 0000 0000"
                                            maxLength={14}
                                            disabled={isSellerAadharVerified}
                                        />
                                    )}
                                />
                                {isSellerAadharVerified && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs">
                                        <Check size={14} />Verified
                                    </span>
                                )}
                            </div>
                            {errors.sellerAadhar && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} />{errors.sellerAadhar.message}
                                </p>
                            )}

                            {/* Aadhar Verification */}
                            <div className="mt-2">
                                {isSellerAadharVerified ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <Check size={12} />Aadhar Verified
                                    </span>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="text"
                                            value={sellerAadharOtp}
                                            onChange={(e) => setSellerAadharOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-16 border border-gray-200 rounded px-2 py-1 text-xs focus:border-black outline-none"
                                            placeholder="OTP"
                                            maxLength={6}
                                        />
                                        {!sellerAadharOtpSent ? (
                                            <button type="button" onClick={handleSendSellerAadharOtp} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800">Send OTP</button>
                                        ) : (
                                            <button type="button" onClick={handleVerifySellerAadharOtp} disabled={sellerAadharOtp.length !== 6} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50">Verify</button>
                                        )}
                                        <span className="text-gray-400 text-xs hidden sm:inline">or</span>
                                        {isSellerScanning ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Loader2 size={12} className="animate-spin" />Scanning...</span>
                                        ) : (
                                            <button type="button" onClick={handleSellerFingerprintScan} className="inline-flex items-center gap-1 bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800">
                                                <FingerprintIcon className="w-3 h-3" />Fingerprint
                                            </button>
                                        )}
                                    </div>
                                )}
                                {sellerAadharOtpSent && sellerAadharOtpTimer > 0 && (
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} />Resend in {sellerAadharOtpTimer}s</p>
                                )}
                                {sellerAadharMockOtp && <p className="text-xs text-gray-400 mt-1">Mock: {sellerAadharMockOtp}</p>}
                                {sellerAadharOtpError && <p className="text-xs text-red-500 mt-1">{sellerAadharOtpError}</p>}
                                {sellerAadharError && <p className="text-xs text-red-500 mt-1">{sellerAadharError}</p>}
                            </div>
                        </div>

                        {/* Seller Phone */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+91</span>
                                <Controller
                                    control={control}
                                    name="sellerPhone"
                                    render={({ field }) => (
                                        <input
                                            type="tel"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                field.onChange(val);
                                            }}
                                            className={`w-full border rounded-lg py-2.5 pl-12 pr-16 text-sm transition-all outline-none
                                                ${sellerOtpVerified
                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                    : errors.sellerPhone
                                                        ? 'border-red-300 bg-red-50'
                                                        : 'border-gray-200 focus:border-black'
                                                }`}
                                            placeholder="98765 43210"
                                            maxLength={10}
                                            disabled={sellerOtpVerified}
                                        />
                                    )}
                                />
                                {sellerOtpVerified && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs">
                                        <Check size={14} />Verified
                                    </span>
                                )}
                            </div>
                            {errors.sellerPhone && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} />{errors.sellerPhone.message}
                                </p>
                            )}

                            {/* Phone OTP */}
                            {!sellerOtpVerified && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        value={sellerOtp}
                                        onChange={(e) => setSellerOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-16 border border-gray-200 rounded px-2 py-1 text-xs focus:border-black outline-none"
                                        placeholder="OTP"
                                        maxLength={6}
                                    />
                                    {!sellerOtpSent ? (
                                        <button type="button" onClick={handleSendSellerOtp} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800">Send OTP</button>
                                    ) : (
                                        <button type="button" onClick={handleVerifySellerOtp} disabled={sellerOtp.length !== 6} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50">Verify</button>
                                    )}
                                    {sellerOtpSent && sellerOtpTimer > 0 && (
                                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{sellerOtpTimer}s</span>
                                    )}
                                    {sellerMockOtp && <span className="text-xs text-gray-400">Mock: {sellerMockOtp}</span>}
                                </div>
                            )}
                            {sellerOtpError && <p className="text-xs text-red-500 mt-1">{sellerOtpError}</p>}
                        </div>
                    </div>
                </div>

                <div className="border-t border-dashed border-gray-200 my-4"></div>

                {/* Buyer Details */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Buyer Details</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Buyer Aadhar */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-1.5">Aadhar Number <span className="text-red-400">*</span></label>
                            <div className="relative">
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
                                            className={`w-full border rounded-lg px-3 py-2.5 pr-16 text-sm transition-all outline-none
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
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs">
                                        <Check size={14} />Verified
                                    </span>
                                )}
                            </div>
                            {errors.buyerAadhar && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} />{errors.buyerAadhar.message}
                                </p>
                            )}

                            {/* Aadhar Verification */}
                            <div className="mt-2">
                                {isBuyerAadharVerified ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <Check size={12} />Aadhar Verified
                                    </span>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="text"
                                            value={buyerAadharOtp}
                                            onChange={(e) => setBuyerAadharOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-16 border border-gray-200 rounded px-2 py-1 text-xs focus:border-black outline-none"
                                            placeholder="OTP"
                                            maxLength={6}
                                        />
                                        {!buyerAadharOtpSent ? (
                                            <button type="button" onClick={handleSendBuyerAadharOtp} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800">Send OTP</button>
                                        ) : (
                                            <button type="button" onClick={handleVerifyBuyerAadharOtp} disabled={buyerAadharOtp.length !== 6} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50">Verify</button>
                                        )}
                                        <span className="text-gray-400 text-xs hidden sm:inline">or</span>
                                        {isBuyerScanning ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Loader2 size={12} className="animate-spin" />Scanning...</span>
                                        ) : (
                                            <button type="button" onClick={handleBuyerFingerprintScan} className="inline-flex items-center gap-1 bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800">
                                                <FingerprintIcon className="w-3 h-3" />Fingerprint
                                            </button>
                                        )}
                                    </div>
                                )}
                                {buyerAadharOtpSent && buyerAadharOtpTimer > 0 && (
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} />Resend in {buyerAadharOtpTimer}s</p>
                                )}
                                {buyerAadharMockOtp && <p className="text-xs text-gray-400 mt-1">Mock: {buyerAadharMockOtp}</p>}
                                {buyerAadharOtpError && <p className="text-xs text-red-500 mt-1">{buyerAadharOtpError}</p>}
                                {buyerAadharError && <p className="text-xs text-red-500 mt-1">{buyerAadharError}</p>}
                            </div>
                        </div>

                        {/* Buyer Phone */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+91</span>
                                <Controller
                                    control={control}
                                    name="buyerPhone"
                                    render={({ field }) => (
                                        <input
                                            type="tel"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                field.onChange(val);
                                            }}
                                            className={`w-full border rounded-lg py-2.5 pl-12 pr-16 text-sm transition-all outline-none
                                                ${buyerOtpVerified
                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                    : errors.buyerPhone
                                                        ? 'border-red-300 bg-red-50'
                                                        : 'border-gray-200 focus:border-black'
                                                }`}
                                            placeholder="98765 43210"
                                            maxLength={10}
                                            disabled={buyerOtpVerified}
                                        />
                                    )}
                                />
                                {buyerOtpVerified && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs">
                                        <Check size={14} />Verified
                                    </span>
                                )}
                            </div>
                            {errors.buyerPhone && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} />{errors.buyerPhone.message}
                                </p>
                            )}

                            {/* Phone OTP */}
                            {!buyerOtpVerified && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        value={buyerOtp}
                                        onChange={(e) => setBuyerOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-16 border border-gray-200 rounded px-2 py-1 text-xs focus:border-black outline-none"
                                        placeholder="OTP"
                                        maxLength={6}
                                    />
                                    {!buyerOtpSent ? (
                                        <button type="button" onClick={handleSendBuyerOtp} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800">Send OTP</button>
                                    ) : (
                                        <button type="button" onClick={handleVerifyBuyerOtp} disabled={buyerOtp.length !== 6} className="bg-black text-white px-2.5 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50">Verify</button>
                                    )}
                                    {buyerOtpSent && buyerOtpTimer > 0 && (
                                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{buyerOtpTimer}s</span>
                                    )}
                                    {buyerMockOtp && <span className="text-xs text-gray-400">Mock: {buyerMockOtp}</span>}
                                </div>
                            )}
                            {buyerOtpError && <p className="text-xs text-red-500 mt-1">{buyerOtpError}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Step Indicator */}
            <div className="flex justify-center items-center">
                <span className="text-gray-500 text-sm font-sans">1</span>
            </div>
        </div>
    );
};
