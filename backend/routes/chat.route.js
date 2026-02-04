import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js'; 
import {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead,
  addParticipant
} from '../controllers/chat.controller.js';

const router = express.Router();

// --- BẢO VỆ TẤT CẢ CÁC ROUTE CHAT ---
// Bắt buộc phải có token mới được chat
router.use(verifyToken); 

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:id/messages', getMessages);
router.put('/:id/read', markMessagesRead);
router.post('/:id/participants', addParticipant);
router.post('/:id/messages', sendMessage);

export default router;