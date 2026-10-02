import express from 'express';
import { getMessages, sendMessage, addReaction, deleteMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/:chatId', getMessages);
router.post('/', upload.single('file'), sendMessage);
router.post('/:id/react', addReaction);
router.delete('/:id', deleteMessage);

export default router;
