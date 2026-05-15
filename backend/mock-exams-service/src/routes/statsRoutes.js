import express from 'express';
import { getAdminStats } from '../controllers/statsController.js';
import { checkAdminRole, verifyToken } from '../middlewares/auth.js';
import { verifyInternalRequest } from '../middlewares/internalAuth.js';

const router = express.Router();

router.get('/stats', verifyToken, checkAdminRole, getAdminStats);
router.get('/internal/stats', verifyInternalRequest, getAdminStats);

export default router;
