import express from 'express';
import {
    getAllSubjectCombinations,
    getSubjectCombinationById,
    createSubjectCombination,
    updateSubjectCombination,
    deleteSubjectCombination
} from '../controllers/subjectCombinationController.js';
import { checkAuth, checkAdminRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/subject-combinations', getAllSubjectCombinations);
router.get('/subject-combinations/:id', getSubjectCombinationById);

router.post('/subject-combinations', checkAuth, checkAdminRole, createSubjectCombination);
router.patch('/subject-combinations/:id', checkAuth, checkAdminRole, updateSubjectCombination);
router.delete('/subject-combinations/:id', checkAuth, checkAdminRole, deleteSubjectCombination);

export default router;
