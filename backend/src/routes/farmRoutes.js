import express from 'express';
import * as farmController from '../controllers/farmController.js';
import { getFarmerAlerts } from '../controllers/cropActivityController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(optionalAuth);

router.get('/', farmController.getFarms);
router.get('/crops', farmController.getCrops);
router.get('/recommendations', farmController.getRecommendations);
router.patch('/recommendations/:id/complete', farmController.completeRecommendation);
router.get('/profile', farmController.getFarmerProfile);
router.patch('/profile', farmController.updateFarmerProfile);
router.post('/session', farmController.identifySession);
router.post('/extract-field-info', farmController.extractFieldInfo);
router.post('/compare-crops', farmController.compareCrops);
router.post('/crop-voice-qa', farmController.cropVoiceQA);
router.post('/plan-crop', farmController.planCrop);
router.post('/accept-plan', farmController.acceptPlan);
router.get('/alerts', getFarmerAlerts);

export default router;
