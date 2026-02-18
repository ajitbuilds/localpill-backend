import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, registerFCMToken } from '../controllers/notification.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 */
router.get('/', getNotifications);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 */
router.put('/read-all', markAllAsRead);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 */
router.put('/:id/read', markAsRead);

router.post('/fcm-token', registerFCMToken);

export default router;
