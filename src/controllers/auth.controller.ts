import { Request, Response } from 'express';
import { auth, db } from '../config/firebase';
import { Collections } from '../models';
import config from '../config';

/**
 * Send OTP to phone number using Firebase Auth
 */
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone } = req.body;

        if (!phone || !phone.startsWith('+')) {
            res.status(400).json({ error: 'Valid phone number with country code required (e.g., +919876543210)' });
            return;
        }

        // Firebase Auth handles OTP sending automatically
        // Client-side will use Firebase Authentication SDK for OTP
        // This endpoint is mainly for validation and user creation

        // Check if user exists
        let userRecord;
        try {
            userRecord = await auth.getUserByPhoneNumber(phone);
        } catch (error) {
            // User doesn't exist - will be created after OTP verification
            res.json({
                success: true,
                message: 'OTP sent successfully',
                isNewUser: true,
            });
            return;
        }

        res.json({
            success: true,
            message: 'OTP sent successfully',
            isNewUser: false,
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

/**
 * Verify OTP and create/login user
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, idToken } = req.body;

        if (!phone || !idToken) {
            res.status(400).json({ error: 'Phone and ID token required' });
            return;
        }

        // Verify Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);

        if (decodedToken.phone_number !== phone) {
            res.status(400).json({ error: 'Phone number mismatch' });
            return;
        }

        // Check if user exists in Firestore
        const userRef = db.collection(Collections.USERS).doc(phone);
        const userDoc = await userRef.get();

        let userData;

        if (!userDoc.exists) {
            // Create new user
            userData = {
                id: phone,
                phone,
                name: '', // Will be updated during onboarding
                role: 'customer', // Default role
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await userRef.set(userData);
        } else {
            userData = userDoc.data();
        }

        res.json({
            success: true,
            token: idToken,
            user: userData,
            isNewUser: !userDoc.exists,
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
};

/**
 * Partner registration
 */
/**
 * Partner registration (supports Phone and Email auth)
 */
export const registerPartner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, email, name, idToken } = req.body;

        if (!idToken) {
            res.status(400).json({ error: 'ID token is required' });
            return;
        }

        // Verify token
        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, phone_number, email: tokenEmail } = decodedToken;

        // Determine User ID and Data
        let userId = uid; // Default to UID
        const updateData: any = {
            name,
            role: 'partner',
            updatedAt: new Date(),
        };

        if (phone_number) {
            // Legacy/Phone Auth Flow
            if (phone && phone !== phone_number) {
                res.status(400).json({ error: 'Phone number mismatch' });
                return;
            }
            userId = phone_number; // Keep using phone as ID for backward compatibility
            updateData.id = phone_number;
            updateData.phone = phone_number;
        } else {
            // Email Auth Flow
            userId = uid;
            updateData.id = uid;
            updateData.email = tokenEmail || email;
            if (phone) updateData.phone = phone; // Store optional phone
        }

        // Create or Update user with 'partner' role
        const userRef = db.collection(Collections.USERS).doc(userId);

        // Use set with merge to handle both existing users (phone) and new users (email)
        await userRef.set(updateData, { merge: true });

        // Set custom claim for role
        await auth.setCustomUserClaims(uid, { role: 'partner' });

        res.json({
            success: true,
            message: 'Partner registered successfully',
            userId
        });
    } catch (error) {
        console.error('Partner registration error:', error);
        res.status(500).json({ error: 'Failed to register partner' });
    }
};

/**
 * Google OAuth login for Field Agent
 */
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            res.status(400).json({ error: 'ID token required' });
            return;
        }

        // Verify Google ID token
        const decodedToken = await auth.verifyIdToken(idToken);

        const { email, uid, name } = decodedToken;

        // Check if agent exists
        const agentRef = db.collection(Collections.USERS).doc(email!);
        const agentDoc = await agentRef.get();

        let agentData;

        if (!agentDoc.exists) {
            // Create new agent
            agentData = {
                id: email,
                phone: '', // Optional for agents
                name: name || '',
                role: 'agent',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await agentRef.set(agentData);

            // Set custom claim
            await auth.setCustomUserClaims(uid, { role: 'agent' });
        } else {
            agentData = agentDoc.data();
        }

        res.json({
            success: true,
            token: idToken,
            user: agentData,
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ error: 'Failed to login with Google' });
    }
};
