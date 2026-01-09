import express from 'express';
import {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
} from '../controllers/subjectController.js';
import { verifyToken, checkAdminRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);
router.post('/', verifyToken, checkAdminRole, createSubject);
router.put('/:id', verifyToken, checkAdminRole, updateSubject);
router.delete('/:id', verifyToken, checkAdminRole, deleteSubject);

export default router;
