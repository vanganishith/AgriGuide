import React, { useState, useMemo, useEffect } from 'react';
import type { 
  Language, 
  Farm, 
  FarmerProfile, 
  SchemeCategory, 
  SavedSchemeRecord,
  SchemeInfo 
} from '../../types';
import { translations } from '../../i18n/translations';
import { SchemeRelevanceEngine } from '../../services/schemes/schemeRelevanceEngine';
import { 
  Landmark, 
  ShieldCheck, 
  Droplets, 
  Sprout, 
  FileText, 
  CheckCircle2, 
  Search, 
  ChevronRight, 
  AlertCircle, 
  ArrowRight
} from 'lucide-react';
import { SchemeDetailsModal } from './SchemeDetailsModal';
import { FertilizerToolModal } from './FertilizerToolModal';
import { CreditToolModal } from './CreditToolModal';
import { InsuranceToolModal } from './InsuranceToolModal';
import { SoilHealthToolModal } from './SoilHealthToolModal';

interface MoneySchemesFullExperienceProps {
  currentLang: Language;
  farmerProfile: FarmerProfile | null;
  farms: Farm[];
  initialSection?: 'all' | 'fertilizer' | 'schemes' | 'soil' | 'credit' | 'insurance' | 'irrigation';
  onNavigateTab?: (tab: string) => void;
}

type MainTab = 'for-you' | 'schemes' | 'tools';

