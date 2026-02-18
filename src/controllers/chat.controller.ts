import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import { Collections } from '../models';

/**
 * Get chat messages for a request
 */
export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { requestId } = req.params as { requestId: string };

        // Check if chat exists, create if not
        let chatId = '';
        const chatsSnapshot = await db.collection(Collections.CHATS)
            .where('requestId', '==', requestId)
            .limit(1)
            .get();

        if (chatsSnapshot.empty) {
            res.json({ success: true, data: [], chatId: null });
            return;
        }

        chatId = chatsSnapshot.docs[0].id;

        // Get messages
        const messagesSnapshot = await db.collection(Collections.CHATS)
            .doc(chatId)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .get();

        const messages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json({
            success: true,
            data: messages,
            chatId,
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
};

/**
 * Send a chat message
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { requestId } = req.params as { requestId: string };
        const { message, type = 'text', imageUrl } = req.body;

        if (!message && type !== 'image') {
            res.status(400).json({ error: 'Message content required' });
            return;
        }

        // Find or create chat
        let chatId = '';
        const chatsSnapshot = await db.collection(Collections.CHATS)
            .where('requestId', '==', requestId)
            .limit(1)
            .get();

        if (chatsSnapshot.empty) {
            // Create new chat
            const requestDoc = await db.collection(Collections.REQUESTS).doc(requestId).get();
            const requestData = requestDoc.data();

            const chatRef = await db.collection(Collections.CHATS).add({
                requestId,
                participants: {
                    customerId: requestData?.customerId || '',
                    customerName: requestData?.customerName || '',
                    pharmacyId: requestData?.pharmacyId || '',
                    pharmacyName: requestData?.pharmacyName || '',
                },
                lastMessage: message,
                lastMessageAt: new Date(),
                createdAt: new Date(),
            });
            chatId = chatRef.id;
        } else {
            chatId = chatsSnapshot.docs[0].id;
        }

        // Add message
        const messageData = {
            chatId,
            senderId: user.uid || user.phone,
            senderRole: user.role || 'customer',
            message: message || '',
            type,
            imageUrl: imageUrl || null,
            isRead: false,
            createdAt: new Date(),
        };

        const messageRef = await db.collection(Collections.CHATS)
            .doc(chatId)
            .collection('messages')
            .add(messageData);

        // Update last message in chat doc
        await db.collection(Collections.CHATS).doc(chatId).update({
            lastMessage: message || '[Image]',
            lastMessageAt: new Date(),
        });

        res.json({
            success: true,
            data: { id: messageRef.id, ...messageData },
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

/**
 * Get user's chat list
 */
export const getChatList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const userId = user.uid || user.phone;

        // Query chats where user is a participant
        const chatsSnapshot = await db.collection(Collections.CHATS)
            .orderBy('lastMessageAt', 'desc')
            .limit(50)
            .get();

        const chats = chatsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() as any }))
            .filter(chat =>
                chat.participants?.customerId === userId ||
                chat.participants?.pharmacyId === userId
            );

        res.json({
            success: true,
            data: chats,
        });
    } catch (error) {
        console.error('Get chat list error:', error);
        res.status(500).json({ error: 'Failed to get chats' });
    }
};
