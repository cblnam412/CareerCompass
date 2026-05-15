import express from 'express';
import {
  createSoftSkill,
  deleteSoftSkill,
  getAllSoftSkills,
  getSoftSkillById,
  updateSoftSkill,
} from '../controllers/softSkillController.js';
import { checkAdminRole, verifyToken } from '../middlewares/auth.js';
import { validateObjectIdParam, validatePaginationQuery } from '../middlewares/validators.js';

const router = express.Router();

router.get('/soft-skills', validatePaginationQuery, getAllSoftSkills);
router.get('/soft-skills/:id', validateObjectIdParam('id'), getSoftSkillById);
router.post('/soft-skills', verifyToken, checkAdminRole, createSoftSkill);
router.patch('/soft-skills/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), updateSoftSkill);
router.put('/soft-skills/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), updateSoftSkill);
router.delete('/soft-skills/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), deleteSoftSkill);

export default router;
