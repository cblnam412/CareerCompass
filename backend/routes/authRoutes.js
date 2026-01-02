import express from 'express';
import {
    registerUser,
    registerUniversityRep,
    login
} from '../controllers/authController.js';
import { 
    validateRegisterUser,
    validateRegisterUniRep,
    validateLogin
} from '../middlewares/validationMiddleware.js';
import { uploadStudentCard } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/register', validateRegisterUser, registerUser);
router.post('/register-uni-rep', uploadStudentCard, validateRegisterUniRep, registerUniversityRep);
router.post('/login', validateLogin, login);

export default router;
