import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
let serviceAccount: any;

// Try to use service account file first (optional)
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
        serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        console.log('Using Firebase Service Account from file');
    } catch (error) {
        console.log('Service account file not found, using Project ID');
        serviceAccount = null;
    }
}

// Initialize Firebase
if (serviceAccount) {
    // Method 1: Using service account file
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} else if (process.env.FIREBASE_PROJECT_ID) {
    // Method 2: Using just Project ID (for development)
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('Firebase initialized with Project ID:', process.env.FIREBASE_PROJECT_ID);
} else {
    console.error('Firebase configuration missing!');
    console.error('Set either FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID');
    process.exit(1);
}

// Export Firebase services
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

console.log('Firebase Admin SDK ready');

export default admin;
