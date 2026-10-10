import * as locationService from '../services/location/locationService.js';

export async function reverseGeocode(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon || req.query.lng);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Valid latitude and longitude are required.' },
      });
    }

    const result = await locationService.reverseGeocode({ lat, lon });
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function searchLocations(req, res, next) {
  try {
    const query = req.query.q || req.query.query || '';
    const limit = parseInt(req.query.limit || '6', 10);

    const results = await locationService.searchLocations({ query, limit });
    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
}
