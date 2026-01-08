import express from 'express';
import { verifyToken, checkAdminRole} from '../middlewares/authMiddleware.js';
import {
    getAllUniversityMajors,
    getUniversityMajorById,
    createUniversityMajor,
    updateUniversityMajor,
    deleteUniversityMajor,
    importFromExcel
} from '../controllers/universityMajorController.js';
import { uploadExcelFile } from '../middlewares/uploadMiddleware.js';
import { parseExcelData } from '../middlewares/excelParserMiddleware.js';

const router = express.Router();

router.get('/', getAllUniversityMajors);
router.get('/:id', getUniversityMajorById);

router.post('/', verifyToken, checkAdminRole, createUniversityMajor);
router.put('/:id', verifyToken, checkAdminRole, updateUniversityMajor);
router.delete('/:id', verifyToken, checkAdminRole, deleteUniversityMajor);

router.post('/import/excel', verifyToken, checkAdminRole, uploadExcelFile, parseExcelData, importFromExcel);

export default router;
