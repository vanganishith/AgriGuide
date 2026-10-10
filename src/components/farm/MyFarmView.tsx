import React, { useState, useEffect } from 'react';
import type { Language, LocationContext, Farm, FarmPlot, FarmerProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { FarmService } from '../../services/farm/farmService';
import { CropDailyActivitySection } from './CropDailyActivitySection';
import { PlanCropWizard } from './PlanCropWizard';

import { 
  localizeLocation, 
  localizeCropName, 
  localizeSoil, 
  localizeIrrigation, 
  localizeStage, 
  localizeTask, 
  localizeHybrid 
} from '../../i18n/agriLocalization';
import { 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  AlertOctagon, 
  Droplet, 
  Stethoscope,
  Sprout,
  CheckCircle,
  Info,
  LayoutGrid
} from 'lucide-react';

interface MyFarmViewProps {
  currentLang: Language;
  location: LocationContext;
  onNavigateToCropDoctor: () => void;
}

export const MyFarmView: React.FC<MyFarmViewProps> = ({
  currentLang,
  location,
  onNavigateToCropDoctor,
}) => {
  const t = translations[currentLang];
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'single_crop' | 'all_plots'>('single_crop');

  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [showPlanWizard, setShowPlanWizard] = useState<boolean>(false);

  const loadAllFarmData = async () => {
    setLoading(true);
    try {
      const [farmList, profile] = await Promise.all([
        FarmService.getFarms(),
        FarmService.getFarmerProfile(),
      ]);

      setFarms(farmList);
      if (profile) {
        setFarmerProfile(profile);
      } else {
        try {
          const localProf = localStorage.getItem('agriguide_farmer_profile');
          if (localProf) setFarmerProfile(JSON.parse(localProf));
        } catch (_) {}
      }

      if (farmList.length > 0) {
        setSelectedFarmId(prev => {
          if (prev && farmList.some(f => f.id === prev)) return prev;
          return farmList[0].id;
        });
      } else {
        setSelectedFarmId('');
      }
    } catch (err) {
      console.warn('[MyFarmView] Error loading farm records:', err);
      setFarms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllFarmData();
  }, []);

  const activeFarm = farms.find(f => f.id === selectedFarmId) || farms[0];

  const getStatusBadge = (status: FarmPlot['status']) => {
    switch (status) {
      case 'healthy':
        return {
          label: t.statusHealthy || 'Healthy',
          icon: <CheckCircle size={13} />,
          bg: 'var(--ag-color-primary-light)',
          color: 'var(--ag-color-primary-dark)',
          border: '1px solid #A3D9A5',
        };
      case 'under_watch':
        return {
          label: t.statusUnderWatch || 'Under Watch',
          icon: <AlertTriangle size={13} />,
          bg: 'var(--ag-color-harvest-light)',
          color: 'var(--ag-color-warning-base)',
          border: '1px solid #FAD48C',
        };
      case 'attention':
        return {
          label: t.statusAttention || 'Needs Action',
          icon: <AlertOctagon size={13} />,
          bg: '#FDF0F0',
          color: 'var(--ag-color-danger-base)',
          border: '1px solid #F7B5B3',
        };
      case 'unassessed':
      default:
        return {
          label: t.healthNotAssessed || 'Health not assessed yet',
          icon: <Info size={13} />,
          bg: '#F1F5F9',
          color: '#475569',
          border: '1px solid #CBD5E1',
        };
    }
  };

  const getCropEmoji = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('chilli') || n.includes('మిరప') || n.includes('मिर्च')) return '🌶️';
    if (n.includes('cotton') || n.includes('పత్తి') || n.includes('कपास')) return '🌾';
    if (n.includes('maize') || n.includes('మొక్కజొన్న') || n.includes('मक्का')) return '🌽';
    if (n.includes('paddy') || n.includes('వరి') || n.includes('धान') || n.includes('rice')) return '🌾';
    if (n.includes('tomato') || n.includes('టమాట') || n.includes('टमाटर')) return '🍅';
    return '🌱';
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {/* Top Header Section with Real Farmer Identity */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-primary-base)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {currentLang === 'te' ? 'రైతు వ్యవసాయ వేదిక' : (currentLang === 'hi' ? 'किसान कृषि कार्यक्षेत्र' : 'Farmer Agricultural Workspace')}
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {t.myFarmTitle || 'My Farm'}
            {farmerProfile?.fullName && farmerProfile.fullName !== 'Farmer' && (
              <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ag-color-text-secondary)', marginLeft: '8px' }}>
                — {farmerProfile.fullName}
              </span>
            )}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ag-color-text-secondary)', margin: '4px 0 0 0' }}>
            {activeFarm 
              ? localizeLocation(activeFarm.district, activeFarm.state, currentLang, activeFarm.village) 
              : (farmerProfile?.district 
                  ? localizeLocation(farmerProfile.district, farmerProfile.state, currentLang, farmerProfile.village) 
                  : (t.locationNotAdded || 'Location not added'))}
          </p>
        </div>

        {/* Primary Action Button */}
        {farms.length > 0 && (
          <button
            onClick={() => setShowPlanWizard(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--ag-color-primary-base)',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 22px',
              borderRadius: 'var(--ag-radius-full)',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              minHeight: '48px',
              boxShadow: 'var(--ag-shadow-button)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={18} />
            <span>{t.planCropBtn || 'Plan a Crop'}</span>
          </button>
        )}
      </div>

      {/* Loading feedback */}
      {loading && (
        <div style={{
          padding: '48px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--ag-color-surface-base)',
          borderRadius: 'var(--ag-radius-card)',
          border: '1px solid var(--ag-border-default)',
          color: 'var(--ag-color-text-secondary)',
          fontSize: '14px',
          fontWeight: 600,
        }}>
          {currentLang === 'te' ? 'మీ ధృవీకరించబడిన పొలం వివరాలు లోడ్ అవుతున్నాయి...' : (currentLang === 'hi' ? 'आपके सत्यापित खेत के रिकॉर्ड लोड हो रहे हैं...' : 'Loading your verified farm records...')}
        </div>
      )}

      {/* 1. Genuine Empty State: Zero Farms */}
      {!loading && farms.length === 0 && (
        <div style={{
          backgroundColor: 'var(--ag-color-surface-base)',
          borderRadius: '20px',
          border: '1px dashed var(--ag-border-default)',
          padding: '48px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--ag-color-primary-light)',
            color: 'var(--ag-color-primary-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sprout size={32} />
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: '0 0 6px 0' }}>
              {t.noFarmAddedYet || "You haven't added a farm yet."}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--ag-color-text-secondary)', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
              {currentLang === 'te' 
                ? 'మీ మొదటి పంటను ప్లాన్ చేయడంతో ప్రారంభించండి. మీ విస్తీర్ణం, నేల రకం మరియు సాగునీటి వనరులను అమర్చడంలో అగ్రిగైడ్ మీకు సహాయపడుతుంది.'
                : (currentLang === 'hi'
                    ? 'अपनी पहली फसल की योजना बनाने से शुरुआत करें। एग्रीगाइड आपके रकबे, मिट्टी के प्रकार और सिंचाई स्रोत को व्यवस्थित करने में मदद करेगा।'
                    : 'Start by planning your first crop. AgriGuide will help configure your acreage, soil type, and irrigation source.')}
            </p>
          </div>

          <button
            onClick={() => setShowPlanWizard(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--ag-color-primary-base)',
              color: '#FFFFFF',
              border: 'none',
              padding: '14px 28px',
              borderRadius: 'var(--ag-radius-full)',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              minHeight: '48px',
              boxShadow: 'var(--ag-shadow-button)',
              marginTop: '8px',
            }}
          >
            <Sparkles size={18} />
            <span>{t.planFirstCrop || 'Plan My First Crop'}</span>
          </button>
        </div>
      )}

      {/* Multiple Farms Selector Pills */}
      {!loading && farms.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {farms.map((f) => {
            const isSelected = f.id === activeFarm?.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFarmId(f.id);
                  if (f.plots && f.plots.length > 0) {
                    setSelectedPlotId(f.plots[0].id);
                  }
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--ag-radius-full)',
                  border: isSelected ? '2px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                  backgroundColor: isSelected ? 'var(--ag-color-primary-light)' : 'var(--ag-color-surface-base)',
                  color: isSelected ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                🌾 {f.farmName} ({f.totalAcres} ac)
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Farm Overview Card */}
      {!loading && activeFarm && (
        <div style={{
          backgroundColor: 'var(--ag-color-surface-base)',
          borderRadius: 'var(--ag-radius-card)',
          border: '1px solid var(--ag-border-default)',
          padding: '20px',
          boxShadow: 'var(--ag-shadow-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                {activeFarm.farmName}
              </h3>
              <span style={{
                backgroundColor: 'var(--ag-color-primary-light)',
                color: 'var(--ag-color-primary-dark)',
                fontSize: '12px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--ag-radius-full)',
              }}>
                {currentLang === 'te' ? `మొత్తం ${activeFarm.totalAcres} ఎకరాలు` : (currentLang === 'hi' ? `कुल ${activeFarm.totalAcres} एकड़` : `${activeFarm.totalAcres} Acres Total`)}
              </span>
              {activeFarm.availableAcres !== undefined && (
                <span style={{
                  backgroundColor: activeFarm.availableAcres > 0 ? '#FAFBF7' : '#FDF0F0',
                  color: activeFarm.availableAcres > 0 ? 'var(--ag-color-text-secondary)' : 'var(--ag-color-danger-base)',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--ag-radius-full)',
                  border: '1px solid var(--ag-border-default)',
                }}>
                  {currentLang === 'te' ? `${activeFarm.availableAcres.toFixed(1)} ఎకరాలు కేటాయించలేదు` : (currentLang === 'hi' ? `${activeFarm.availableAcres.toFixed(1)} एकड़ असंबद्ध` : `${activeFarm.availableAcres.toFixed(1)} ac unallocated`)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--ag-color-text-secondary)', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="var(--ag-color-primary-base)" />
                {localizeLocation(activeFarm.district, activeFarm.state, currentLang, activeFarm.village)}
              </span>
              <span>·</span>
              <span>🌱 {localizeSoil(activeFarm.soilType, currentLang)}</span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Droplet size={13} color="#0284C7" />
                {localizeIrrigation(activeFarm.irrigationSource, currentLang)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
            <div>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ag-color-primary-base)', display: 'block' }}>
                {activeFarm.plots.length}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase' }}>
                {t.plotsHeading || 'Plots'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', display: 'block' }}>
                {activeFarm.cropsCount || activeFarm.cropsList?.length || 0}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase' }}>
                {currentLang === 'te' ? 'పంటలు' : (currentLang === 'hi' ? 'फसलें' : 'Crops')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Active Crop Workspace: Select Crop & Daily Tasks */}
      {!loading && activeFarm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section Header with Crop Selector / Switcher */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                {t.activeCropsHeading || 'Active Crops'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '2px 0 0 0' }}>
                {activeFarm.plots.length === 0 
                  ? (currentLang === 'te' ? 'పంటలు నమోదు కాలేదు' : (currentLang === 'hi' ? 'कोई फसल दर्ज नहीं' : 'No crop plots recorded yet.'))
                  : (currentLang === 'te'
                      ? `${activeFarm.plots.length} పంట ప్లాట్లు · దినచర్య పనుల కోసం పంటను ఎంచుకోండి`
                      : (currentLang === 'hi'
                          ? `${activeFarm.plots.length} फसल प्लॉट · दैनिक कार्य देखने के लिए फसल चुनें`
                          : `${activeFarm.plots.length} crop ${activeFarm.plots.length === 1 ? 'plot' : 'plots'} recorded · Select a crop to manage`))}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {activeFarm.plots.length > 1 && (
                <div style={{
                  display: 'inline-flex',
                  backgroundColor: '#F1F5F0',
                  padding: '3px',
                  borderRadius: 'var(--ag-radius-full)',
                  border: '1px solid var(--ag-border-default)',
                }}>
                  <button
                    type="button"
                    onClick={() => setViewMode('single_crop')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--ag-radius-full)',
                      border: 'none',
                      backgroundColor: viewMode === 'single_crop' ? '#FFFFFF' : 'transparent',
                      color: viewMode === 'single_crop' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                      fontWeight: viewMode === 'single_crop' ? 800 : 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: viewMode === 'single_crop' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{currentLang === 'te' ? 'పంట దినచర్య' : (currentLang === 'hi' ? 'दैनिक कार्य' : 'Crop Focus')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('all_plots')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--ag-radius-full)',
                      border: 'none',
                      backgroundColor: viewMode === 'all_plots' ? '#FFFFFF' : 'transparent',
                      color: viewMode === 'all_plots' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                      fontWeight: viewMode === 'all_plots' ? 800 : 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: viewMode === 'all_plots' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <LayoutGrid size={13} />
                    <span>{currentLang === 'te' ? 'అన్ని ప్లాట్లు' : (currentLang === 'hi' ? 'सभी प्लॉट' : 'All Plots')}</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowPlanWizard(true)}
                style={{
                  backgroundColor: 'var(--ag-color-primary-base)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--ag-radius-full)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minHeight: '38px',
                }}
              >
                <Sparkles size={15} />
                <span>+ {t.planCropBtn || 'Plan a Crop'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Crop Selector (Pills + Select Box) */}
          {activeFarm.plots.length > 0 && (() => {
            const currentPlot = activeFarm.plots.find(p => p.id === (selectedPlotId || activeFarm.plots[0]?.id)) || activeFarm.plots[0];
            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                backgroundColor: 'var(--ag-color-surface-base)',
                border: '1px solid var(--ag-border-default)',
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: 'var(--ag-shadow-card)',
              }}>
                {/* Crop Pills for quick 1-click tap */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '2px',
                  flex: '1 1 auto',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px', whiteSpace: 'nowrap' }}>
                    {currentLang === 'te' ? 'పంటను ఎంచుకోండి:' : (currentLang === 'hi' ? 'फसल चुनें:' : 'Select Crop:')}
                  </span>
                  {activeFarm.plots.map((plot) => {
                    const isSelected = plot.id === currentPlot.id;
                    return (
                      <button
                        key={plot.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlotId(plot.id);
                          setViewMode('single_crop');
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--ag-radius-full)',
                          border: isSelected ? '2px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                          backgroundColor: isSelected ? 'var(--ag-color-primary-light)' : '#FFFFFF',
                          color: isSelected ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{getCropEmoji(plot.currentCrop)}</span>
                        <span>{localizeCropName(plot.currentCrop, currentLang)}</span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: isSelected ? '#FFFFFF' : '#F1F5F0',
                          color: isSelected ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                          padding: '1px 6px',
                          borderRadius: 'var(--ag-radius-full)',
                          border: '1px solid var(--ag-border-default)',
                        }}>
                          {plot.acres} ac
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Accessible Select Box Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <select
                    value={currentPlot.id}
                    onChange={(e) => {
                      setSelectedPlotId(e.target.value);
                      setViewMode('single_crop');
                    }}
                    aria-label="Select active farm crop"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ag-border-default)',
                      backgroundColor: '#FAFBF7',
                      color: 'var(--ag-color-text-primary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {activeFarm.plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {localizeCropName(p.currentCrop, currentLang)} — {p.acres} ac ({p.variety || p.stage})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })()}

          {/* Empty state when 0 plots */}
          {activeFarm.plots.length === 0 && (
            <div style={{
              backgroundColor: 'var(--ag-color-surface-base)',
              borderRadius: '16px',
              border: '1px dashed var(--ag-border-default)',
              padding: '28px 20px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', margin: '0 0 4px 0' }}>
                {t.noCropsMonitored || 'No crops are being monitored yet.'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '0 0 14px 0' }}>
                Plan your crop to start recording health observations and recommendations.
              </p>
              <button
                onClick={() => setShowPlanWizard(true)}
                style={{
                  backgroundColor: 'var(--ag-color-primary-base)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 'var(--ag-radius-full)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t.planCropBtn || 'Plan a Crop'}
              </button>
            </div>
          )}

          {/* VIEW MODE A: SINGLE CROP FOCUSED WORKSPACE (Default) */}
          {activeFarm.plots.length > 0 && viewMode === 'single_crop' && (() => {
            const currentPlot = activeFarm.plots.find(p => p.id === (selectedPlotId || activeFarm.plots[0]?.id)) || activeFarm.plots[0];
            const badge = getStatusBadge(currentPlot.status);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Focused Crop Overview Card */}
                <div
                  style={{
                    backgroundColor: 'var(--ag-color-surface-base)',
                    borderRadius: '16px',
                    border: '1px solid var(--ag-border-default)',
                    padding: '18px 20px',
                    boxShadow: 'var(--ag-shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '24px', flexShrink: 0 }}>{getCropEmoji(currentPlot.currentCrop)}</span>
                        <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                          {localizeCropName(currentPlot.currentCrop, currentLang)}
                        </h4>
                        <span style={{
                          backgroundColor: 'var(--ag-color-primary-light)',
                          color: 'var(--ag-color-primary-dark)',
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 'var(--ag-radius-full)',
                          border: '1px solid #A3D9A5',
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}>
                          {currentPlot.acres} {currentLang === 'te' ? 'ఎకరాలు' : (currentLang === 'hi' ? 'एकड़' : 'Acres')}
                        </span>
                        {currentPlot.variety && (
                          <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', wordBreak: 'break-word', maxWidth: '100%' }}>
                            ({localizeHybrid(currentPlot.variety, currentLang)})
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--ag-color-text-secondary)', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span>🌱 {localizeStage(currentPlot.stage, currentLang)}</span>
                        {currentPlot.daysSincePlanting !== undefined && currentPlot.daysSincePlanting > 0 && (
                          <>
                            <span>·</span>
                            <span>📅 {currentLang === 'te' ? `విత్తిన తర్వాత ${currentPlot.daysSincePlanting}వ రోజు` : (currentLang === 'hi' ? `बुवाई के बाद दिन ${currentPlot.daysSincePlanting}` : `Day ${currentPlot.daysSincePlanting} since sowing`)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Health Status Badge */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: badge.border,
                        padding: '4px 12px',
                        borderRadius: 'var(--ag-radius-full)',
                        fontSize: '12px',
                        fontWeight: 800,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </div>

                      {/* Diagnose CTA */}
                      <button
                        onClick={onNavigateToCropDoctor}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'transparent',
                          color: 'var(--ag-color-primary-base)',
                          border: '1px solid var(--ag-color-primary-base)',
                          padding: '6px 14px',
                          borderRadius: 'var(--ag-radius-full)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          minHeight: '34px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Stethoscope size={14} />
                        <span>{currentLang === 'te' ? 'పంట తనిఖీ' : (currentLang === 'hi' ? 'फसल जांच' : `Diagnose ${currentPlot.currentCrop}`)}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Priorities */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '10px',
                    backgroundColor: '#FAFBF7',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--ag-border-default)',
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-primary-base)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ⚡ {t.todayCropAction || "Today's Action"}
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
                        {localizeTask(currentPlot.todayAction, currentLang) || (t.noActionScheduled || 'No action scheduled today.')}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        🗓 {t.nextCropAction || 'Next Action'}
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 600, color: 'var(--ag-color-text-secondary)' }}>
                        {localizeTask(currentPlot.nextAction, currentLang) || (currentLang === 'te' ? 'సాధారణ చేను పరిశీలన కొనసాగించండి.' : (currentLang === 'hi' ? 'नियमित फसल निगरानी जारी रखें।' : 'Maintain regular crop scouting.'))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Render Crop Daily Activities for this focused crop */}
                <CropDailyActivitySection
                  key={currentPlot.id}
                  plot={currentPlot}
                  currentLang={currentLang}
                  farmSoilType={activeFarm.soilType}
                  farmIrrigationSource={activeFarm.irrigationSource}
                  farmDistrict={activeFarm.district}
                  farmState={activeFarm.state}
                  onActivityChanged={loadAllFarmData}
                />
              </div>
            );
          })()}

          {/* VIEW MODE B: ALL PLOTS OVERVIEW GRID */}
          {activeFarm.plots.length > 0 && viewMode === 'all_plots' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeFarm.plots.map((plot) => {
                const badge = getStatusBadge(plot.status);
                const isSelected = plot.id === (selectedPlotId || activeFarm.plots[0]?.id);
                return (
                  <div
                    key={plot.id}
                    style={{
                      backgroundColor: 'var(--ag-color-surface-base)',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                      padding: '18px 20px',
                      boxShadow: 'var(--ag-shadow-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                      <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '20px', flexShrink: 0 }}>{getCropEmoji(plot.currentCrop)}</span>
                          <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                            {localizeCropName(plot.currentCrop, currentLang)}
                          </h4>
                          <span style={{
                            backgroundColor: '#FAFBF7',
                            color: 'var(--ag-color-text-secondary)',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--ag-radius-full)',
                            border: '1px solid var(--ag-border-default)',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                          }}>
                            {plot.acres} {currentLang === 'te' ? 'ఎకరాలు' : (currentLang === 'hi' ? 'एकड़' : 'Acres')}
                          </span>
                          {plot.variety && (
                            <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', wordBreak: 'break-word', maxWidth: '100%' }}>
                              ({localizeHybrid(plot.variety, currentLang)})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--ag-color-text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span>🌱 {localizeStage(plot.stage, currentLang)}</span>
                          {plot.daysSincePlanting !== undefined && plot.daysSincePlanting > 0 && (
                            <>
                              <span>·</span>
                              <span>📅 {currentLang === 'te' ? `విత్తిన తర్వాత ${plot.daysSincePlanting}వ రోజు` : (currentLang === 'hi' ? `बुवाई के बाद दिन ${plot.daysSincePlanting}` : `Day ${plot.daysSincePlanting} since sowing`)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: badge.border,
                          padding: '4px 12px',
                          borderRadius: 'var(--ag-radius-full)',
                          fontSize: '12px',
                          fontWeight: 800,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlotId(plot.id);
                            setViewMode('single_crop');
                          }}
                          style={{
                            backgroundColor: 'var(--ag-color-primary-base)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 'var(--ag-radius-full)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {currentLang === 'te' ? 'దినచర్య చూడండి →' : (currentLang === 'hi' ? 'दैनिक कार्य देखें →' : 'View Daily Tasks →')}
                        </button>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '10px',
                      backgroundColor: '#FAFBF7',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--ag-border-default)',
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-primary-base)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          ⚡ {t.todayCropAction || "Today's Action"}
                        </span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
                          {localizeTask(plot.todayAction, currentLang) || (t.noActionScheduled || 'No action scheduled today.')}
                        </p>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          🗓 {t.nextCropAction || 'Next Action'}
                        </span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 600, color: 'var(--ag-color-text-secondary)' }}>
                          {localizeTask(plot.nextAction, currentLang) || (currentLang === 'te' ? 'సాధారణ చేను పరిశీలన కొనసాగించండి.' : (currentLang === 'hi' ? 'नियमित फसल निगरानी जारी रखें।' : 'Maintain regular crop scouting.'))}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* Plan Crop Wizard Modal */}
      {showPlanWizard && (
        <PlanCropWizard
          isOpen={showPlanWizard}
          onClose={() => setShowPlanWizard(false)}
          farms={farms}
          location={location}
          currentLang={currentLang}
          onCropStarted={loadAllFarmData}
        />
      )}
    </div>
  );
};
