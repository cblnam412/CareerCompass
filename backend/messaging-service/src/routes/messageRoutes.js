import express from 'express';
import {
  deleteConversation,
  getConversations,
  startConversation,
} from '../controllers/conversationController.js';
import {
  deleteAiConversation,
  getAiConversations,
  getAiMessages,
  sendAiMessage,
} from '../controllers/aiChatController.js';
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

router.get('/ai/conversations', verifyToken, getAiConversations);
router.get('/ai/conversations/:conversationId/messages', verifyToken, getAiMessages);
router.post('/ai/chat', verifyToken, sendAiMessage);
router.delete('/ai/conversations/:conversationId', verifyToken, deleteAiConversation);

router.get('/conversations', verifyToken, getConversations);
router.post('/conversations/start', verifyToken, startConversation);
router.get('/conversations/:conversationId/messages', verifyToken, getMessages);
router.get('/conversations/:conversationId/search', verifyToken, searchMessages);
router.post('/send-with-document', verifyToken, uploadMessageDocument, sendMessageWithDocument);
router.delete('/messages/:messageId', verifyToken, deleteMessage);
router.delete('/conversations/:conversationId', verifyToken, deleteConversation);
router.get('/unread-count', verifyToken, getUnreadCount);

export default router;
