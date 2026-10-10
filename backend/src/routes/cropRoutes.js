import { Router } from 'express';
import multer from 'multer';
import { diagnoseCrop, investigateCrop, getCropObservations, getCropDiagnoses, getCropDiagnosisById } from '../controllers/cropController.js';
import { getCropActivities, updateActivityStatus, getFarmerAlerts } from '../controllers/cropActivityController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit per file
});

const router = Router();

// POST /api/crop/investigate — Stage 1 AI Investigator
router.post('/investigate', optionalAuth, upload.any(), investigateCrop);

// POST /api/crop/diagnose — Stage 2 Multimodal Synthesis & Persistence
router.post('/diagnose', optionalAuth, upload.any(), diagnoseCrop);

// GET /api/crop/diagnoses — Retrieves Crop Doctor assessment history from Supabase
router.get('/diagnoses', optionalAuth, getCropDiagnoses);

// GET /api/crop/diagnoses/:id — Reconstructs a full historical diagnosis
router.get('/diagnoses/:id', optionalAuth, getCropDiagnosisById);

// GET /api/crop/observations
router.get('/observations', optionalAuth, getCropObservations);

// GET /api/crop/:plotId/activities — 15-day rolling daily activities window
router.get('/:plotId/activities', optionalAuth, getCropActivities);

// PATCH /api/crop/activities/:activityId/status — Mark activity completed / skipped / pending
router.patch('/activities/:activityId/status', optionalAuth, updateActivityStatus);

// GET /api/crop/alerts/farmer — Farmer isolated alerts
router.get('/alerts/farmer', optionalAuth, getFarmerAlerts);

export default router;
