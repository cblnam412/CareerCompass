import express from 'express';
import {
  createSubject,
  deleteSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
} from '../controllers/subjectController.js';
import { checkAdminRole, verifyToken } from '../middlewares/auth.js';
import { validateObjectIdParam, validatePaginationQuery, validateSubjectPayload } from '../middlewares/validators.js';

const router = express.Router();

router.get('/', validatePaginationQuery, getAllSubjects);
router.get('/:id', validateObjectIdParam('id'), getSubjectById);
router.post('/', verifyToken, checkAdminRole, validateSubjectPayload, createSubject);
router.put('/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), validateSubjectPayload, updateSubject);
router.patch('/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), validateSubjectPayload, updateSubject);
router.delete('/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), deleteSubject);

export default router;
