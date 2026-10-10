/**
 * OpenStreetMap & Nominatim Geocoding & Reverse Geocoding Service
 * Provides real-time geolocation resolution for Indian agricultural regions
 */

const locationCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

const NOMINATIM_USER_AGENT = 'AgriGuide-AgriculturalAdvisor/1.0 (contact@agriguide.in)';

/**
 * Helper to clean and standardize Indian district name
 */
function cleanDistrictName(name) {
  if (!name) return '';
  return name
    .replace(/\s+district$/i, '')
    .replace(/\s+rural$/i, '')
    .replace(/\s+urban$/i, '')
    .trim();
}

/**
 * Parse OpenStreetMap Nominatim response into AgriGuide standard LocationContext
 */
export function parseNominatimResult(item) {
  if (!item) return null;
  const address = item.address || {};

  const village = 
    address.village || 
    address.suburb || 
    address.hamlet || 
    address.neighbourhood || 
    address.town || 
    address.residential || 
    address.city_district || 
    item.name || 
    '';

  const mandal = 
    address.county || 
    address.subdistrict || 
    address.tehsil || 
    address.taluk || 
    '';

  let rawDistrict = 
    address.state_district || 
    address.district || 
    address.city || 
    address.county || 
    '';

  const district = cleanDistrictName(rawDistrict) || 'Warangal';
  const state = address.state || 'Telangana';
  const postcode = address.postcode || '';

  return {
    village,
    mandal,
    district,
    state,
    postcode,
    displayName: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    source: 'gps',
  };
}

/**
 * Reverse geocode latitude and longitude to real-time address via OpenStreetMap Nominatim
 */
export async function reverseGeocode({ lat, lon }) {
  if (lat === undefined || lon === undefined) {
    throw new Error('Latitude and longitude are required');
  }

  const cacheKey = `rev_${Number(lat).toFixed(4)}_${Number(lon).toFixed(4)}`;
  const cached = locationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': NOMINATIM_USER_AGENT,
      'Accept-Language': 'en',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`OpenStreetMap reverse geocode failed with status ${response.status}`);
  }

  const rawData = await response.json();
  const parsed = parseNominatimResult(rawData);

  if (parsed) {
    locationCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
  }

  return parsed;
}

/**
 * Search locations/villages/mandals/districts in India via OpenStreetMap Nominatim
 */
export async function searchLocations({ query, limit = 6 }) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

  const cleanQuery = query.trim();
  const cacheKey = `search_${cleanQuery.toLowerCase()}_${limit}`;
  const cached = locationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(cleanQuery)}&countrycodes=in&addressdetails=1&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': NOMINATIM_USER_AGENT,
      'Accept-Language': 'en',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`OpenStreetMap search failed with status ${response.status}`);
  }

  const rawResults = await response.json();
  if (!Array.isArray(rawResults)) {
    return [];
  }

  const parsedList = rawResults.map(parseNominatimResult).filter(Boolean);
  locationCache.set(cacheKey, { data: parsedList, timestamp: Date.now() });

  return parsedList;
}
