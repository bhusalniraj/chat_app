import express from 'express';
import { getAllUsers, searchUsers, getUserById, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/', getAllUsers);
router.put('/profile', upload.single('avatar'), updateProfile);
router.get('/:id', getUserById);

export default router;
