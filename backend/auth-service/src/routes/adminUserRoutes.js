import express from 'express';
import adminUserController from '../controllers/adminUserController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateToken, authorizeRole('admin'));

router.get('/', adminUserController.listUsers);
router.post('/', adminUserController.createUser);
router.get('/:id', adminUserController.getUserById);
router.put('/:id', adminUserController.updateUser);
router.patch('/:id/unban', adminUserController.unbanUser);

export default router;
