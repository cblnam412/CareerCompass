import express from 'express';
import {
    getAllSoftSkills,
    getSoftSkillById,
    createSoftSkill,
    updateSoftSkill,
    deleteSoftSkill
} from '../controllers/softSkillController.js';
import { verifyToken, checkAdminRole } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.get('/soft-skills', getAllSoftSkills);
router.get('/soft-skills/:id', getSoftSkillById);
router.post('/soft-skills', verifyToken, checkAdminRole, createSoftSkill);
router.patch('/soft-skills/:id', verifyToken, checkAdminRole, updateSoftSkill);
router.delete('/soft-skills/:id', verifyToken, checkAdminRole, deleteSoftSkill);

export default router;
