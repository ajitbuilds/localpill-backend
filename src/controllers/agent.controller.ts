import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db, storage } from '../config/firebase';
import { Collections, Pharmacy } from '../models';

/**
 * Create pharmacy (onboarding)
 */
export const createPharmacy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const pharmacyData: Partial<Pharmacy> = req.body;

        // Get user details
        const userDoc = await db.collection(Collections.USERS).doc(user.phone || user.uid).get();
        const userData = userDoc.data();

        const pharmacy: Partial<Pharmacy> = {
            ...pharmacyData,
            ownerId: user.phone || user.uid,
            ownerPhone: pharmacyData.ownerPhone || user.phone,
            ownerName: userData?.name || '',
            status: 'pending',
            isOpen: false,
            availability: 'offline',
            rating: 0,
            totalRatings: 0,
            totalRequests: 0,
            totalAccepted: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const pharmacyRef = await db.collection(Collections.PHARMACIES).add(pharmacy);

        // Link pharmacy to user
        await db.collection(Collections.USERS).doc(user.phone || user.uid).update({
            pharmacyId: pharmacyRef.id,
            role: 'partner',
        });

        res.json({
            success: true,
            pharmacyId: pharmacyRef.id,
            data: { ...pharmacy, id: pharmacyRef.id },
        });
    } catch (error) {
        console.error('Create pharmacy error:', error);
        res.status(500).json({ error: 'Failed to create pharmacy' });
    }
};

/**
 * Get all pharmacies (with optional status filter)
 */
export const getPharmacies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { status, search, page = '1', limit: limitStr = '20' } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limitStr as string);

        let queryRef: FirebaseFirestore.Query = db.collection(Collections.PHARMACIES).orderBy('createdAt', 'desc');

        if (status) {
            queryRef = queryRef.where('status', '==', status);
        }

        const pharmaciesSnapshot = await queryRef.limit(limitNum).get();
        const pharmacies = pharmaciesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Basic search filter (client-side for now)
        let filtered = pharmacies;
        if (search) {
            const searchLower = (search as string).toLowerCase();
            filtered = pharmacies.filter((p: any) =>
                p.name?.toLowerCase().includes(searchLower) ||
                p.address?.toLowerCase().includes(searchLower) ||
                p.ownerName?.toLowerCase().includes(searchLower)
            );
        }

        res.json({
            success: true,
            data: filtered,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: filtered.length,
            }
        });
    } catch (error) {
        console.error('Get pharmacies error:', error);
        res.status(500).json({ error: 'Failed to get pharmacies' });
    }
};

/**
 * Get pharmacy by ID
 */
export const getPharmacyById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };

        const pharmacyDoc = await db.collection(Collections.PHARMACIES).doc(id).get();

        if (!pharmacyDoc.exists) {
            res.status(404).json({ error: 'Pharmacy not found' });
            return;
        }

        res.json({
            success: true,
            data: { id: pharmacyDoc.id, ...pharmacyDoc.data() },
        });
    } catch (error) {
        console.error('Get pharmacy error:', error);
        res.status(500).json({ error: 'Failed to get pharmacy' });
    }
};

/**
 * Update pharmacy
 */
export const updatePharmacy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        const updates: any = req.body;

        // Remove sensitive fields
        delete updates.status;
        delete updates.verifiedBy;
        delete updates.verifiedAt;

        const pharmacyRef = db.collection(Collections.PHARMACIES).doc(id);
        const pharmacyDoc = await pharmacyRef.get();

        if (!pharmacyDoc.exists) {
            res.status(404).json({ error: 'Pharmacy not found' });
            return;
        }

        await pharmacyRef.update({
            ...updates,
            updatedAt: new Date(),
        });

        res.json({
            success: true,
            message: 'Pharmacy updated successfully',
        });
    } catch (error) {
        console.error('Update pharmacy error:', error);
        res.status(500).json({ error: 'Failed to update pharmacy' });
    }
};

/**
 * Approve pharmacy
 */
