import express from 'express';
import {
  getMyStudentProfile,
  updateStudentProfile,
} from '../controllers/studentProfileController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validateStudentProfilePayload } from '../middlewares/validators.js';

const router = express.Router();

router.use(verifyToken);

router.get('/my-profile', getMyStudentProfile);
router.put('/update', validateStudentProfilePayload, updateStudentProfile);
router.patch('/update', validateStudentProfilePayload, updateStudentProfile);

export default router;
