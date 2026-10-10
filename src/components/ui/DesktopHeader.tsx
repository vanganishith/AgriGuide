import React, { useState } from 'react';
import type { Language, LocationContext, DesktopNavTab } from '../../types';
import { translations } from '../../i18n/translations';
import { localizeLocation } from '../../i18n/agriLocalization';
import { 
  Sprout, 
  MapPin, 
  WifiOff, 
  User, 
  ChevronDown, 
  Stethoscope, 
  Store, 
  Landmark, 
  Bell 
} from 'lucide-react';
import { LocationPickerModal } from '../location/LocationPickerModal';

export type { DesktopNavTab };

interface DesktopHeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  location: LocationContext;
  onLocationChange: (loc: LocationContext) => void;
  isOffline: boolean;
  activeTab: DesktopNavTab;
  onTabChange: (tab: DesktopNavTab) => void;
  farmerProfile?: { phone?: string; fullName?: string } | null;
  onOpenLogin?: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  currentLang,
  onLanguageChange,
  location,
  onLocationChange,
  isOffline,
  activeTab,
  onTabChange,
  farmerProfile,
  onOpenLogin,
}) => {
  const t = translations[currentLang];
  const [showLocationModal, setShowLocationModal] = useState(false);

  const navLinks: { id: DesktopNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'doctor', label: t.navCropDoctor, icon: <Stethoscope size={15} /> },
    { id: 'farm', label: t.navMyFarm, icon: <Sprout size={15} /> },
    { id: 'mandi', label: t.navMandi, icon: <Store size={15} /> },
    { id: 'money', label: t.navMoney, icon: <Landmark size={15} /> },
    { id: 'alerts', label: t.navAlerts, icon: <Bell size={15} /> },
  ];

  return (
    <header style={{
      backgroundColor: 'var(--ag-color-surface-base)',
      borderBottom: '1px solid var(--ag-border-default)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 4px rgba(25, 53, 42, 0.04)',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 16px',
        minHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxSizing: 'border-box',
      }}>
        {/* Left: Brand Identity (Navigates to Home) */}
        <div 
          onClick={() => onTabChange('home')}
          role="button"
          tabIndex={0}
          aria-label="Navigate to AgriGuide Home"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            flexShrink: 0,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--ag-radius-md)',
            backgroundColor: 'var(--ag-color-primary-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 2px 6px rgba(47, 125, 50, 0.22)',
            flexShrink: 0,
          }}>
            <Sprout size={22} />
          </div>

          <div>
            <span style={{
              fontSize: '19px',
              fontWeight: 800,
              color: 'var(--ag-color-text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              display: 'block',
            }}>
              {t.brandName}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--ag-color-primary-base)',
              letterSpacing: '0.01em',
            }}>
              {t.brandTagline}
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav 
          aria-label="Desktop Primary Navigation" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            padding: '4px 0',
          }}
        >
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  minHeight: '36px',
                  borderRadius: 'var(--ag-radius-full)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--ag-color-primary-light)' : 'transparent',
                  color: isActive ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ color: isActive ? 'var(--ag-color-primary-base)' : 'inherit', display: 'flex' }}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side: Location, Language, Profile Symbol */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Offline Pill */}
          {isOffline && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: 'var(--ag-color-harvest-light)',
              color: 'var(--ag-color-warning-base)',
              padding: '3px 8px',
              borderRadius: 'var(--ag-radius-full)',
              fontWeight: 700,
              fontSize: '11px',
            }}>
              <WifiOff size={12} />
              {t.offlineBadge}
            </span>
          )}

          {/* Location Selector */}
          <button
            onClick={() => setShowLocationModal(true)}
            aria-label="Change farm location on map"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--ag-color-bg-base)',
              border: '1px solid var(--ag-border-default)',
              padding: '6px 12px',
              borderRadius: 'var(--ag-radius-md)',
              color: 'var(--ag-color-text-primary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              maxWidth: '180px',
            }}
          >
            <MapPin size={13} color="var(--ag-color-primary-base)" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {localizeLocation(location.district, location.state, currentLang, location.village)}
            </span>
            <ChevronDown size={12} color="var(--ag-color-text-secondary)" style={{ flexShrink: 0 }} />
          </button>

          {/* Multilingual Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--ag-color-bg-base)',
            borderRadius: 'var(--ag-radius-full)',
            padding: '2px',
            border: '1px solid var(--ag-border-default)',
          }}>
            {(['en', 'te', 'hi'] as Language[]).map((lang) => {
              const isActive = currentLang === lang;
              const labels = { en: 'EN', te: 'తె', hi: 'हि' };
              return (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  aria-label={`Switch language to ${lang}`}
                  style={{
                    padding: '4px 8px',
                    minHeight: '28px',
                    minWidth: '30px',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    backgroundColor: isActive ? 'var(--ag-color-primary-base)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--ag-color-text-secondary)',
                    border: 'none',
                    borderRadius: 'var(--ag-radius-full)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {labels[lang]}
                </button>
              );
            })}
          </div>

          {/* Farmer Profile Symbol at the last of navbar */}
          <button 
            onClick={onOpenLogin}
            aria-label="Farmer Profile"
            title={farmerProfile?.fullName && farmerProfile.fullName !== 'Farmer' ? `${farmerProfile.fullName} (+91 ${farmerProfile.phone})` : (farmerProfile?.phone ? `+91 ${farmerProfile.phone}` : 'Farmer Profile')}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--ag-radius-full)',
              backgroundColor: 'var(--ag-color-primary-light)',
              border: '1px solid var(--ag-border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ag-color-primary-base)',
              cursor: onOpenLogin ? 'pointer' : 'default',
              padding: 0,
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <User size={16} />
          </button>
        </div>
      </div>

      {/* Interactive OpenStreetMap + Leaflet Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        currentLocation={location}
        onLocationSelected={onLocationChange}
        currentLang={currentLang}
      />
    </header>
  );
};
