import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.registerUser);
router.post('/auth/register-uni-rep', authController.registerUniversityRep);
router.get('/auth/profile/:userId', authController.getUserProfile);

// Protected routes
router.get('/api/users/me', authenticateToken, authController.getMyProfile);
router.get('/verify', authenticateToken, authController.verifyToken);
router.put('/profile', authenticateToken, authController.updateMyProfile);
router.post('/avatar', authenticateToken, authController.uploadAvatar);
router.delete('/avatar', authenticateToken, authController.deleteAvatar);

export default router;
