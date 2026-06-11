import express from 'express';
import affiliationRoutes from './affiliationRoutes.js';
import admissionTimelineRoutes from './admissionTimelineRoutes.js';
import costEstimateRoutes from './costEstimateRoutes.js';
import majorComparisonRoutes from './majorComparisonRoutes.js';
import majorRoutes from './majorRoutes.js';
import universityMajorRoutes from './universityMajorRoutes.js';
import universityRoutes from './universityRoutes.js';

const router = express.Router();

router.use('/majors', majorRoutes);
router.use('/university-majors', universityMajorRoutes);
router.use('/affiliations', affiliationRoutes);
router.use('/admission-timeline', admissionTimelineRoutes);
router.use('/university-cost-estimates', costEstimateRoutes);
router.use('/major-comparisons', majorComparisonRoutes);
router.use('/', universityRoutes);

export default router;
