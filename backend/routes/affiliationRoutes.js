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

router.get('/affiliations', verifyToken, checkUniManagerRole, getAffiliations);
router.get('/affiliations/stats', verifyToken, checkUniManagerRole, getAffiliationStats);
router.get('/affiliations/:id', verifyToken, checkUniManagerRole, getAffiliationById);
router.patch('/affiliations/:id/approve', verifyToken, checkUniManagerRole, approveAffiliation);
router.patch('/affiliations/:id/reject', verifyToken, checkUniManagerRole, rejectAffiliation);
router.get('/affiliations/university/:universityId', verifyToken, checkUniManagerRole, getAffiliationsByUniversity);
export default router;
