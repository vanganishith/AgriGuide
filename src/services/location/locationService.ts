import type { LocationContext } from '../../types';
import { CacheService } from '../cacheService';
import { fetchApi } from '../apiConfig';

export const AGRICULTURAL_DISTRICTS: LocationContext[] = [
  {
    district: 'Warangal',
    state: 'Telangana',
    village: 'Geesugonda',
    mandal: 'Geesugonda',
    displayName: 'Warangal, Telangana, India',
    latitude: 17.9689,
    longitude: 79.5941,
    source: 'default',
  },
  {
    district: 'Guntur',
    state: 'Andhra Pradesh',
    village: 'Tenali',
    mandal: 'Tenali',
    displayName: 'Guntur, Andhra Pradesh, India',
    latitude: 16.3067,
    longitude: 80.4365,
    source: 'manual',
  },
  {
    district: 'Khammam',
    state: 'Telangana',
    village: 'Khammam Urban',
    mandal: 'Khammam',
    displayName: 'Khammam, Telangana, India',
    latitude: 17.2473,
    longitude: 80.1514,
    source: 'manual',
  },
  {
    district: 'Karimnagar',
    state: 'Telangana',
    village: 'Karimnagar',
    mandal: 'Karimnagar',
    displayName: 'Karimnagar, Telangana, India',
    latitude: 18.4386,
    longitude: 79.1288,
    source: 'manual',
  },
  {
    district: 'Nizamabad',
    state: 'Telangana',
    village: 'Armoor',
    mandal: 'Armoor',
    displayName: 'Nizamabad, Telangana, India',
    latitude: 18.6725,
    longitude: 78.0941,
    source: 'manual',
  },
  {
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    village: 'Kurnool',
    mandal: 'Kurnool',
    displayName: 'Kurnool, Andhra Pradesh, India',
    latitude: 15.8281,
    longitude: 78.0373,
    source: 'manual',
  },
  {
    district: 'Nandyal',
    state: 'Andhra Pradesh',
    village: 'Nandyal',
    mandal: 'Nandyal',
    displayName: 'Nandyal, Andhra Pradesh, India',
    latitude: 15.4736,
    longitude: 78.4807,
    source: 'manual',
  },
  {
    district: 'Nashik',
    state: 'Maharashtra',
    village: 'Niphad',
    mandal: 'Niphad',
    displayName: 'Nashik, Maharashtra, India',
    latitude: 19.9975,
    longitude: 73.7898,
    source: 'manual',
  }
];

const LOCATION_CACHE_KEY = 'user_selected_location';

function cleanDistrictName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\s+district$/i, '')
    .replace(/\s+rural$/i, '')
    .replace(/\s+urban$/i, '')
    .trim();
}

