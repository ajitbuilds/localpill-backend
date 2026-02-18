import { Router } from 'express';
import {
    getPendingRequests,
    getRequestHistory,
    acceptRequest,
    rejectRequest,
    getProfile,
    updateProfile,
    getStats,
} from '../controllers/partner.controller';
import { authenticateUser, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { respondToRequestSchema, updatePharmacyProfileSchema } from '../validators/schemas';

const router = Router();

router.use(authenticateUser);
router.use(requireRole(['partner']));

router.get('/requests/pending', getPendingRequests);
router.get('/requests/history', getRequestHistory);
router.post('/requests/:id/accept', validate(respondToRequestSchema), acceptRequest);
router.post('/requests/:id/reject', rejectRequest);
router.get('/profile', getProfile);
router.put('/profile', validate(updatePharmacyProfileSchema), updateProfile);
router.get('/stats', getStats);

export default router;

