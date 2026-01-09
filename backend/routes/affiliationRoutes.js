import express from 'express';
import {
    getAffiliations,
    getAffiliationById,
    approveAffiliation,
    rejectAffiliation,
    getAffiliationsByUniversity,
    getAffiliationStats
} from '../controllers/affiliationController.js';
import { verifyToken, checkUniManagerRole } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/', verifyToken, checkUniManagerRole, getAffiliations);
router.get('/stats', verifyToken, checkUniManagerRole, getAffiliationStats);
router.get('/university/:id', verifyToken, checkUniManagerRole, getAffiliationsByUniversity);
router.get('/:id', verifyToken, checkUniManagerRole, getAffiliationById);
router.patch('/:id/approve', verifyToken, checkUniManagerRole, approveAffiliation);
router.patch('/:id/reject', verifyToken, checkUniManagerRole, rejectAffiliation);
export default router;
