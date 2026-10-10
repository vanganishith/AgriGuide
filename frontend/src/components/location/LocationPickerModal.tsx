import React, { useState, useEffect, useRef } from 'react';
import type { LocationContext, Language } from '../../types';
import { LocationService, AGRICULTURAL_DISTRICTS } from '../../services/location/locationService';
import { localizeLocation, localizeDistrict } from '../../i18n/agriLocalization';
import { 
  MapPin, 
  Search, 
  Crosshair, 
  X, 
  Check, 
  Loader2, 
  Map as MapIcon,
  Navigation
} from 'lucide-react';
import L from 'leaflet';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationContext;
  onLocationSelected: (location: LocationContext) => void;
  currentLang?: Language;
}

// Custom Green Pin Icon for Leaflet
const createPinIcon = () => {
  return L.divIcon({
    className: 'ag-custom-map-pin',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: #1B4D3E;
        border: 3px solid #FFFFFF;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: #A3D9A5;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onLocationSelected,
  currentLang = 'en',
}) => {
  const [selectedLoc, setSelectedLoc] = useState<LocationContext>(currentLocation);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<LocationContext[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Initialize selected location when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLoc(currentLocation);
      setSearchQuery('');
      setSearchResults([]);
      setErrorMsg('');
    }
  }, [isOpen, currentLocation]);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const initialLat = selectedLoc.latitude || 17.9689;
    const initialLon = selectedLoc.longitude || 79.5941;

    // Destroy existing instance if container changed
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Draggable Marker
    const marker = L.marker([initialLat, initialLon], {
      icon: createPinIcon(),
      draggable: true,
    }).addTo(map);

    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      await handleCoordinatesPicked(pos.lat, pos.lng);
    });

    map.on('click', async (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      await handleCoordinatesPicked(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Ensure map container renders tiles properly after modal transition
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle Picked Lat/Lon from map click or marker drag
  const handleCoordinatesPicked = async (lat: number, lon: number) => {
    setIsGeocoding(true);
    setErrorMsg('');
    try {
      const resolved = await LocationService.reverseGeocode(lat, lon);
      setSelectedLoc(resolved);
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      }
    } catch (err: any) {
      setErrorMsg('Could not fetch address details for this pin.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Live OpenStreetMap Autocomplete Search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text.trim() || text.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await LocationService.searchLocations(text.trim());
        setSearchResults(results);
      } catch (err) {
        console.warn('[LocationPicker] Search notice:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Select a place from Search or Quick Hubs
  const handleSelectPlace = (loc: LocationContext) => {
    setSelectedLoc(loc);
    setSearchResults([]);
    setSearchQuery('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 13, { duration: 1.2 });
      markerRef.current.setLatLng([loc.latitude, loc.longitude]);
    }
  };

  // 1-Click Live GPS Detection
  const handleDetectGPS = async () => {
    setIsDetectingGps(true);
    setErrorMsg('');
    try {
      const gpsLoc = await LocationService.requestDeviceLocation();
      setSelectedLoc(gpsLoc);

      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.flyTo([gpsLoc.latitude, gpsLoc.longitude], 14, { duration: 1.2 });
        markerRef.current.setLatLng([gpsLoc.latitude, gpsLoc.longitude]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'GPS location permission denied or unavailable.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Confirm and Apply Location
  const handleConfirm = () => {
    LocationService.saveLocation(selectedLoc);
    onLocationSelected(selectedLoc);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(25, 53, 42, 0.72)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9995,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: 'var(--ag-radius-card)',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '92vh',
        boxShadow: 'var(--ag-shadow-elevated)',
        border: '1px solid var(--ag-border-default)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--ag-border-default)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FAFBF7',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--ag-color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ag-color-primary-base)',
            }}>
              <MapIcon size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                {currentLang === 'te' ? 'పొలం స్థానాన్ని ఎంచుకోండి' : currentLang === 'hi' ? 'खेत का स्थान चुनें' : 'Choose Farm Location'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ag-color-text-secondary)', fontWeight: 500 }}>
                {currentLang === 'te' ? 'OpenStreetMap & లైవ్ GPS ఆధారితం' : (currentLang === 'hi' ? 'OpenStreetMap और लाइव GPS द्वारा संचालित' : 'Powered by OpenStreetMap & Real-Time GPS')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ag-color-text-secondary)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ag-border-default)', display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
          {/* Search Input */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid var(--ag-border-default)',
            borderRadius: '12px',
            padding: '8px 12px',
            gap: '8px',
          }}>
            <Search size={16} color="var(--ag-color-text-secondary)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={currentLang === 'te' ? 'గ్రామం, మండలం లేదా జిల్లాను శోధించండి...' : (currentLang === 'hi' ? 'गाँव, मंडल या जिला खोजें...' : 'Search village, mandal, or district...')}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ag-color-text-primary)',
              }}
            />
            {isSearching && <Loader2 size={16} className="animate-spin" color="var(--ag-color-primary-base)" />}
          </div>

          {/* Detect GPS Button */}
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isDetectingGps}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isDetectingGps ? 'var(--ag-color-primary-light)' : 'var(--ag-color-primary-base)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--ag-shadow-button)',
            }}
          >
            {isDetectingGps ? <Loader2 size={15} className="animate-spin" /> : <Crosshair size={15} />}
            <span>{isDetectingGps ? (currentLang === 'te' ? 'గుర్తిస్తున్నాము...' : 'Detecting...') : (currentLang === 'te' ? 'లైవ్ GPS' : (currentLang === 'hi' ? 'लाइव GPS' : 'Live GPS'))}</span>
          </button>

          {/* Autocomplete Dropdown List */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '20px',
              right: '20px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid var(--ag-border-default)',
              zIndex: 10000,
              maxHeight: '220px',
              overflowY: 'auto',
              marginTop: '4px',
            }}>
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPlace(result)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid #F0F2EB',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAFBF7')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  <MapPin size={16} color="var(--ag-color-primary-base)" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                      {localizeLocation(result.district, result.state, currentLang, result.village)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', marginTop: '2px' }}>
                      {result.displayName || `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick District Chips */}
        <div style={{
          padding: '8px 20px',
          backgroundColor: '#FAFBF7',
          borderBottom: '1px solid var(--ag-border-default)',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase' }}>
            {currentLang === 'te' ? 'ముఖ్య జిల్లాలు:' : (currentLang === 'hi' ? 'प्रमुख जिले:' : 'Quick Hubs:')}
          </span>
          {AGRICULTURAL_DISTRICTS.map((hub) => {
            const isMatch = hub.district.toLowerCase() === selectedLoc.district.toLowerCase();
            return (
              <button
                key={hub.district}
                type="button"
                onClick={() => handleSelectPlace(hub)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--ag-radius-full)',
                  border: isMatch ? '1.5px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                  backgroundColor: isMatch ? 'var(--ag-color-primary-light)' : '#FFFFFF',
                  color: isMatch ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)',
                  fontSize: '12px',
                  fontWeight: isMatch ? 800 : 600,
                  cursor: 'pointer',
                }}
              >
                {localizeDistrict(hub.district, currentLang)}
              </button>
            );
          })}
        </div>

        {/* Leaflet Map Body */}
        <div style={{ position: 'relative', flex: 1, minHeight: '260px' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '260px' }} />

          {/* Hint Overlay */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(2px)',
            borderRadius: '20px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--ag-color-primary-dark)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 500,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Navigation size={12} />
            <span>{currentLang === 'te' ? 'మ్యాప్‌పై నొక్కండి లేదా పిన్‌ను మీ పొలం వద్దకు జరపండి' : (currentLang === 'hi' ? 'मानचित्र पर क्लिक करें या पिन को खेत पर खींचें' : 'Click map or drag pin to your field')}</span>
          </div>

          {isGeocoding && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(27, 77, 62, 0.9)',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              zIndex: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Loader2 size={14} className="animate-spin" />
              <span>{currentLang === 'te' ? 'OpenStreetMap నుండి చిరునామా తీసుకుంటున్నాము...' : (currentLang === 'hi' ? 'OpenStreetMap से पता प्राप्त किया जा रहा है...' : 'Fetching address from OpenStreetMap...')}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div style={{
            padding: '8px 20px',
            backgroundColor: '#FDF0F0',
            color: 'var(--ag-color-danger-base)',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {errorMsg}
          </div>
        )}

        {/* Selected Location Card & Action Footer */}
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#FAFBF7',
          borderTop: '1px solid var(--ag-border-default)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid var(--ag-border-default)',
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--ag-color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ag-color-primary-base)',
                flexShrink: 0,
              }}>
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                  {localizeLocation(selectedLoc.district, selectedLoc.state, currentLang, selectedLoc.village)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                  📍 {selectedLoc.latitude.toFixed(4)}° N, {selectedLoc.longitude.toFixed(4)}° E · {selectedLoc.source === 'gps' ? (currentLang === 'te' ? 'GPS ద్వారా గుర్తించబడింది' : (currentLang === 'hi' ? 'GPS द्वारा पहचाना गया' : 'GPS Detected')) : (currentLang === 'te' ? 'మ్యాప్ పిన్' : (currentLang === 'hi' ? 'मानचित्र पिन' : 'Map Pin'))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--ag-radius-full)',
                border: '1px solid var(--ag-border-default)',
                backgroundColor: '#FFFFFF',
                color: 'var(--ag-color-text-primary)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {currentLang === 'te' ? 'రద్దు చేయండి' : (currentLang === 'hi' ? 'रद्द करें' : 'Cancel')}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: 'var(--ag-radius-full)',
                border: 'none',
                backgroundColor: 'var(--ag-color-primary-base)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--ag-shadow-button)',
              }}
            >
              <Check size={18} />
              <span>{currentLang === 'te' ? 'స్థానాన్ని నిర్ధారించండి' : (currentLang === 'hi' ? 'स्थान की पुष्टि करें' : 'Confirm Location')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
