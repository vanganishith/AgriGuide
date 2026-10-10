import * as cropActivityService from '../services/crop/cropActivityService.js';

/**
 * GET /api/crop/:plotId/activities
 * Fetches or dynamically generates the 15-day activity window for a crop plot
 */
export async function getCropActivities(req, res, next) {
  try {
    const { plotId } = req.params;
    const { language = 'en', window = 15 } = req.query;

    if (!plotId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Crop Plot ID is required.' }
      });
    }

    const data = await cropActivityService.getCropDailyActivities({
      plotId,
      user: req.user || null,
      windowDays: Number(window) || 15,
      language
    });

    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/crop/activities/:activityId/status
 * Updates status of an activity (completed, skipped, pending)
 */
export async function updateActivityStatus(req, res, next) {
  try {
    const { activityId } = req.params;
    const { status = 'completed' } = req.body;

    if (!activityId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Activity ID is required.' }
      });
    }

    const updated = await cropActivityService.updateActivityStatus({
      activityId,
      status,
      user: req.user || null
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/farmer/alerts
 * Fetches real farmer alerts (including missed activity alerts) from Supabase
 */
export async function getFarmerAlerts(req, res, next) {
  try {
    const alerts = await cropActivityService.getFarmerAlerts(req.user || null);
    res.json({
      success: true,
      data: alerts
    });
  } catch (err) {
    next(err);
  }
}
