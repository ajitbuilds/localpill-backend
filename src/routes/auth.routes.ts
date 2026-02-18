import { Router, Response } from 'express';
import { sendOTP, verifyOTP, registerPartner, googleLogin } from '../controllers/auth.controller';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendOTPSchema, verifyOTPSchema, registerPartnerSchema, googleLoginSchema } from '../validators/schemas';
import { db } from '../config/firebase';
import { Collections } from '../models';

const router = Router();

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post('/send-otp', validate(sendOTPSchema), sendOTP);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and login/register user
 * @access  Public
 */
router.post('/verify-otp', validate(verifyOTPSchema), verifyOTP);

/**
 * @route   POST /api/auth/partner/register
 * @desc    Register as pharmacy partner
 * @access  Public (requires valid token)
 */
router.post('/partner/register', validate(registerPartnerSchema), registerPartner);

/**
 * @route   POST /api/auth/agent/google-login
 * @desc    Login field agent with Google OAuth
 * @access  Public
 */
router.post('/agent/google-login', validate(googleLoginSchema), googleLogin);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const userId = user.phone || user.uid;

        const userDoc = await db.collection(Collections.USERS).doc(userId).get();

        if (!userDoc.exists) {
            res.status(404).json({ error: 'User not found' });
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

export default router;
