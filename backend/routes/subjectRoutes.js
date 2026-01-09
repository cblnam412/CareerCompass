import express from 'express';
import multer from 'multer';
import {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
    bulkImportSubjects
} from '../controllers/subjectController.js';
import { verifyToken, checkAdminRole } from '../middlewares/authMiddleware.js';

const upload = multer({ storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
}) });

const router = express.Router();

router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);
router.post('/', verifyToken, checkAdminRole, createSubject);
router.post('/import/excel', verifyToken, checkAdminRole, upload.single('file'), bulkImportSubjects);
router.put('/:id', verifyToken, checkAdminRole, updateSubject);
router.delete('/:id', verifyToken, checkAdminRole, deleteSubject);

export default router;
