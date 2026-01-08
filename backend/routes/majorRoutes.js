import express from 'express';
import {
    createMajor,
    createMajorsFromFile,
    updateMajor,
    deleteMajor,
    deleteMajors,
    exportMajorsToCSV,
    getAllMajors,
    getMajorById,
    searchMajors,
    getMajorsByCategory,
    getAllCategories,
    getMajorStats
} from '../controllers/majorController.js';
import { verifyToken, checkAdminRole } from '../middlewares/authMiddleware.js';
import { uploadTxtFile } from '../middlewares/uploadMiddleware.js';
import {
    validateMajorData,
    validateMajorId,
    validateSearchParams
} from '../middlewares/majorValidationMiddleware.js';

const router = express.Router();


router.post('/create', verifyToken, checkAdminRole, validateMajorData, createMajor);
router.post('/bulk-upload', verifyToken, checkAdminRole, uploadTxtFile, createMajorsFromFile);
router.put('/:majorId', verifyToken, checkAdminRole, validateMajorId, validateMajorData, updateMajor);
router.delete('/:majorId', verifyToken, checkAdminRole, validateMajorId, deleteMajor);
router.delete('/', verifyToken, checkAdminRole, deleteMajors);
router.get('/export/csv', verifyToken, checkAdminRole, exportMajorsToCSV);

router.get('/', validateSearchParams, getAllMajors);
router.get('/search', searchMajors);
router.get('/category/:category', getMajorsByCategory);
router.get('/id/:majorId', validateMajorId, getMajorById);
router.get('/categories', getAllCategories);
router.get('/stats', getMajorStats);

export default router;
