import express from 'express';
import authController from '../controllers/authController.js';
import adminUserController from '../controllers/adminUserController.js';
import adminUserRoutes from './adminUserRoutes.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';
import { verifyInternalRequest } from '../middlewares/internalAuth.js';

const router = express.Router();

router.get('/internal/users/:userId', verifyInternalRequest, authController.getInternalUser);
router.post('/internal/users/batch', verifyInternalRequest, authController.getInternalUsersBatch);
router.patch('/internal/users/:userId/status', verifyInternalRequest, authController.updateInternalUserStatus);
router.get('/internal/stats', verifyInternalRequest, adminUserController.getInternalStats);

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
router.delete('/me/avatar', authenticateToken, authController.deleteAvatar);

router.use('/admin/users', adminUserRoutes);

export default router;
