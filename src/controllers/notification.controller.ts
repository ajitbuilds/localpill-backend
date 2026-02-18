import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import admin from '../config/firebase';
import { Collections } from '../models';

/**
 * Get user notifications
 */
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const userId = user.uid || user.phone;

        const notificationsSnapshot = await db.collection(Collections.NOTIFICATIONS)
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const notifications = notificationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json({
            success: true,
            data: notifications,
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { id } = req.params as { id: string };

        const notifRef = db.collection(Collections.NOTIFICATIONS).doc(id);
        const notifDoc = await notifRef.get();

        if (!notifDoc.exists) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        // Verify ownership
        const userId = user.uid || user.phone;
        if (notifDoc.data()?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        await notifRef.update({ isRead: true });

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const userId = user.uid || user.phone;

        const notificationsSnapshot = await db.collection(Collections.NOTIFICATIONS)
            .where('userId', '==', userId)
            .where('isRead', '==', false)
            .get();

        const batch = db.batch();
        notificationsSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();

        res.json({
            success: true,
            message: `${notificationsSnapshot.size} notifications marked as read`,
        });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

/**
 * Create notification (internal helper, also exposed as API for system notifications)
 */
export const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: 'request' | 'chat' | 'status' | 'system',
    relatedId?: string
): Promise<string> => {
    const notifRef = await db.collection(Collections.NOTIFICATIONS).add({
        userId,
        title,
        message,
        type,
        relatedId: relatedId || null,
        isRead: false,
        createdAt: new Date(),
    });
    return notifRef.id;
};

// Register FCM device token for push notifications
export const registerFCMToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const userId = user.uid || user.phone;
        const { token } = req.body;

        if (!token) {
            res.status(400).json({ error: 'FCM token is required' });
            return;
        }

        // Store or update the FCM token for this user
        const tokenRef = db.collection('fcm_tokens').doc(userId);
        const existing = await tokenRef.get();
        const tokens: string[] = existing.exists ? (existing.data()?.tokens || []) : [];

        if (!tokens.includes(token)) {
            tokens.push(token);
        }

        await tokenRef.set({
            userId,
            tokens,
            updatedAt: new Date(),
        });

        res.json({ success: true, message: 'FCM token registered' });
    } catch (error) {
        console.error('Register FCM token error:', error);
        res.status(500).json({ error: 'Failed to register token' });
    }
};

// Send push notification to a user (internal helper)
export const sendPush = async (
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<void> => {
    try {
        const tokenDoc = await db.collection('fcm_tokens').doc(userId).get();
        if (!tokenDoc.exists) return;

        const tokens: string[] = tokenDoc.data()?.tokens || [];
        if (tokens.length === 0) return;

        const message = {
            notification: { title, body },
            data: data || {},
            tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const validTokens = tokens.filter((_, i) => response.responses[i].success);
            await db.collection('fcm_tokens').doc(userId).update({ tokens: validTokens });
        }
    } catch (error) {
        console.error('Send push error:', error);
    }
};