export const approvePharmacy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { id } = req.params as { id: string };

        const pharmacyRef = db.collection(Collections.PHARMACIES).doc(id);
        await pharmacyRef.update({
            status: 'verified',
            verifiedBy: user.uid,
            verifiedAt: new Date(),
            updatedAt: new Date(),
        });

        res.json({
            success: true,
            message: 'Pharmacy approved successfully',
        });
    } catch (error) {
        console.error('Approve pharmacy error:', error);
        res.status(500).json({ error: 'Failed to approve pharmacy' });
    }
};

/**
 * Reject pharmacy
 */
export const rejectPharmacy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { id } = req.params as { id: string };
        const { reason } = req.body as { reason: string };

        if (!reason) {
            res.status(400).json({ error: 'Rejection reason required' });
            return;
        }

        const pharmacyRef = db.collection(Collections.PHARMACIES).doc(id);
        await pharmacyRef.update({
            status: 'rejected',
            rejectionReason: reason,
            verifiedBy: user.uid,
            updatedAt: new Date(),
        });

        res.json({
            success: true,
            message: 'Pharmacy rejected',
        });
    } catch (error) {
        console.error('Reject pharmacy error:', error);
        res.status(500).json({ error: 'Failed to reject pharmacy' });
    }
};

/**
 * Get agent stats
 */
export const getAgentStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const totalSnapshot = await db.collection(Collections.PHARMACIES).get();
        const verifiedSnapshot = await db.collection(Collections.PHARMACIES).where('status', '==', 'verified').get();
        const pendingSnapshot = await db.collection(Collections.PHARMACIES).where('status', '==', 'pending').get();
        const rejectedSnapshot = await db.collection(Collections.PHARMACIES).where('status', '==', 'rejected').get();

        res.json({
            success: true,
            data: {
                total: totalSnapshot.size,
                onboarded: totalSnapshot.size,
                verified: verifiedSnapshot.size,
                pending: pendingSnapshot.size,
                rejected: rejectedSnapshot.size,
                target: 50,
                trend: totalSnapshot.size > 0 ? `+${totalSnapshot.size}` : '0',
                period: 'month',
                chartData: [],
            },
        });
    } catch (error) {
        console.error('Get agent stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
};

/**
 * Get agent profile
 */
export const getAgentProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const userId = user.phone || user.uid;
        const userDoc = await db.collection(Collections.USERS).doc(userId).get();

        if (!userDoc.exists) {
            res.status(404).json({ error: 'Agent profile not found' });
            return;
        }

        res.json({
            success: true,
            data: { id: userDoc.id, ...userDoc.data() },
        });
    } catch (error) {
        console.error('Get agent profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

/**
 * Get agent performance metrics
 */
export const getAgentPerformance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { period = 'month' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'lifetime':
                startDate = new Date(0);
                break;
            default: // month
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const pharmaciesSnapshot = await db.collection(Collections.PHARMACIES)
            .where('createdAt', '>=', startDate)
            .get();

        const verified = pharmaciesSnapshot.docs.filter(d => d.data().status === 'verified').length;
        const pending = pharmaciesSnapshot.docs.filter(d => d.data().status === 'pending').length;
        const rejected = pharmaciesSnapshot.docs.filter(d => d.data().status === 'rejected').length;

        res.json({
            success: true,
            data: {
                period,
                onboarded: pharmaciesSnapshot.size,
                verified,
                pending,
                rejected,
                target: period === 'week' ? 10 : period === 'month' ? 50 : 500,
                trend: `+${pharmaciesSnapshot.size}`,
                chartData: [],
            },
        });
    } catch (error) {
        console.error('Get performance error:', error);
        res.status(500).json({ error: 'Failed to get performance data' });
    }
};

/**
 * Get recent activity
 */
export const getRecentActivity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { limit: limitStr = '5' } = req.query;
        const limitNum = parseInt(limitStr as string);

        const pharmaciesSnapshot = await db.collection(Collections.PHARMACIES)
            .orderBy('updatedAt', 'desc')
            .limit(limitNum)
            .get();

        const activity = pharmaciesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json({
            success: true,
            data: activity,
        });
    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({ error: 'Failed to get recent activity' });
    }
};
