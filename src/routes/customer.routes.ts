import { Router, Response } from 'express';
import {
    createRequest,
    getMyRequests,
    getRequestById,
    cancelRequest,
    getNearbyPharmacies,
    getPharmacyById,
} from '../controllers/customer.controller';
import { uploadPrescription } from '../controllers/upload.controller';
import { authenticateUser, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createRequestSchema } from '../validators/schemas';
import { db } from '../config/firebase';
import { Collections } from '../models';

const router = Router();

// All customer routes require authentication
router.use(authenticateUser);
router.use(requireRole(['customer']));

/**
 * @route   GET /api/customer/profile
 * @desc    Get customer profile
 */
router.get('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const userDoc = await db.collection(Collections.USERS).doc(user.phone).get();

        if (!userDoc.exists) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        res.json({
            success: true,
            data: { id: userDoc.id, ...userDoc.data() },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

/**
 * @route   PUT /api/customer/profile
 * @desc    Update customer profile
 */
router.put('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const body = req.body;

        // Whitelist allowed fields
        const allowedFields = ['name', 'age', 'gender', 'address', 'location'];
        const updates: Record<string, any> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            res.status(400).json({ error: 'No valid fields to update' });
            return;
        }

        await db.collection(Collections.USERS).doc(user.phone).update({
            ...updates,
            updatedAt: new Date(),
        });

        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * @route   POST /api/customer/profile
 * @desc    Create customer profile (onboarding)
 */
router.post('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { name, phone, age, gender, address } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        await db.collection(Collections.USERS).doc(user.phone).set({
            name,
            phone: phone || user.phone,
            ...(age !== undefined && { age }),
            ...(gender && { gender }),
            ...(address && { address }),
            role: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.status(201).json({ success: true, message: 'Profile created' });
    } catch (error) {
        console.error('Create profile error:', error);
        res.status(500).json({ error: 'Failed to create profile' });
    }
});

/**
 * @route   POST /api/customer/requests
 * @desc    Create medication request
 */
router.post('/requests', validate(createRequestSchema), createRequest);

/**
 * @route   GET /api/customer/requests
 * @desc    Get all customer's requests
 */
router.get('/requests', getMyRequests);

/**
 * @route   GET /api/customer/requests/:id
 * @desc    Get request by ID
 */
router.get('/requests/:id', getRequestById);

/**
 * @route   PUT /api/customer/requests/:id/cancel
 * @desc    Cancel request
 */
router.put('/requests/:id/cancel', cancelRequest);

/**
 * @route   GET /api/customer/pharmacies/nearby
 * @desc    Get nearby pharmacies
 */
router.get('/pharmacies/nearby', getNearbyPharmacies);

/**
 * @route   GET /api/customer/pharmacies/:id
 * @desc    Get pharmacy details
 */
router.get('/pharmacies/:id', getPharmacyById);

/**
 * @route   POST /api/customer/prescriptions/upload
 * @desc    Upload prescription image
 */
router.post('/prescriptions/upload', uploadPrescription);

export default router;
