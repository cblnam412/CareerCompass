import express from 'express';
import {
    getAffiliations,
    getAffiliationById,
    approveAffiliation,
    rejectAffiliation,
    getAffiliationsByUniversity,
    getAffiliationStats
} from '../controllers/affiliationController.js';
import { checkAuth, checkUniManagerRole } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/affiliations', checkAuth, checkUniManagerRole, getAffiliations);
router.get('/affiliations/stats', checkAuth, checkUniManagerRole, getAffiliationStats);
router.get('/affiliations/:id', checkAuth, checkUniManagerRole, getAffiliationById);
router.patch('/affiliations/:id/approve', checkAuth, checkUniManagerRole, approveAffiliation);
router.patch('/affiliations/:id/reject', checkAuth, checkUniManagerRole, rejectAffiliation);
router.get('/affiliations/university/:universityId', checkAuth, checkUniManagerRole, getAffiliationsByUniversity);
export default router;
