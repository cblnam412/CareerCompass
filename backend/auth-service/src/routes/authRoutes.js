import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.registerUser);

router.post('/register-uni-rep', authController.registerUniversityRep);
router.get('/profile/:userId', authController.getUserProfile);

// Protected routes
router.get('/me', authenticateToken, authController.getMyProfile);
router.patch('/me', authenticateToken, authController.updateMyProfile);
router.post('/me/avatar', authenticateToken, authController.uploadAvatar);

router.get('/verify', authenticateToken, authController.verifyToken);
router.delete('/avatar', authenticateToken, authController.deleteAvatar);

export default router;
