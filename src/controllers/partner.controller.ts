import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import { Collections } from '../models';
import { io } from '../server';

/**
 * Get pending requests for pharmacy
 */
export const getPendingRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        // Use user.id which handles both phone (legacy) and UID (email)
        const userDoc = await db.collection(Collections.USERS).doc(user.id).get();
        const userData = userDoc.data();

        if (!userData?.pharmacyId) {
            res.status(400).json({ error: 'No pharmacy associated with this account' });
            return;
        }

        // Get both 'pending' and 'broadcasting' requests (new broadcast system)
        const requestsSnapshot = await db
            .collection(Collections.REQUESTS)
            .where('status', 'in', ['pending', 'broadcasting'])
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        // Filter out expired requests
        const now = new Date();
        const requests = requestsSnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter((req: any) => {
                // If expiresAt exists, check if request is still valid
                if (req.expiresAt) {
                    const expiresAt = req.expiresAt.toDate ? req.expiresAt.toDate() : new Date(req.expiresAt);
                    return expiresAt > now;
                }
                return true; // Legacy requests without expiresAt
            });

        res.json({
            success: true,
            data: requests,
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ error: 'Failed to get requests' });
    }
};

/**
 * Get request history by pharmacy
 */
export const getRequestHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;

        const userDoc = await db.collection(Collections.USERS).doc(user.id).get();
        const userData = userDoc.data();

        if (!userData?.pharmacyId) {
            res.status(400).json({ error: 'No pharmacy associated' });
            return;
        }

        const requestsSnapshot = await db
            .collection(Collections.REQUESTS)
            .where('pharmacyId', '==', userData.pharmacyId)
            .orderBy('createdAt', 'desc')
            .get();

        const requests = requestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json({
            success: true,
            data: requests,
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
};

/**
 * Accept request
 */
export const acceptRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { id } = req.params as { id: string };
        const { medicines, totalPrice, estimatedTime, notes } = req.body;

        const userDoc = await db.collection(Collections.USERS).doc(user.id).get();
        const userData = userDoc.data();

        if (!userData?.pharmacyId) {
            res.status(400).json({ error: 'No pharmacy associated' });
            return;
        }

        // Get pharmacy details
        const pharmacyDoc = await db.collection(Collections.PHARMACIES).doc(userData.pharmacyId).get();
        const pharmacyData = pharmacyDoc.data();

        // Update request
        const requestRef = db.collection(Collections.REQUESTS).doc(id);
        await requestRef.update({
            status: 'accepted',
            pharmacyId: userData.pharmacyId,
            pharmacyName: pharmacyData?.name,
            response: {
                totalPrice,
                estimatedTime,
                notes,
                respondedAt: new Date(),
            },
            updatedAt: new Date(),
        });

        // Update pharmacy stats
        await db.collection(Collections.PHARMACIES).doc(userData.pharmacyId).update({
            totalAccepted: (pharmacyData?.totalAccepted || 0) + 1,
            totalRequests: (pharmacyData?.totalRequests || 0) + 1,
        });

        // Notify customer in real-time via Socket.io
        try {
            io.to(`request:${id}`).emit('request:pharmacy-responded', {
                requestId: id,
                pharmacyId: userData.pharmacyId,
                pharmacyName: pharmacyData?.name,
                pharmacyAddress: pharmacyData?.address,
                pharmacyPhone: pharmacyData?.phone,
                pharmacyImage: pharmacyData?.storeFrontImage,
                totalPrice,
                estimatedTime,
                notes,
                respondedAt: new Date().toISOString(),
            });
            console.log(`Pharmacy ${pharmacyData?.name} accepted request ${id}, customer notified`);
        } catch (socketErr) {
            console.error('Socket response broadcast failed (non-fatal):', socketErr);
        }

        res.json({
            success: true,
            message: 'Request accepted successfully',
        });
    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({ error: 'Failed to accept request' });
    }
};

/**
 * Reject request
 */
export const rejectRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { id } = req.params as { id: string };
        const { reason } = req.body;

        const userDoc = await db.collection(Collections.USERS).doc(user.id).get();
        const userData = userDoc.data();

        if (!userData?.pharmacyId) {
            res.status(400).json({ error: 'No pharmacy associated' });
            return;
        }

        // Update request
        const requestRef = db.collection(Collections.REQUESTS).doc(id);
        await requestRef.update({
            status: 'rejected',
            pharmacyId: userData.pharmacyId,
            response: {
                notes: reason,
                respondedAt: new Date(),
            },
            updatedAt: new Date(),
        });

        res.json({
            success: true,
            message: 'Request rejected',
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ error: 'Failed to reject request' });
    }
};

/**
 * Get partner profile
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;

        const userDoc = await db.collection(Collections.USERS).doc(user.id).get();
        const userData = userDoc.data();

        if (userData?.pharmacyId) {
            const pharmacyDoc = await db.collection(Collections.PHARMACIES).doc(userData.pharmacyId).get();
            res.json({
                success: true,
                data: {
                    user: userData,
                    pharmacy: { id: pharmacyDoc.id, ...pharmacyDoc.data() },
                },
            });
        } else {
            res.json({
                success: true,
                data: { user: userData },
            });
        }
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

/**
 * Update partner profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const body = req.body;

        // Whitelist allowed fields — prevent role escalation or ID tampering
        const allowedFields = [
            'name', 'email', 'phone', 'address',
            'bio', 'languages', 'qualification', 'experience',
            'regNumber', 'stateCouncil', 'additionalQuals', 'socialLinks', 'profileImage'
        ];
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

        await db.collection(Collections.USERS).doc(user.id).update({
            ...updates,
            updatedAt: new Date(),
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

/**
 * Get partner stats
 */
export const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;

        const userDoc = await db.collection(Collections.USERS).doc(user.id).get();
        const userData = userDoc.data();

        if (!userData?.pharmacyId) {
            res.json({
                success: true,
                data: { totalPending: 0, totalResponded: 0, activityTrend: 0 },
            });
            return;
        }

        // Count pending
        const pendingSnapshot = await db
            .collection(Collections.REQUESTS)
            .where('status', '==', 'pending')
            .get();

        // Count responded (accepted or rejected by this pharmacy)
        const respondedSnapshot = await db
            .collection(Collections.REQUESTS)
            .where('pharmacyId', '==', userData.pharmacyId)
            .get();

        res.json({
            success: true,
            data: {
                totalPending: pendingSnapshot.size,
                totalResponded: respondedSnapshot.size,
                activityTrend: 0,
            },
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
};
