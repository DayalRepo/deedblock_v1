export interface FormData {
    // Location Details
    surveyNumber: string;
    doorNumber: string;
    village: string;
    taluka: string;
    district: string;
    state: string;

    // Transaction Details
    transactionType: string;
    considerationAmount: string;
    stampDuty: string;
    registrationFee: string;

    // Parties
    sellerAadhar: string;
    sellerPhone: string;
    sellerEmail: string;
    buyerAadhar: string;
    buyerPhone: string;
    buyerEmail: string;

    // Documents
    documents: {
        DeedDoc: File | null;
        EC: File | null;
        SellerAadhar: File | null;
        BuyerAadhar: File | null;
    };

    // Property Photos
    propertyPhotos: File[];

    // Verification States
    sellerOtpVerified: boolean;
    buyerOtpVerified: boolean;
    sellerAadharVerified: boolean | null;
    buyerAadharVerified: boolean | null;
    sellerAadharOtpVerified: boolean;
    buyerAadharOtpVerified: boolean;
    sellerFingerprintVerified: boolean;
    buyerFingerprintVerified: boolean;
    declarationChecked: boolean;
}
