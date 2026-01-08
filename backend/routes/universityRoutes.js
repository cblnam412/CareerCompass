import express from 'express';
import {
    createUniversity,
    importUniversitiesFromExcel,
    getAllUniversities,
    getUniversityById,
    updateUniversity,
    deleteUniversity
} from '../controllers/universityController.js';
import { verifyToken, checkAdminRole } from '../middlewares/authMiddleware.js';
import { uploadExcelFile } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post(
    '/import/excel',
    verifyToken,
    checkAdminRole,
    uploadExcelFile,
    importUniversitiesFromExcel
);

router.post('/', verifyToken, checkAdminRole, createUniversity);
router.get('/', getAllUniversities);
router.get('/:id', getUniversityById);
router.put('/:id', verifyToken, checkAdminRole, updateUniversity);
router.delete('/:id', verifyToken, checkAdminRole, deleteUniversity);

export default router;
