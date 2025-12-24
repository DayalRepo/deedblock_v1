import { z } from 'zod';

// Helper for file validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

// For document fields - use any() to allow both File objects and hydrated empty objects {}
// Actual validation is done in the step navigation logic which can also check draftDocumentUrls
const documentFieldSchema = z.any().nullable();

// Helper function to validate a file (for use in components/pages)
export function isValidFile(file: unknown): file is File {
    return file instanceof File && file.size > 0;
}

// Helper to validate file size
export function isFileSizeValid(file: File): boolean {
    return file.size <= MAX_FILE_SIZE;
}

// Helper to validate file type
export function isFileTypeValid(file: File): boolean {
    return ACCEPTED_FILE_TYPES.includes(file.type);
}

// Helper to check if a document is uploaded (either as File or in draftDocumentUrls)
export function isDocumentUploaded(
    file: unknown,
    draftUrl: { url: string; path: string } | null | undefined
): boolean {
    return isValidFile(file) || (!!draftUrl?.url && !!draftUrl?.path);
}

export const registrationSchema = z.object({
    // Step 1: Deed Details
    surveyNumber: z.string().optional(), // validated conditionally based on surveyOrDoor
    doorNumber: z.string().optional(),
    village: z.string().min(1, 'Village is required'),
    taluka: z.string().min(1, 'Mandal/Taluka is required'),
    district: z.string().min(1, 'District is required'),
    state: z.string().min(1, 'State is required'),

    transactionType: z.string().min(1, 'Transaction Type is required'),
    considerationAmount: z.string().min(1, 'Value is required').refine(val => parseFloat(val) > 0, 'Must be greater than 0'),
    stampDuty: z.string(),
    registrationFee: z.string(),

    // Parties
    sellerAadhar: z.string().refine((val) => val.replace(/\s/g, '').length === 12 && /^\d+$/.test(val.replace(/\s/g, '')), 'Aadhar must be 12 digits'),
    sellerPhone: z.string().min(1, 'Phone is required').refine((val) => val.replace(/\D/g, '').length === 10, 'Phone must be 10 digits'),
    sellerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),

    buyerAadhar: z.string().refine((val) => val.replace(/\s/g, '').length === 12 && /^\d+$/.test(val.replace(/\s/g, '')), 'Aadhar must be 12 digits'),
    buyerPhone: z.string().min(1, 'Phone is required').refine((val) => val.replace(/\D/g, '').length === 10, 'Phone must be 10 digits'),
    buyerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),

    // Documents - use permissive schema, validation done in navigation logic
    documents: z.object({
        saleDeed: documentFieldSchema,
        ec: documentFieldSchema,
        khata: documentFieldSchema,
        taxReceipt: documentFieldSchema,
    }),

    propertyPhotos: z.array(z.any()) // Changed to any() to allow hydrated empty objects
        .max(6, 'Max 6 photos allowed'),

    // Draft file storage - Supabase Storage URLs and paths for persistence
    draftDocumentUrls: z.object({
        saleDeed: z.object({ url: z.string(), path: z.string() }).nullable().optional(),
        ec: z.object({ url: z.string(), path: z.string() }).nullable().optional(),
        khata: z.object({ url: z.string(), path: z.string() }).nullable().optional(),
        taxReceipt: z.object({ url: z.string(), path: z.string() }).nullable().optional(),
    }).optional(),

    draftPhotoUrls: z.array(z.object({
        url: z.string(),
        path: z.string(),
        name: z.string()
    })).optional(),

    // Verification Flags
    sellerOtpVerified: z.boolean().default(false),
    buyerOtpVerified: z.boolean().default(false),
    sellerFingerprintVerified: z.boolean().default(false),
    buyerFingerprintVerified: z.boolean().default(false),
    sellerAadharOtpVerified: z.boolean().default(false),
    buyerAadharOtpVerified: z.boolean().default(false),
    declarationChecked: z.boolean().default(false),

    // Payment
    paymentId: z.string().optional(),
});

export type RegistrationFormSchema = z.infer<typeof registrationSchema>;
