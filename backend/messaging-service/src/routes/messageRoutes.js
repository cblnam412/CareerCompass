import express from 'express';
import {
  deleteConversation,
  getConversations,
  startConversation,
} from '../controllers/conversationController.js';
import {
  deleteMessage,
  getMessages,
  getUnreadCount,
  searchMessages,
  sendMessageWithDocument,
} from '../controllers/messageController.js';
import { verifyToken } from '../middlewares/auth.js';
import { uploadMessageDocument } from '../middlewares/upload.js';

const router = express.Router();

router.get('/conversations', verifyToken, getConversations);
router.post('/conversations/start', verifyToken, startConversation);
router.get('/conversations/:conversationId/messages', verifyToken, getMessages);
router.get('/conversations/:conversationId/search', verifyToken, searchMessages);
router.post('/send-with-document', verifyToken, uploadMessageDocument, sendMessageWithDocument);
router.delete('/messages/:messageId', verifyToken, deleteMessage);
router.delete('/conversations/:conversationId', verifyToken, deleteConversation);
router.get('/unread-count', verifyToken, getUnreadCount);

export default router;
