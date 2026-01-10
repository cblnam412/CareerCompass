import express from 'express';
import { 
    getAdminStats, 
    createUser, 
    updateUser, 
    getAllUsers, 
    getUserById, 
    unbanUser 
} from '../controllers/adminController.js';
import { verifyToken, checkAdminRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stats', verifyToken, checkAdminRole, getAdminStats);

// User management routes
router.post('/users', verifyToken, checkAdminRole, createUser);
router.get('/users', verifyToken, checkAdminRole, getAllUsers);
router.get('/users/:id', verifyToken, checkAdminRole, getUserById);
router.put('/users/:id', verifyToken, checkAdminRole, updateUser);
router.patch('/users/:id/unban', verifyToken, checkAdminRole, unbanUser);

export default router;
