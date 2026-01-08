import express from 'express';
import {
    getAllSubjectCombinations,
    getSubjectCombinationById,
    createSubjectCombination,
    updateSubjectCombination,
    deleteSubjectCombination,
    importSubjectCombinationsFromDocx
} from '../controllers/subjectCombinationController.js';
import { verifyToken, checkAdminRole } from '../middlewares/authMiddleware.js';
import { uploadDocxFile } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/subject-combinations', getAllSubjectCombinations);
router.get('/subject-combinations/:id', getSubjectCombinationById);

router.post('/subject-combinations', verifyToken, checkAdminRole, createSubjectCombination);
router.post('/subject-combinations/import/docx', verifyToken, checkAdminRole, uploadDocxFile, importSubjectCombinationsFromDocx);
router.patch('/subject-combinations/:id', verifyToken, checkAdminRole, updateSubjectCombination);
router.delete('/subject-combinations/:id', verifyToken, checkAdminRole, deleteSubjectCombination);

export default router;