export const MoneySchemesFullExperience: React.FC<MoneySchemesFullExperienceProps> = ({
  currentLang,
  farmerProfile,
  farms,
  initialSection = 'all',
}) => {
  const t = translations[currentLang];

  // 1. Extract consolidated farmer context
  const farmerContext = useMemo(() => {
    return SchemeRelevanceEngine.extractFarmerContext(farmerProfile, farms);
  }, [farmerProfile, farms]);

  // Primary 3-view navigation state
  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    if (initialSection === 'schemes') return 'schemes';
    if (['fertilizer', 'credit', 'insurance', 'soil'].includes(initialSection)) return 'tools';
    return 'for-you';
  });

  // Active crop selection state
  const availableCrops = useMemo(() => {
    if (farmerContext.activeCrops.length > 0) {
      return farmerContext.activeCrops;
    }
    return ['Paddy', 'Cotton', 'Chilli', 'Maize', 'Tomato'];
  }, [farmerContext.activeCrops]);

  const [selectedCrop, setSelectedCrop] = useState<string>(() => {
    return farmerContext.activeCrops.length > 0 ? farmerContext.activeCrops[0] : 'Paddy';
  });

  const [selectedAcres, setSelectedAcres] = useState<number>(() => {
    return farmerContext.totalCultivatedAcres > 0 ? farmerContext.totalCultivatedAcres : 3.0;
  });

  // Keep synced when farmer context loads
  useEffect(() => {
    if (farmerContext.activeCrops.length > 0 && !farmerContext.activeCrops.includes(selectedCrop)) {
      setSelectedCrop(farmerContext.activeCrops[0]);
      if (farmerContext.totalCultivatedAcres > 0) {
        setSelectedAcres(farmerContext.totalCultivatedAcres);
      }
    }
  }, [farmerContext.activeCrops, farmerContext.totalCultivatedAcres]);

  // 2. Evaluate all verified schemes against dynamic farmer context
  const dynamicContext = useMemo(() => {
    return {
      ...farmerContext,
      activeCrops: [selectedCrop],
      totalCultivatedAcres: selectedAcres,
    };
  }, [farmerContext, selectedCrop, selectedAcres]);

  const allEvaluations = useMemo(() => {
    return SchemeRelevanceEngine.evaluateAllSchemes(dynamicContext);
  }, [dynamicContext]);

  // Exactly Top 3 featured recommendations for "For You"
  const topRecommendations = useMemo(() => {
    return SchemeRelevanceEngine.getTopRecommendations(allEvaluations).slice(0, 3);
  }, [allEvaluations]);

  type CategoryFilterKey = SchemeCategory | 'saved' | 'income' | 'soil';

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected scheme for Drawer
  const [drawerScheme, setDrawerScheme] = useState<SchemeInfo | null>(null);

  // Tool Modals state
  const [activeToolModal, setActiveToolModal] = useState<'fertilizer' | 'credit' | 'insurance' | 'soil' | null>(() => {
    if (initialSection === 'fertilizer') return 'fertilizer';
    if (initialSection === 'credit') return 'credit';
    if (initialSection === 'insurance') return 'insurance';
    if (initialSection === 'soil') return 'soil';
    return null;
  });

  // Saved Schemes state (persisted via localStorage with zero schema modifications)
  const [savedSchemes, setSavedSchemes] = useState<Record<string, SavedSchemeRecord>>(() => {
    try {
      const saved = localStorage.getItem('agriguide_saved_schemes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agriguide_saved_schemes', JSON.stringify(savedSchemes));
    } catch {
      // client-only persistence fallback
    }
  }, [savedSchemes]);

  const toggleSaveScheme = (schemeId: string) => {
    setSavedSchemes(prev => {
      const exists = !!prev[schemeId];
      if (exists) {
        const next = { ...prev };
        delete next[schemeId];
        return next;
      } else {
        return {
          ...prev,
          [schemeId]: {
            schemeId,
            status: 'bookmarked',
            savedAt: new Date().toISOString(),
            completedDocuments: [],
          }
        };
      }
    });
  };

  // Filter schemes for Directory
  const filteredEvaluations = useMemo(() => {
    return allEvaluations.filter(item => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'saved') {
          if (!savedSchemes[item.scheme.id]) return false;
        } else if (selectedCategory === 'income' || selectedCategory === 'income_support') {
          if (item.scheme.category !== 'income_support') return false;
        } else if (selectedCategory === 'soil' || selectedCategory === 'soil_health') {
          if (item.scheme.category !== 'soil_health') return false;
        } else if (item.scheme.category !== selectedCategory) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.scheme.officialName.toLowerCase().includes(q) || item.scheme.shortName.toLowerCase().includes(q);
        const matchSummary = item.scheme.benefitSummary.toLowerCase().includes(q);
        const matchBenefit = item.scheme.benefitAmountDetails.toLowerCase().includes(q);
        const matchAuth = item.scheme.ministry.toLowerCase().includes(q);
        if (!matchName && !matchSummary && !matchBenefit && !matchAuth) return false;
      }
      return true;
    });
  }, [allEvaluations, selectedCategory, searchQuery, savedSchemes]);

  // Icon mapping helper
  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'credit':
        return <Landmark size={20} color="var(--ag-color-primary-dark)" />;
      case 'insurance':
        return <ShieldCheck size={20} color="#1D4ED8" />;
      case 'irrigation':
        return <Droplets size={20} color="#0284C7" />;
      case 'soil_health':
      case 'soil':
        return <Sprout size={20} color="#16A34A" />;
      default:
        return <FileText size={20} color="var(--ag-color-primary-base)" />;
    }
  };

  const categories: { key: CategoryFilterKey; label: string }[] = [
    { key: 'all', label: t.allSchemesTab },
    { key: 'income', label: t.incomeSupportTab },
    { key: 'credit', label: t.creditTab },
    { key: 'insurance', label: t.insuranceTab },
    { key: 'irrigation', label: t.irrigationTab },
    { key: 'soil', label: t.soilHealthTab },
    { key: 'mechanization', label: t.mechanizationTab },
    { key: 'saved', label: `${t.mySavedSchemesTab} (${Object.keys(savedSchemes).length})` },
  ];

  return (
    <div style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '16px 16px 40px',
      fontFamily: 'var(--ag-font-family-base, inherit)',
      color: 'var(--ag-color-text-primary)',
    }}>
      {/* 1. COMPACT PAGE HEADER (~100-140px height) */}
      <div style={{
        padding: '12px 0 16px',
        borderBottom: '1px solid var(--ag-border-default)',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--ag-color-text-primary)',
              margin: '0 0 2px 0',
              letterSpacing: '-0.02em',
            }}>
              {t.moneySchemesTitle}
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--ag-color-text-secondary)',
              margin: 0,
            }}>
              {t.moneySchemesSubtitle}
            </p>
          </div>

          {/* Farm Context Selector */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            padding: '4px 10px',
            borderRadius: 'var(--ag-radius-full, 9999px)',
            border: '1px solid var(--ag-border-default)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            fontSize: '13px',
          }}>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              aria-label="Select Active Crop"
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                color: 'var(--ag-color-primary-dark)',
                cursor: 'pointer',
                outline: 'none',
                fontSize: '13px',
                paddingRight: '4px',
              }}
            >
              {availableCrops.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
            <span style={{ color: 'var(--ag-border-default)' }}>•</span>
            <span style={{ color: 'var(--ag-color-text-secondary)', fontWeight: 500 }}>
              {selectedAcres} acres
            </span>
            <span style={{ color: 'var(--ag-border-default)' }}>•</span>
            <span style={{ color: 'var(--ag-color-text-secondary)' }}>
              {farmerContext.district || 'Warangal'}, {farmerContext.state || 'Telangana'}
            </span>
          </div>
        </div>

        {/* 2. PRIMARY THREE-VIEW SEGMENTED CONTROL */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '16px',
        }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#EAEFE9',
            padding: '4px',
            borderRadius: 'var(--ag-radius-sm)',
            width: '100%',
            maxWidth: '440px',
          }}>
            <button
              onClick={() => setActiveTab('for-you')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: activeTab === 'for-you' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'for-you' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                fontWeight: activeTab === 'for-you' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'for-you' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {t.forYouTab}
            </button>
            <button
              onClick={() => setActiveTab('schemes')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: activeTab === 'schemes' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'schemes' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                fontWeight: activeTab === 'schemes' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'schemes' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {t.schemesTab}
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: activeTab === 'tools' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'tools' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                fontWeight: activeTab === 'tools' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'tools' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {t.farmToolsTab}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: FOR YOU (DEFAULT VIEW) */}
      {/* ========================================================= */}
      {activeTab === 'for-you' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section: Recommended for you */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--ag-color-text-primary)' }}>
                {t.recommendedForYou}
              </h2>
              <button
                onClick={() => setActiveTab('schemes')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ag-color-primary-base)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>View all schemes</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Top 3 Recommendation Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px',
            }}>
              {topRecommendations.map((item) => {
                const sName = currentLang === 'te' && item.scheme.officialNameTe 
                  ? item.scheme.officialNameTe 
                  : currentLang === 'hi' && item.scheme.officialNameHi 
                  ? item.scheme.officialNameHi 
                  : item.scheme.shortName || item.scheme.officialName;

                const sSummary = currentLang === 'te' && item.scheme.benefitSummaryTe 
                  ? item.scheme.benefitSummaryTe 
                  : currentLang === 'hi' && item.scheme.benefitSummaryHi 
                  ? item.scheme.benefitSummaryHi 
                  : item.scheme.benefitSummary;

                const sRelevance = currentLang === 'te' && item.relevanceReasonTe 
                  ? item.relevanceReasonTe 
                  : currentLang === 'hi' && item.relevanceReasonHi 
                  ? item.relevanceReasonHi 
                  : item.relevanceReason;

                return (
                  <div
                    key={item.scheme.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--ag-radius-sm)',
                      border: '1px solid var(--ag-border-default)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <div>
                      {/* Card Top: Icon & Authority */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--ag-radius-sm)',
                          backgroundColor: 'var(--ag-color-bg-base)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {renderCategoryIcon(item.scheme.category)}
                        </div>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: item.scheme.authority === 'central' ? '#EFF6FF' : '#F0FDF4',
                          color: item.scheme.authority === 'central' ? '#1E40AF' : '#166534',
                        }}>
                          {item.scheme.authority === 'central' ? 'Central' : 'State'}
                        </span>
                      </div>

                      {/* Scheme Name */}
                      <h3 style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--ag-color-text-primary)',
                        margin: '0 0 6px 0',
                        lineHeight: 1.3,
                      }}>
                        {sName}
                      </h3>

                      {/* Short benefit */}
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--ag-color-text-secondary)',
                        margin: '0 0 10px 0',
                        lineHeight: 1.4,
                      }}>
                        {sSummary}
                      </p>

                      {/* Why it matters */}
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--ag-color-text-primary)',
                        backgroundColor: 'var(--ag-color-bg-base)',
                        padding: '8px 10px',
                        borderRadius: '4px',
                        marginBottom: '12px',
                        lineHeight: 1.4,
                      }}>
                        <span style={{ fontWeight: 600, color: 'var(--ag-color-primary-dark)' }}>{t.whyRecommended} </span>
                        {sRelevance}
                      </div>
                    </div>

                    {/* Primary Action Button */}
                    <button
                      onClick={() => setDrawerScheme(item.scheme)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 'var(--ag-radius-sm)',
                        border: '1px solid var(--ag-color-primary-base)',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--ag-color-primary-base)',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background-color 0.15s ease',
                        minHeight: '44px',
                      }}
                    >
                      <span>{t.checkEligibilityBtn}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Next steps checklist (Max 3 actions) */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--ag-radius-sm)',
            border: '1px solid var(--ag-border-default)',
            padding: '16px',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--ag-color-text-primary)' }}>
              {t.nextStepsHeading}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div 
                onClick={() => {
                  const pmk = allEvaluations.find(e => e.scheme.id === 'pm-kisan');
                  if (pmk) setDrawerScheme(pmk.scheme);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--ag-color-bg-base)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <CheckCircle2 size={16} color="var(--ag-color-primary-base)" />
                  <span>Check PM-KISAN eligibility & eKYC status</span>
                </div>
                <ChevronRight size={16} color="var(--ag-color-text-secondary)" />
              </div>

              <div 
                onClick={() => setActiveToolModal('insurance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--ag-color-bg-base)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <CheckCircle2 size={16} color="var(--ag-color-primary-base)" />
                  <span>Review PMFBY crop insurance notification for {selectedCrop}</span>
                </div>
                <ChevronRight size={16} color="var(--ag-color-text-secondary)" />
              </div>

              <div 
                onClick={() => setActiveToolModal('soil')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--ag-color-bg-base)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <AlertCircle size={16} color="#D97706" />
                  <span>No laboratory soil test recorded • Learn how to collect a sample</span>
                </div>
                <ChevronRight size={16} color="var(--ag-color-text-secondary)" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: SCHEMES (EXPLORE DIRECTORY) */}
      {/* ========================================================= */}
      {activeTab === 'schemes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--ag-color-text-primary)' }}>
              {t.exploreSupportHeading}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: 0 }}>
              Explore verified Central and Telangana State assistance for agriculture.
            </p>
          </div>

          {/* Search bar */}
          <div style={{
            position: 'relative',
            width: '100%',
          }}>
            <Search 
              size={18} 
              color="var(--ag-color-text-secondary)" 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchSchemesPlaceholder}
              style={{
                width: '100%',
                padding: '11px 12px 11px 38px',
                borderRadius: 'var(--ag-radius-sm)',
                border: '1px solid var(--ag-border-default)',
                backgroundColor: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Compact horizontal category selector */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
          }}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '6px 12px',
                  borderRadius: 'var(--ag-radius-full, 9999px)',
                  border: '1px solid',
                  borderColor: selectedCategory === cat.key ? 'var(--ag-color-primary-base)' : 'var(--ag-border-default)',
                  backgroundColor: selectedCategory === cat.key ? 'var(--ag-color-primary-light)' : '#FFFFFF',
                  color: selectedCategory === cat.key ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                  fontWeight: selectedCategory === cat.key ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Compact Scheme List Rows (~80-100px each) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredEvaluations.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--ag-radius-sm)',
                border: '1px solid var(--ag-border-default)',
                color: 'var(--ag-color-text-secondary)',
                fontSize: '14px',
              }}>
                No matching schemes found. Try a different keyword or category.
              </div>
            ) : (
              filteredEvaluations.map((item) => {
                const sName = currentLang === 'te' && item.scheme.officialNameTe 
                  ? item.scheme.officialNameTe 
                  : currentLang === 'hi' && item.scheme.officialNameHi 
                  ? item.scheme.officialNameHi 
                  : item.scheme.officialName;

                const sSummary = currentLang === 'te' && item.scheme.benefitSummaryTe 
                  ? item.scheme.benefitSummaryTe 
                  : currentLang === 'hi' && item.scheme.benefitSummaryHi 
                  ? item.scheme.benefitSummaryHi 
                  : item.scheme.benefitSummary;

                return (
                  <div
                    key={item.scheme.id}
                    onClick={() => setDrawerScheme(item.scheme)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--ag-radius-sm)',
                      border: '1px solid var(--ag-border-default)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1, paddingRight: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--ag-radius-sm)',
                        backgroundColor: 'var(--ag-color-bg-base)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {renderCategoryIcon(item.scheme.category)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--ag-color-text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {sName}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: item.scheme.authority === 'central' ? '#EFF6FF' : '#F0FDF4',
                            color: item.scheme.authority === 'central' ? '#1E40AF' : '#166534',
                            flexShrink: 0,
                          }}>
                            {item.scheme.authority === 'central' ? 'Central' : 'State'}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--ag-color-text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {sSummary}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: item.matchLevel === 'highly_relevant' || item.matchLevel === 'likely_relevant' ? '#166534' : '#92400E',
                        backgroundColor: item.matchLevel === 'highly_relevant' || item.matchLevel === 'likely_relevant' ? '#DCFCE7' : '#FEF3C7',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}>
                        {item.matchLevel === 'highly_relevant' ? 'Relevant' : item.matchLevel === 'likely_relevant' ? 'Potentially Relevant' : 'Needs Verification'}
                      </span>
                      <ChevronRight size={18} color="var(--ag-color-text-secondary)" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: FARM TOOLS (4 FOCUSED TOOLS) */}
      {/* ========================================================= */}
      {activeTab === 'tools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--ag-color-text-primary)' }}>
              {t.farmToolsTab}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: 0 }}>
              {t.farmToolsSubtitle}
            </p>
          </div>

          {/* 2-Column Grid of 4 Tool Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
          }}>
            {/* Tool 1: Fertilizer */}
            <div
              onClick={() => setActiveToolModal('fertilizer')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--ag-radius-sm)',
                border: '1px solid var(--ag-border-default)',
                padding: '18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--ag-radius-sm)',
                  backgroundColor: 'var(--ag-color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <Sprout size={20} color="var(--ag-color-primary-dark)" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ag-color-text-primary)' }}>
                  Fertilizer
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '0 0 12px 0' }}>
                  {selectedCrop} • {selectedAcres} acres • PJTSAU crop dosage guidance
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-primary-base)' }}>
                <span>View crop guidance</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* Tool 2: Farm Credit */}
            <div
              onClick={() => setActiveToolModal('credit')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--ag-radius-sm)',
                border: '1px solid var(--ag-border-default)',
                padding: '18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--ag-radius-sm)',
                  backgroundColor: '#F0FDF4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <Landmark size={20} color="var(--ag-color-primary-dark)" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ag-color-text-primary)' }}>
                  Farm Credit (KCC)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '0 0 12px 0' }}>
                  Estimate cultivation requirement based on SLBC Scale of Finance.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-primary-base)' }}>
                <span>Estimate requirement</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* Tool 3: Crop Insurance */}
            <div
              onClick={() => setActiveToolModal('insurance')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--ag-radius-sm)',
                border: '1px solid var(--ag-border-default)',
                padding: '18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--ag-radius-sm)',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <ShieldCheck size={20} color="#1D4ED8" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ag-color-text-primary)' }}>
                  Crop Insurance (PMFBY)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '0 0 12px 0' }}>
                  Check season notifications and standard premium caps for {selectedCrop}.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#1D4ED8' }}>
                <span>Check coverage</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* Tool 4: Soil Health */}
            <div
              onClick={() => setActiveToolModal('soil')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--ag-radius-sm)',
                border: '1px solid var(--ag-border-default)',
                padding: '18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--ag-radius-sm)',
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <Sprout size={20} color="#B45309" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ag-color-text-primary)' }}>
                  Soil Health
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '0 0 12px 0' }}>
                  {farmerContext.soilType || 'Red Loamy Soil'} • No laboratory test on record.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#B45309' }}>
                <span>Sampling guide & portal</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTLE TRUST FOOTER */}
      <div style={{
        marginTop: '32px',
        paddingTop: '16px',
        borderTop: '1px solid var(--ag-border-default)',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--ag-color-text-secondary)',
        lineHeight: 1.5,
      }}>
        {t.disclaimerNotice}
      </div>

      {/* SCHEME DETAILS CENTERED MODAL */}
      <SchemeDetailsModal
        scheme={drawerScheme}
        isOpen={!!drawerScheme}
        onClose={() => setDrawerScheme(null)}
        currentLang={currentLang}
        isSaved={drawerScheme ? !!savedSchemes[drawerScheme.id] : false}
        onToggleSave={toggleSaveScheme}
      />

      {/* FERTILIZER TOOL MODAL */}
      <FertilizerToolModal
        isOpen={activeToolModal === 'fertilizer'}
        onClose={() => setActiveToolModal(null)}
        currentLang={currentLang}
        selectedCrop={selectedCrop}
        selectedAcres={selectedAcres}
        locationState={farmerContext.state || 'Telangana'}
        soilTexture={farmerContext.soilType || 'Red Loamy Soil'}
        hasSoilTestReport={false}
      />

      {/* CREDIT TOOL MODAL */}
      <CreditToolModal
        isOpen={activeToolModal === 'credit'}
        onClose={() => setActiveToolModal(null)}
        currentLang={currentLang}
        selectedCrop={selectedCrop}
        selectedAcres={selectedAcres}
        locationDistrict={farmerContext.district || 'Warangal'}
        locationState={farmerContext.state || 'Telangana'}
      />

      {/* INSURANCE TOOL MODAL */}
      <InsuranceToolModal
        isOpen={activeToolModal === 'insurance'}
        onClose={() => setActiveToolModal(null)}
        currentLang={currentLang}
        selectedCrop={selectedCrop}
        selectedAcres={selectedAcres}
        locationDistrict={farmerContext.district || 'Warangal'}
        locationState={farmerContext.state || 'Telangana'}
      />

      {/* SOIL HEALTH TOOL MODAL */}
      <SoilHealthToolModal
        isOpen={activeToolModal === 'soil'}
        onClose={() => setActiveToolModal(null)}
        currentLang={currentLang}
        soilTexture={farmerContext.soilType || 'Red Loamy Soil'}
        hasSoilTestReport={false}
      />
    </div>
  );
};
