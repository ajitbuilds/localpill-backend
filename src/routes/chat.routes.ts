import { Router } from 'express';
import { getMessages, sendMessage, getChatList } from '../controllers/chat.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

/**
 * @route   GET /api/chat/list
 * @desc    Get user's chat list
 */
router.get('/list', getChatList);

/**
 * @route   GET /api/chat/:requestId
 * @desc    Get messages for a request
 */
router.get('/:requestId', getMessages);

/**
 * @route   POST /api/chat/:requestId
 * @desc    Send a message
 */
router.post('/:requestId', sendMessage);

export default router;
