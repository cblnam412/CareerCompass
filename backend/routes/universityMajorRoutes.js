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
import {
    scrapeAndUpdateScores,
    getOutdatedMajors,
    updateMajorScore,
    bulkUpdateScores,
    getUniversityMajorsForAdmin
} from '../controllers/adminUniversityMajorController.js';
import { uploadExcelFile } from '../middlewares/uploadMiddleware.js';
import { parseExcelData } from '../middlewares/excelParserMiddleware.js';

const router = express.Router();

// Public endpoints
router.get('/', getAllUniversityMajors);
router.get('/:id', getUniversityMajorById);

// Admin endpoints - CRUD
router.post('/', verifyToken, checkAdminRole, createUniversityMajor);
router.put('/:id', verifyToken, checkAdminRole, updateUniversityMajor);
router.delete('/:id', verifyToken, checkAdminRole, deleteUniversityMajor);

// Admin endpoints - Import/Scrape
router.post('/import/excel', verifyToken, checkAdminRole, uploadExcelFile, parseExcelData, importFromExcel);

// Admin endpoints - Admission Scores
router.get('/admin/list', verifyToken, checkAdminRole, getUniversityMajorsForAdmin);
router.get('/admin/outdated', verifyToken, checkAdminRole, getOutdatedMajors);
router.post('/admin/scrape', verifyToken, checkAdminRole, scrapeAndUpdateScores);
router.post('/admin/bulk-update', verifyToken, checkAdminRole, bulkUpdateScores);
router.put('/admin/:id/score', verifyToken, checkAdminRole, updateMajorScore);

export default router;
