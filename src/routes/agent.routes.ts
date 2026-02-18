import { Router } from 'express';
import {
    createPharmacy,
    getPharmacies,
    getPharmacyById,
    updatePharmacy,
    approvePharmacy,
    rejectPharmacy,
    getAgentStats,
    getAgentProfile,
    getAgentPerformance,
    getRecentActivity,
} from '../controllers/agent.controller';
import { uploadPharmacyDocument } from '../controllers/upload.controller';
import { authenticateUser, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPharmacySchema, rejectPharmacySchema } from '../validators/schemas';

const router = Router();

router.use(authenticateUser);
router.use(requireRole(['agent']));

/**
 * @route   GET /api/agent/me
 * @desc    Get agent profile
 */
router.get('/me', getAgentProfile);

/**
 * @route   POST /api/agent/onboard-pharmacy
 * @desc    Onboard a new pharmacy (alias for POST /pharmacies)
 */
router.post('/onboard-pharmacy', validate(createPharmacySchema), createPharmacy);

/**
 * @route   POST /api/agent/pharmacies
 * @desc    Create/onboard pharmacy
 */
router.post('/pharmacies', validate(createPharmacySchema), createPharmacy);

/**
 * @route   GET /api/agent/pharmacies
 * @desc    Get all pharmacies
 */
router.get('/pharmacies', getPharmacies);

/**
 * @route   GET /api/agent/pharmacies/:id
 * @desc    Get pharmacy by ID
 */
router.get('/pharmacies/:id', getPharmacyById);

/**
 * @route   PUT /api/agent/pharmacies/:id
 * @desc    Update pharmacy details
 */
router.put('/pharmacies/:id', updatePharmacy);

/**
 * @route   PUT /api/agent/pharmacies/:id/approve
 * @desc    Approve pharmacy
 */
router.put('/pharmacies/:id/approve', approvePharmacy);

/**
 * @route   PUT /api/agent/pharmacies/:id/reject
 * @desc    Reject pharmacy
 */
router.put('/pharmacies/:id/reject', validate(rejectPharmacySchema), rejectPharmacy);

/**
 * @route   GET /api/agent/stats
 * @desc    Get agent dashboard stats
 */
router.get('/stats', getAgentStats);

/**
 * @route   GET /api/agent/performance
 * @desc    Get agent performance metrics
 */
router.get('/performance', getAgentPerformance);

/**
 * @route   GET /api/agent/recent-activity
 * @desc    Get recent pharmacies activity
 */
router.get('/recent-activity', getRecentActivity);

/**
 * @route   POST /api/agent/upload-document
 * @desc    Upload pharmacy verification document
 */
router.post('/upload-document', uploadPharmacyDocument);

export default router;