export const LocationService = {
  /**
   * Get default or previously cached/stored location
   */
  getDefaultLocation(): LocationContext {
    const cached = CacheService.get<LocationContext>(LOCATION_CACHE_KEY);
    if (cached && cached.data?.latitude && cached.data?.longitude) {
      return cached.data;
    }

    // Try reading active profile district if saved
    try {
      const savedProfileStr = localStorage.getItem('agriguide_farmer_profile');
      if (savedProfileStr) {
        const p = JSON.parse(savedProfileStr);
        if (p.district) {
          const match = AGRICULTURAL_DISTRICTS.find(d => d.district.toLowerCase() === p.district.toLowerCase());
          if (match) return { ...match, village: p.village || match.village };
          return {
            district: p.district,
            state: p.state || 'Telangana',
            village: p.village || '',
            latitude: 17.9689,
            longitude: 79.5941,
            source: 'manual',
          };
        }
      }
    } catch (_) {}

    return AGRICULTURAL_DISTRICTS[0];
  },

  /**
   * Save user selected or detected location to cache & localStorage
   */
  saveLocation(loc: LocationContext): void {
    CacheService.set(LOCATION_CACHE_KEY, loc);
    try {
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(loc));
    } catch (_) {}
  },

  /**
   * Real-time Reverse Geocode (Lat, Lon -> Village, Mandal, District, State)
   * Uses backend OpenStreetMap proxy with direct OpenStreetMap Nominatim fallback
   */
  async reverseGeocode(lat: number, lon: number): Promise<LocationContext> {
    try {
      const res = await fetchApi<LocationContext>(`/location/reverse?lat=${lat}&lon=${lon}`);
      if (res.success && res.data) {
        const data = res.data;
        return {
          district: cleanDistrictName(data.district) || 'Warangal',
          state: data.state || 'Telangana',
          village: data.village || '',
          mandal: data.mandal || '',
          displayName: data.displayName || `${data.district}, ${data.state}`,
          latitude: Number(data.latitude || lat),
          longitude: Number(data.longitude || lon),
          source: 'gps',
        };
      }
    } catch (err: any) {
      console.warn('[LocationService] Backend reverse geocode notice:', err.message);
    }

    // Direct client fallback to OpenStreetMap Nominatim
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        const village = address.village || address.suburb || address.town || address.hamlet || address.neighbourhood || '';
        const mandal = address.county || address.subdistrict || address.tehsil || '';
        const rawDistrict = address.state_district || address.district || address.city || address.county || '';
        const district = cleanDistrictName(rawDistrict) || 'Warangal';
        const state = address.state || 'Telangana';

        return {
          district,
          state,
          village,
          mandal,
          displayName: data.display_name,
          latitude: lat,
          longitude: lon,
          source: 'gps',
        };
      }
    } catch (fallbackErr: any) {
      console.warn('[LocationService] Client Nominatim fallback notice:', fallbackErr.message);
    }

    return {
      district: 'Warangal',
      state: 'Telangana',
      village: 'Current Location',
      latitude: lat,
      longitude: lon,
      source: 'gps',
    };
  },

  /**
   * Search places/villages/mandals in India via OpenStreetMap
   */
  async searchLocations(query: string): Promise<LocationContext[]> {
    if (!query || !query.trim()) return [];

    try {
      const res = await fetchApi<LocationContext[]>(`/location/search?q=${encodeURIComponent(query)}`);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(d => ({
          district: cleanDistrictName(d.district) || 'Warangal',
          state: d.state || 'Telangana',
          village: d.village || '',
          mandal: d.mandal || '',
          displayName: d.displayName || `${d.district}, ${d.state}`,
          latitude: Number(d.latitude),
          longitude: Number(d.longitude),
          source: 'manual',
        }));
      }
    } catch (err: any) {
      console.warn('[LocationService] Backend search notice:', err.message);
    }

    // Direct Nominatim search fallback
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=in&addressdetails=1&limit=6`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const list = await response.json();
        if (Array.isArray(list)) {
          return list.map(item => {
            const address = item.address || {};
            const village = address.village || address.suburb || address.town || address.hamlet || address.neighbourhood || item.name || '';
            const mandal = address.county || address.subdistrict || address.tehsil || '';
            const rawDistrict = address.state_district || address.district || address.city || address.county || '';
            const district = cleanDistrictName(rawDistrict) || 'Warangal';
            const state = address.state || 'Telangana';

            return {
              district,
              state,
              village,
              mandal,
              displayName: item.display_name,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              source: 'manual',
            };
          });
        }
      }
    } catch (_) {}

    return [];
  },

  /**
   * Request device geolocation via browser GPS and reverse-geocode to real address
   */
  async requestDeviceLocation(): Promise<LocationContext> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const resolved = await LocationService.reverseGeocode(lat, lon);
            LocationService.saveLocation(resolved);
            resolve(resolved);
          } catch {
            const fallback: LocationContext = {
              district: 'Warangal',
              state: 'Telangana',
              village: 'GPS Location',
              latitude: lat,
              longitude: lon,
              source: 'gps',
            };
            LocationService.saveLocation(fallback);
            resolve(fallback);
          }
        },
        (error) => {
          console.warn('[LocationService] GPS permission error:', error.message);
          reject(error);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }
};
