import { z } from 'zod';

// Helper for file validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

// For document fields that are nullable initially but required on submission
const requiredFileSchema = z
    .instanceof(File, { message: 'File is required' })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
        (file) => ACCEPTED_FILE_TYPES.includes(file.type),
        'Only .jpg, .png, .webp and .pdf files are accepted.'
    )
    .nullable();

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
    sellerPhone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
    sellerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),

    buyerAadhar: z.string().refine((val) => val.replace(/\s/g, '').length === 12 && /^\d+$/.test(val.replace(/\s/g, '')), 'Aadhar must be 12 digits'),
    buyerPhone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
    buyerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),

    // Documents (nullable initially, required on submission - validated in submission handler)
    documents: z.object({
        saleDeed: requiredFileSchema,
        ec: requiredFileSchema,
        khata: requiredFileSchema,
        taxReceipt: requiredFileSchema,
    }),

    propertyPhotos: z.array(z.instanceof(File))
        .max(6, 'Max 6 photos allowed'),

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
