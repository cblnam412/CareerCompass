import express from 'express';
import {
    getUserProfile,
    getMyProfile,
    updateMyProfile,
    uploadAvatar,
    deleteAvatar
} from '../controllers/userProfileController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/me', verifyToken, getMyProfile);
router.patch('/me', verifyToken, updateMyProfile);
router.post('/me/avatar', verifyToken, upload.fields([{ name: 'avatar', maxCount: 1 }]), uploadAvatar);
router.delete('/me/avatar', verifyToken, deleteAvatar);
router.get('/:userId', getUserProfile);

export default router;
