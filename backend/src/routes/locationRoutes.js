import express from 'express';
import * as locationController from '../controllers/locationController.js';

const router = express.Router();

router.get('/reverse', locationController.reverseGeocode);
router.get('/search', locationController.searchLocations);

export default router;
