import express from 'express';
import {
    getAllSoftSkills,
    getSoftSkillById,
    createSoftSkill,
    updateSoftSkill,
    deleteSoftSkill
} from '../controllers/softSkillController.js';
import { checkAuth, checkAdminRole } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.get('/soft-skills', getAllSoftSkills);
router.get('/soft-skills/:id', getSoftSkillById);
router.post('/soft-skills', checkAuth, checkAdminRole, createSoftSkill);
router.patch('/soft-skills/:id', checkAuth, checkAdminRole, updateSoftSkill);
router.delete('/soft-skills/:id', checkAuth, checkAdminRole, deleteSoftSkill);

export default router;
