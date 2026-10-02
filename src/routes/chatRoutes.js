import express from 'express';
import { getUserChats, getOrCreateChat, createGroupChat, getChatById } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getUserChats);
router.post('/', getOrCreateChat);
router.post('/group', createGroupChat);
router.get('/:id', getChatById);

export default router;
