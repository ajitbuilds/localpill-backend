/**
 * Firestore Data Models for LocalPill Platform
 * Collections structure following Firebase best practices
 */

// ========================
// USER COLLECTION
// ========================
export interface User {
    id: string; // Phone number OR Firebase UID (for email users)
    phone?: string;
    email?: string;
    name: string;
    role: 'customer' | 'partner' | 'agent';
    createdAt: Date;
    updatedAt: Date;
    // Customer-specific
    addresses?: Address[];
    // Partner-specific
    pharmacyId?: string; // Reference to pharmacy doc
    // Agent-specific
    employeeId?: string;

    // Professional Profile (Partners)
    bio?: string;
    languages?: string; // Comma separated
    qualification?: string;
    experience?: number;
    regNumber?: string;
    stateCouncil?: string;
    additionalQuals?: string[];
    socialLinks?: {
        linkedin?: string;
        instagram?: string;
        facebook?: string;
        x?: string;
    };
    profileImage?: string;
}

export interface Address {
    id: string;
    label: string; // "Home", "Work",  etc
    fullAddress: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
}

// ========================
// PHARMACY COLLECTION
// ========================
export interface Pharmacy {
    id: string;
    name: string;
    ownerId: string; // Reference to user (partner)
    ownerPhone: string;
    ownerName: string;

    // Location
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    pincode: string;

    // License & Verification
    licenseNumber: string;
    gstNumber?: string;
    status: 'draft' | 'pending' | 'verified' | 'rejected';
    verifiedBy?: string; // Agent ID
    verifiedAt?: Date;
    rejectionReason?: string;

    // Documents (Firebase Storage URLs)
    documents: {
        licenseImage?: string;
        storeImage?: string;
        ownerIdProof?: string;
    };

    // Operational
    isOpen: boolean;
    availability: 'online' | 'busy' | 'offline';
    operatingHours?: {
        [key: string]: { // "monday", "tuesday", etc.
            open: string; // "09:00"
            close: string; // "21:00"
        };
    };

    // Stats
    rating: number;
    totalRatings: number;
    totalRequests: number;
    totalAccepted: number;

    createdAt: Date;
    updatedAt: Date;
}

// ========================
// MEDICATION REQUEST COLLECTION
// ========================
export interface MedicationRequest {
    id: string;
    customerId: string;
    customerPhone: string;
    customerName: string;

    // Medicines
    medicines: Medicine[];
    hasPrescription: boolean;
    prescriptionUrl?: string; // Firebase Storage URL

    // Patient details
    patientName: string;
    patientPhone: string;
    patientAddress: string;
    patientLatitude: number;
    patientLongitude: number;

    // Request metadata
    isEmergency: boolean;
    urgency: 'normal' | 'urgent';
    notes?: string;

    // Status & Assignment
    status: 'pending' | 'broadcasting' | 'assigned' | 'accepted' | 'rejected' | 'cancelled' | 'expired' | 'completed';
    pharmacyId?: string; //  After acceptance
    pharmacyName?: string;

    // Response from pharmacy
    response?: {
        totalPrice: number;
        estimatedTime: number; // minutes
        notes?: string;
        respondedAt: Date;
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

export interface Medicine {
    name: string;
    quantity: number;
    dosage?: string;
    available?: boolean;
    price?: number;
    alternativeName?: string;
}

// ========================
// CHAT COLLECTION
// ========================
export interface Chat {
    id: string;
    requestId: string;
    participants: {
        customerId: string;
        customerName: string;
        pharmacyId: string;
        pharmacyName: string;
    };
    lastMessage?: string;
    lastMessageAt?: Date;
    createdAt: Date;
}

// Sub-collection: messages
export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    senderRole: 'customer' | 'partner';
    message: string;
    type: 'text' | 'image';
    imageUrl?: string;
    isRead: boolean;
    createdAt: Date;
}

// ========================
// NOTIFICATION COLLECTION
// ========================
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'request' | 'chat' | 'status' | 'system';
    relatedId?: string; // Request ID or Chat ID
    isRead: boolean;
    createdAt: Date;
}

// ========================
// FIRESTORE COLLECTION NAMES
// ========================
export const Collections = {
    USERS: 'users',
    PHARMACIES: 'pharmacies',
    REQUESTS: 'requests',
    CHATS: 'chats',
    CHAT_MESSAGES: 'chat_messages',
    NOTIFICATIONS: 'notifications',
} as const;
