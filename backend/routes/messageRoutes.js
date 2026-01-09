import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
    getConversations,
    getMessages,
    startConversation,
    deleteMessage,
    deleteConversation,
    getUnreadCount
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/conversations', verifyToken, getConversations);
router.post('/conversations/start', verifyToken, startConversation);
router.get('/conversations/:conversationId/messages', verifyToken, getMessages);
router.delete('/messages/:messageId', verifyToken, deleteMessage);
router.delete('/conversations/:conversationId', verifyToken, deleteConversation);
router.get('/unread-count', verifyToken, getUnreadCount);

export default router;
