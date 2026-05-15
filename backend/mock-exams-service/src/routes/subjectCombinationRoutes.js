import express from 'express';
import {
  createSubjectCombination,
  deleteSubjectCombination,
  getAllSubjectCombinations,
  getSubjectCombinationById,
  updateSubjectCombination,
} from '../controllers/subjectCombinationController.js';
import { checkAdminRole, verifyToken } from '../middlewares/auth.js';
import { validateObjectIdParam, validatePaginationQuery, validateSubjectCombinationPayload } from '../middlewares/validators.js';

const router = express.Router();

router.get('/', validatePaginationQuery, getAllSubjectCombinations);
router.get('/:id', validateObjectIdParam('id'), getSubjectCombinationById);
router.post('/', verifyToken, checkAdminRole, validateSubjectCombinationPayload, createSubjectCombination);
router.patch('/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), validateSubjectCombinationPayload, updateSubjectCombination);
router.put('/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), validateSubjectCombinationPayload, updateSubjectCombination);
router.delete('/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), deleteSubjectCombination);

export default router;
