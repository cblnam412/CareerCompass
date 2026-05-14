import express from 'express';
import {
  approveAffiliation,
  createAffiliationFromAuth,
  getAffiliationById,
  getAffiliationStats,
  getAffiliations,
  getAffiliationsByUniversity,
  rejectAffiliation,
} from '../controllers/affiliationController.js';
import { checkUniManagerRole, verifyToken } from '../middlewares/auth.js';
import { verifyInternalRequest } from '../middlewares/internalAuth.js';
import { validateObjectIdParam } from '../middlewares/validators.js';

const router = express.Router();

router.post('/internal', verifyInternalRequest, createAffiliationFromAuth);

router.get('/', verifyToken, checkUniManagerRole, getAffiliations);
router.get('/stats', verifyToken, checkUniManagerRole, getAffiliationStats);
router.get('/university/:id', verifyToken, checkUniManagerRole, validateObjectIdParam('id'), getAffiliationsByUniversity);
router.get('/:id', verifyToken, checkUniManagerRole, validateObjectIdParam('id'), getAffiliationById);
router.patch('/:id/approve', verifyToken, checkUniManagerRole, validateObjectIdParam('id'), approveAffiliation);
router.patch('/:id/reject', verifyToken, checkUniManagerRole, validateObjectIdParam('id'), rejectAffiliation);

export default router;
