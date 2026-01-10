import express from 'express';
import {
    getMyStudentProfile,
    updateStudentProfile
} from '../controllers/studentProfileController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/my-profile', getMyStudentProfile);
router.put('/update', updateStudentProfile);

export default router;
