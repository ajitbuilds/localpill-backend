import { z } from 'zod';

// ============= AUTH SCHEMAS =============

export const sendOTPSchema = z.object({
    phone: z.string()
        .min(10, 'Phone number must be at least 10 characters')
        .startsWith('+', 'Phone number must start with country code (e.g., +91)')
        .max(15, 'Phone number too long'),
});

export const verifyOTPSchema = z.object({
    phone: z.string().min(10).startsWith('+'),
    idToken: z.string().min(1, 'ID token is required'),
});

export const registerPartnerSchema = z.object({
    phone: z.string().min(10).startsWith('+').optional(),
    email: z.string().email().optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    idToken: z.string().min(1),
});

export const googleLoginSchema = z.object({
    idToken: z.string().min(1, 'ID token is required'),
});

// ============= CUSTOMER SCHEMAS =============

export const createRequestSchema = z.object({
    patient_name: z.string().min(2, 'Patient name required').max(100),
    patient_phone: z.string().min(10, 'Valid phone number required'),
    patient_address: z.string().min(5, 'Address required').max(500),
    patient_latitude: z.number().optional(),
    patient_longitude: z.number().optional(),
    medicines: z.array(
        z.union([
            z.string().min(1),
            z.object({
                name: z.string().min(1),
                quantity: z.number().min(1).default(1),
                dosage: z.string().optional(),
            })
        ])
    ).min(1, 'At least one medicine required'),
    prescription_image_url: z.string().url().optional(),
    has_prescription: z.boolean().optional().default(false),
    is_emergency: z.boolean().optional().default(false),
});

// ============= PARTNER SCHEMAS =============

export const respondToRequestSchema = z.object({
    totalPrice: z.number().min(0, 'Price must be positive'),
    estimatedTime: z.number().min(1, 'Estimated time required'),
    notes: z.string().max(500).optional(),
});

export const updatePharmacyProfileSchema = z.object({
    // User/Pharmacist Fields
    name: z.string().min(2).max(100).optional(),
    bio: z.string().max(1000).optional(),
    languages: z.string().max(200).optional(),
    qualification: z.string().optional(),
    experience: z.number().optional(), // Can be string in frontend but backend expects number usually, checking controller... controller whitelist allows it but doesn't cast. Frontend sends number? 
    regNumber: z.string().optional(),
    stateCouncil: z.string().optional(),
    additionalQuals: z.array(z.string()).optional(),
    socialLinks: z.object({
        linkedin: z.string().optional(),
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        x: z.string().optional(),
    }).optional(),

    // Store Fields (keeping existing ones just in case)
    address: z.string().min(5).max(500).optional(),
    phone: z.string().min(10).max(15).optional(),
    licenseNumber: z.string().optional(),
    gstNumber: z.string().optional(),
    operatingHours: z.object({
        open: z.string(),
        close: z.string(),
    }).optional(),
    isOpen: z.boolean().optional(),
    profileImage: z.string().optional(),
});

// ============= AGENT SCHEMAS =============

export const createPharmacySchema = z.object({
    name: z.string().min(2, 'Pharmacy name required').max(200),
    ownerName: z.string().min(2, 'Owner name required').max(100),
    ownerPhone: z.string().min(10, 'Valid phone number required'),
    address: z.string().min(5, 'Address required').max(500),
    licenseNumber: z.string().min(3, 'License number required'),
    gstNumber: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
});

export const rejectPharmacySchema = z.object({
    reason: z.string().min(5, 'Rejection reason required').max(500),
});

// ============= CHAT SCHEMAS =============

export const sendMessageSchema = z.object({
    message: z.string().max(2000).optional(),
    type: z.enum(['text', 'image']).default('text'),
    imageUrl: z.string().url().optional(),
}).refine(
    (data) => data.message || data.type === 'image',
    { message: 'Message content required for text messages' }
);

// ============= FILE UPLOAD SCHEMAS =============

export const uploadFileSchema = z.object({
    fileData: z.string().min(1, 'File data required'),
    fileName: z.string().min(1, 'File name required'),
    contentType: z.enum([
        'image/jpeg', 'image/png', 'image/webp', 'application/pdf'
    ]).optional().default('image/jpeg'),
    folder: z.string().optional().default('uploads'),
});
