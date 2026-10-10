import React, { useState, useMemo, useEffect } from 'react';
import type { MarketPrice, Language, LocationContext, CropHealth, Farm, FarmerProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { localizeCropName, localizeLocation } from '../../i18n/agriLocalization';
import { getMspBenchmarkForCommodity } from '../../services/market/mspReferenceData';
import { FarmerBuyersExperience } from '../marketplace/FarmerBuyersExperience';
import { 
  Store, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  ShieldCheck, 
  Info, 
  MapPin, 
  AlertCircle,
  RotateCcw,
  Calculator,
  Calendar,
  CheckCircle2,
  BadgeCheck,
  Building2
} from 'lucide-react';

interface MandiFullExperienceProps {
  markets: MarketPrice[];
  loading: boolean;
  error: string | null;
  currentLang: Language;
  location: LocationContext;
  farmerCrops?: CropHealth[];
  farms?: Farm[];
  farmerProfile?: FarmerProfile | null;
  onRefresh?: () => void;
  style?: React.CSSProperties;
}

export const MandiFullExperience: React.FC<MandiFullExperienceProps> = ({
  markets,
  loading,
  error,
  currentLang,
  location,
  farmerCrops = [],
  farms = [],
  farmerProfile,
  onRefresh,
  style,
}) => {
  const t = translations[currentLang];
  const [activeMarketView, setActiveMarketView] = useState<'mandi' | 'buyers'>('mandi');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketName, setSelectedMarketName] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'recent'>('highest');
  
  // Gross Sale Calculator State
  const [calcQuantity, setCalcQuantity] = useState<string>('20');
  const [calcUnit, setCalcUnit] = useState<'quintals' | 'bags'>('quintals');
  const [showCalculator, setShowCalculator] = useState<boolean>(true);

  // Extract farmer's active crops from farm context
  const farmerCropDetails = useMemo(() => {
    const list: { name: string; variety?: string; acres?: number; plotName?: string }[] = [];
    
    farmerCrops.forEach(c => {
      if (c.cropName && !list.some(item => item.name.toLowerCase() === c.cropName.toLowerCase())) {
        list.push({
          name: c.cropName,
          variety: c.variety,
          acres: c.acres,
          plotName: c.cropName,
        });
      }
    });

    farms.forEach(f => {
      (f.plots || []).forEach((p: any) => {
        if (p.currentCrop && !list.some(item => item.name.toLowerCase() === p.currentCrop.toLowerCase())) {
          list.push({
            name: p.currentCrop,
            variety: p.variety,
            acres: p.acres,
            plotName: p.plotName,
          });
        }
      });
    });

    return list;
  }, [farmerCrops, farms]);

  const farmerCropNames = useMemo(() => farmerCropDetails.map(d => d.name), [farmerCropDetails]);

  // Default to first active farmer crop, or first market commodity
  const [selectedCrop, setSelectedCrop] = useState<string>(() => {
    if (farmerCropNames.length > 0) return farmerCropNames[0];
    if (markets.length > 0) return markets[0].commodity;
    return 'Paddy';
  });

  // Keep selected crop synced with farmer's crops if list changes
  useEffect(() => {
    if (farmerCropNames.length > 0 && !farmerCropNames.some(c => c.toLowerCase() === selectedCrop.toLowerCase())) {
      setSelectedCrop(farmerCropNames[0]);
    }
  }, [farmerCropNames, selectedCrop]);

  // Primary crop selector: farmer's active farm crops exclusively when available
  const displayCrops = useMemo(() => {
    if (farmerCropNames.length > 0) {
      return farmerCropNames;
    }
    const set = new Set<string>();
    markets.forEach(m => set.add(m.commodity));
    return Array.from(set);
  }, [farmerCropNames, markets]);

  // Robust commodity matcher for synonyms (e.g. Red Gram / Tur / Arhar)
  const isCommodityMatching = (cropName: string, marketCommodity: string): boolean => {
    if (!cropName || !marketCommodity) return false;
    const a = cropName.toLowerCase().trim();
    const b = marketCommodity.toLowerCase().trim();
    if (a === b) return true;

    // Red Gram / Tur / Arhar / Pigeon Pea
    const isRedGramA = a.includes('red gram') || a.includes('redgram') || a.includes('tur') || a.includes('arhar') || a.includes('pigeon pea') || a.includes('కంది') || a.includes('కందులు');
    const isRedGramB = b.includes('red gram') || b.includes('redgram') || b.includes('tur') || b.includes('arhar') || b.includes('pigeon pea') || b.includes('కంది') || b.includes('కందులు');
    if (isRedGramA && isRedGramB) return true;

    // Groundnut / Peanut / வேరుశనగ
    const isGroundnutA = a.includes('groundnut') || a.includes('peanut') || a.includes('ground nut') || a.includes('వేరుశనగ');
    const isGroundnutB = b.includes('groundnut') || b.includes('peanut') || b.includes('ground nut') || b.includes('వేరుశనగ');
    if (isGroundnutA && isGroundnutB) return true;

    // Paddy / Rice / ధాన్యం / వరి
    const isPaddyA = a.includes('paddy') || a.includes('rice') || a.includes('వరి') || a.includes('ధాన్యం') || a.includes('धान');
    const isPaddyB = b.includes('paddy') || b.includes('rice') || b.includes('వరి') || b.includes('ధాన్యం') || b.includes('धान');
    if (isPaddyA && isPaddyB) return true;

    // Cotton / పత్తి / कपास
    const isCottonA = a.includes('cotton') || a.includes('పత్తి') || a.includes('कपास');
    const isCottonB = b.includes('cotton') || b.includes('పత్తి') || b.includes('कपास');
    if (isCottonA && isCottonB) return true;

    // Chilli / Chili / మిరప / మిర్చి
    const isChilliA = a.includes('chilli') || a.includes('chili') || a.includes('మిరప') || a.includes('మిర్చి');
    const isChilliB = b.includes('chilli') || b.includes('chili') || b.includes('మిరప') || b.includes('మిర్చి');
    if (isChilliA && isChilliB) return true;

    // Maize / Corn / మొక్కజొన్న
    const isMaizeA = a.includes('maize') || a.includes('corn') || a.includes('మొక్కజొన్న');
    const isMaizeB = b.includes('maize') || b.includes('corn') || b.includes('మొక్కజొన్న');
    if (isMaizeA && isMaizeB) return true;

    // Tomato / టమాట
    const isTomatoA = a.includes('tomato') || a.includes('టమాట') || a.includes('टमाटर');
    const isTomatoB = b.includes('tomato') || b.includes('టమాట') || b.includes('टमाटर');
    if (isTomatoA && isTomatoB) return true;

    return a.includes(b) || b.includes(a);
  };

  // Active crop context detail for farmer's active selection
  const activeCropFarmDetail = useMemo(() => {
    return farmerCropDetails.find(c => isCommodityMatching(c.name, selectedCrop));
  }, [farmerCropDetails, selectedCrop]);

  // Filter markets for current selected crop and search
  const filteredMarketsForCrop = useMemo(() => {
    const cropMatches = markets.filter(m => 
      isCommodityMatching(selectedCrop, m.commodity)
    );

    if (!searchQuery.trim()) return cropMatches;

    const q = searchQuery.toLowerCase().trim();
    return markets.filter(m => {
      const matchSearch = 
        m.commodity.toLowerCase().includes(q) || 
        m.marketName.toLowerCase().includes(q) || 
        m.district.toLowerCase().includes(q) ||
        (m.variety && m.variety.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [markets, selectedCrop, searchQuery]);

  // Resolve active market record
  const activeMarket = useMemo(() => {
    if (filteredMarketsForCrop.length === 0) return null;

    if (selectedMarketName) {
      const found = filteredMarketsForCrop.find(m => m.marketName === selectedMarketName);
      if (found) return found;
    }

    // Prefer matching farmer's district
    const districtMatch = filteredMarketsForCrop.find(m => 
      m.district.toLowerCase() === location.district.toLowerCase()
    );
    if (districtMatch) return districtMatch;

    return filteredMarketsForCrop[0];
  }, [filteredMarketsForCrop, selectedMarketName, location.district]);

  // Sorted nearby/comparable markets
  const comparableMarkets = useMemo(() => {
    if (!activeMarket) return [];
    
    // Combine all market records for this commodity
    const allForCommodity: {
      marketName: string;
      district: string;
      modalPrice: number;
      minPrice: number;
      maxPrice: number;
      date: string;
      variety?: string;
      source?: string;
      isCurrentActive?: boolean;
    }[] = [];

    allForCommodity.push({
      marketName: activeMarket.marketName,
      district: activeMarket.district,
      modalPrice: activeMarket.modalPrice,
      minPrice: activeMarket.minPrice,
      maxPrice: activeMarket.maxPrice,
      date: activeMarket.date,
      variety: activeMarket.variety,
      source: activeMarket.source,
      isCurrentActive: true,
    });

    if (activeMarket.nearbyMarkets) {
      activeMarket.nearbyMarkets.forEach(nm => {
        if (!allForCommodity.some(item => item.marketName === nm.marketName)) {
          allForCommodity.push({
            marketName: nm.marketName,
            district: nm.district,
            modalPrice: nm.modalPrice,
            minPrice: nm.minPrice || nm.modalPrice,
            maxPrice: nm.maxPrice || nm.modalPrice,
            date: nm.date,
            variety: nm.variety,
            source: nm.source,
            isCurrentActive: false,
          });
        }
      });
    }

    // Also include other markets from markets list for same commodity
    markets.forEach(m => {
      if (m.commodity.toLowerCase() === activeMarket.commodity.toLowerCase() && 
          !allForCommodity.some(item => item.marketName === m.marketName)) {
        allForCommodity.push({
          marketName: m.marketName,
          district: m.district,
          modalPrice: m.modalPrice,
          minPrice: m.minPrice,
          maxPrice: m.maxPrice,
          date: m.date,
          variety: m.variety,
          source: m.source,
          isCurrentActive: false,
        });
      }
    });

    return allForCommodity.sort((a, b) => {
      if (sortBy === 'highest') return b.modalPrice - a.modalPrice;
      if (sortBy === 'lowest') return a.modalPrice - b.modalPrice;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [activeMarket, markets, sortBy]);

  // Official MSP Benchmark
  const mspBenchmark = useMemo(() => {
    return getMspBenchmarkForCommodity(selectedCrop);
  }, [selectedCrop]);

  // Gross Sale Calculator Calculation
  const estimatedGrossValue = useMemo(() => {
    if (!activeMarket) return 0;
    const qty = parseFloat(calcQuantity);
    if (isNaN(qty) || qty <= 0) return 0;

    const quintals = calcUnit === 'bags' ? qty * 0.5 : qty; // 1 standard bag = 50 kg = 0.5 quintal
    return Math.round(quintals * activeMarket.modalPrice);
  }, [calcQuantity, calcUnit, activeMarket]);

  // Action Badge Helper
  const getActionBadge = (rec: MarketPrice['actionRecommendation']) => {
    switch (rec) {
      case 'SELL':
        return {
          label: t.recommendationSell,
          bg: '#DCFCE7',
          color: '#166534',
          border: '1px solid #86EFAC',
        };
      case 'HOLD':
        return {
          label: t.recommendationHold,
          bg: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #FCD34D',
        };
      case 'WAIT':
      default:
        return {
          label: t.recommendationWait,
          bg: '#E0F2FE',
          color: '#075985',
          border: '1px solid #7DD3FC',
        };
    }
  };

  // Render Top Level View Switcher (APMC Mandi Prices vs Direct Buyers & Sell)
  const renderViewSwitcher = () => (
    <div style={{
      display: 'flex',
      gap: '8px',
      backgroundColor: 'var(--ag-color-surface-base)',
      padding: '6px',
      borderRadius: '12px',
      border: '1px solid var(--ag-border-default)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      <button
        type="button"
        onClick={() => setActiveMarketView('mandi')}
        style={{
          flex: 1,
          padding: '10px 16px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          fontWeight: 800,
          cursor: 'pointer',
          backgroundColor: activeMarketView === 'mandi' ? 'var(--ag-color-primary-light)' : 'transparent',
          color: activeMarketView === 'mandi' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.15s ease',
        }}
      >
        <Store size={16} />
        <span>{currentLang === 'te' ? '🏛️ APMC మండి ధరలు' : (currentLang === 'hi' ? '🏛️ मंडी भाव' : '🏛️ APMC Mandi Prices')}</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveMarketView('buyers')}
        style={{
          flex: 1,
          padding: '10px 16px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          fontWeight: 800,
          cursor: 'pointer',
          backgroundColor: activeMarketView === 'buyers' ? 'var(--ag-color-primary-light)' : 'transparent',
          color: activeMarketView === 'buyers' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.15s ease',
        }}
      >
        <Building2 size={16} />
        <span>{currentLang === 'te' ? '🤝 ఖరీదుదారులు & అమ్మకాలు' : (currentLang === 'hi' ? '🤝 खरीदार और बिक्री' : '🤝 Direct Buyers & Sell')}</span>
      </button>
    </div>
  );

  if (activeMarketView === 'buyers') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', ...style }}>
        {renderViewSwitcher()}
        <FarmerBuyersExperience
          currentLang={currentLang}
          location={location}
          farmerCrops={farmerCrops}
          farms={farms}
          farmerProfile={farmerProfile}
        />
      </div>
    );
  }

  // Skeleton Loading State
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', ...style }}>
        {renderViewSwitcher()}
        <div style={{
          backgroundColor: 'var(--ag-color-surface-base)',
          borderRadius: 'var(--ag-radius-card)',
          border: '1px solid var(--ag-border-default)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{ width: '160px', height: '20px', backgroundColor: '#E2E8F0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '280px', height: '36px', backgroundColor: '#E2E8F0', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '100%', height: '140px', backgroundColor: '#F8FAF5', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>
    );
  }

  // Error State or Empty Data
  if (error || !activeMarket) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', ...style }}>
        {renderViewSwitcher()}
        {/* Header */}
        <div style={{
          backgroundColor: 'var(--ag-color-surface-base)',
          borderRadius: 'var(--ag-radius-card)',
          border: '1px solid var(--ag-border-default)',
          padding: '20px 24px',
          boxShadow: 'var(--ag-shadow-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ag-color-primary-dark)',
                backgroundColor: 'var(--ag-color-primary-light)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {t.marketReferenceLabel}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>
                {localizeLocation(location.district, location.state, currentLang)}
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--ag-color-text-primary)', margin: 0 }}>
              {t.mandiPageTitle}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '2px 0 0 0' }}>
              {t.mandiPageSubtitle}
            </p>
          </div>
        </div>

        {/* Crop Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {displayCrops.map((crop) => {
            const isSelected = selectedCrop.toLowerCase() === crop.toLowerCase();
            return (
              <button
                key={crop}
                onClick={() => {
                  setSelectedCrop(crop);
                  setSelectedMarketName(null);
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--ag-radius-full)',
                  border: isSelected ? '2px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                  backgroundColor: isSelected ? 'var(--ag-color-primary-light)' : 'var(--ag-color-surface-base)',
                  color: isSelected ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)',
                  fontSize: '14px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                {localizeCropName(crop, currentLang)}
              </button>
            );
          })}
        </div>

        {/* Empty State Card */}
        <div style={{
          backgroundColor: 'var(--ag-color-surface-base)',
          borderRadius: 'var(--ag-radius-card)',
          border: '1px solid var(--ag-border-default)',
          padding: '40px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertCircle size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
            {error 
              ? (currentLang === 'te' ? 'మార్కెట్ ధరలు ప్రస్తుతం అందుబాటులో లేవు' : currentLang === 'hi' ? 'बाजार भाव वर्तमान में उपलब्ध नहीं हैं' : "Market prices couldn't be retrieved right now.")
              : (currentLang === 'te' 
                  ? `ఎంచుకున్న ప్రాంతానికి ${localizeCropName(selectedCrop, currentLang)} మార్కెట్ ధర వివరాలు లేవు`
                  : currentLang === 'hi'
                    ? `चयनित क्षेत्र के लिए ${localizeCropName(selectedCrop, currentLang)} का कोई बाजार भाव नहीं मिला`
                    : `No verified ${localizeCropName(selectedCrop, currentLang)} market-price observation was found for the selected area.`)}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
            {error 
              ? (currentLang === 'te' ? 'దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.' : currentLang === 'hi' ? 'कृपया कुछ समय बाद पुनः प्रयास करें।' : 'Please check your connection or try again.')
              : (currentLang === 'te'
                  ? 'ఈ పంట మరియు ప్రాంతానికి ప్రస్తుతం అధికారిక మార్కెట్ నివేదిక నమోదు కాలేదు.'
                  : currentLang === 'hi'
                    ? 'इस फसल और स्थान के लिए वर्तमान में कोई आधिकारिक मंडी डेटा दर्ज नहीं है।'
                    : 'Market data may not currently be reported for this commodity and location.')}
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                marginTop: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: 'var(--ag-radius-md)',
                backgroundColor: 'var(--ag-color-primary-base)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              <RotateCcw size={15} />
              <span>Retry Fetching Rates</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const actionBadge = getActionBadge(activeMarket.actionRecommendation);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', ...style }}>
      
      {/* Top View Switcher */}
      {renderViewSwitcher()}

      {/* 1. Header & Crop Context Summary */}
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: 'var(--ag-radius-card)',
        border: '1px solid var(--ag-border-default)',
        padding: '22px 24px',
        boxShadow: 'var(--ag-shadow-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ag-color-primary-dark)',
              backgroundColor: 'var(--ag-color-primary-light)',
              padding: '3px 9px',
              borderRadius: '4px',
            }}>
              {t.marketReferenceLabel}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} />
              {localizeLocation(location.district, location.state, currentLang)}
            </span>
          </div>
          
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ag-color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {t.mandiPageTitle}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '4px 0 0 0' }}>
            {t.mandiPageSubtitle}
          </p>

          {/* Active Farmer Plot Context Tag */}
          {activeCropFarmDetail && (
            <div style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#166534',
              fontWeight: 700,
            }}>
              <BadgeCheck size={14} color="#16A34A" />
              <span>
                {activeCropFarmDetail.name}
                {activeCropFarmDetail.variety ? ` · ${activeCropFarmDetail.variety}` : ''}
                {activeCropFarmDetail.acres ? ` · ${activeCropFarmDetail.acres} acres` : ''}
                {farmerProfile?.district ? ` · ${farmerProfile.district}` : ` · ${location.district}`}
              </span>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 220px', maxWidth: '340px' }}>
          <Search size={16} color="var(--ag-color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t.searchCropPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 12px 11px 38px',
              borderRadius: 'var(--ag-radius-md)',
              border: '1px solid var(--ag-border-default)',
              fontSize: '13px',
              backgroundColor: '#FFFFFF',
              color: 'var(--ag-color-text-primary)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* 2. Crop Selection Pills (Auto-selected from Farmer's Active Crops) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
      }}>
        {displayCrops.map((crop) => {
          const isSelected = selectedCrop.toLowerCase() === crop.toLowerCase();
          const isOwned = farmerCropNames.some(fc => fc.toLowerCase() === crop.toLowerCase());

          return (
            <button
              key={crop}
              onClick={() => {
                setSelectedCrop(crop);
                setSelectedMarketName(null);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--ag-radius-full)',
                border: isSelected ? '2px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                backgroundColor: isSelected ? 'var(--ag-color-primary-light)' : 'var(--ag-color-surface-base)',
                color: isSelected ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)',
                fontSize: '14px',
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: '44px',
              }}
            >
              <span>{localizeCropName(crop, currentLang)}</span>
              {isOwned && (
                <span style={{
                  fontSize: '10px',
                  backgroundColor: isSelected ? 'var(--ag-color-primary-base)' : '#E2E8F0',
                  color: isSelected ? '#FFFFFF' : 'var(--ag-color-text-secondary)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 800,
                }}>
                  {t.forYourCrop}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. HERO MAIN PRICE CARD (Latest Available Market Price) */}
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: 'var(--ag-radius-lg)',
        border: '2px solid #D1E7DD',
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(46, 125, 50, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Top Info of Hero Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {localizeCropName(activeMarket.commodity, currentLang)}
              </span>
              {activeMarket.variety && (
                <span style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', fontWeight: 600 }}>
                  ({activeMarket.variety})
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ag-color-text-primary)', margin: '6px 0 2px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={24} color="var(--ag-color-primary-base)" />
              <span>{activeMarket.marketName}</span>
            </h2>

            <span style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} />
              {activeMarket.district}, {activeMarket.state}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: 'var(--ag-radius-sm)',
              backgroundColor: actionBadge.bg,
              color: actionBadge.color,
              border: actionBadge.border,
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.03em',
            }}>
              {actionBadge.label}
            </span>
            <div style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
              <Calendar size={12} />
              <span>{activeMarket.freshness || `Observation: ${activeMarket.date}`}</span>
            </div>
          </div>
        </div>

        {/* Hero Modal Price Display Box */}
        <div style={{
          backgroundColor: '#F8FAF5',
          borderRadius: 'var(--ag-radius-md)',
          border: '1px solid #E2E8F0',
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t.modalPrice}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '40px', fontWeight: 900, color: 'var(--ag-color-primary-dark)', letterSpacing: '-0.03em' }}>
                ₹{activeMarket.modalPrice.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ag-color-text-secondary)' }}>
                / {t.perQuintal}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', marginTop: '4px' }}>
              {t.mandiPriceRange} <strong>₹{activeMarket.minPrice.toLocaleString('en-IN')}</strong> — <strong>₹{activeMarket.maxPrice.toLocaleString('en-IN')}</strong> / {activeMarket.unit}
            </div>
          </div>

          {/* Trend & Previous Day Delta */}
          <div style={{ textAlign: 'right' }}>
            {activeMarket.previousDayModal ? (
              <>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: (activeMarket.changeAmount || 0) > 0 ? '#15803D' : (activeMarket.changeAmount || 0) < 0 ? '#B91C1C' : '#475569',
                  fontWeight: 800,
                  fontSize: '17px',
                }}>
                  {(activeMarket.changeAmount || 0) > 0 && <TrendingUp size={22} />}
                  {(activeMarket.changeAmount || 0) < 0 && <TrendingDown size={22} />}
                  {(activeMarket.changeAmount || 0) === 0 && <Minus size={22} />}
                  <span>
                    {(activeMarket.changeAmount || 0) > 0 ? '+' : ''}
                    ₹{Math.abs(activeMarket.changeAmount || 0)}
                    {activeMarket.changePct !== undefined ? ` (${activeMarket.changePct > 0 ? '+' : ''}${activeMarket.changePct}%)` : ''}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', marginTop: '4px', maxWidth: '240px' }}>
                  {(activeMarket.changeAmount || 0) > 0 ? t.priceHigher : (activeMarket.changeAmount || 0) < 0 ? t.priceLower : t.priceUnchanged}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', maxWidth: '220px', lineHeight: 1.4 }}>
                {t.prevComparisonUnavailable}
              </div>
            )}
          </div>
        </div>

        {/* Explanatory Note on Modal Price */}
        <div style={{
          fontSize: '12px',
          color: 'var(--ag-color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 4px',
        }}>
          <Info size={14} color="var(--ag-color-primary-base)" />
          <span>{t.modalPriceNote}</span>
        </div>

        {/* 4. Price Context Comparison (Today vs Previous Reference) */}
        {activeMarket.previousDayModal && (
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              {t.priceContext}
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              backgroundColor: '#F8FAF5',
              borderRadius: 'var(--ag-radius-md)',
              padding: '14px',
              textAlign: 'center',
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', display: 'block', fontWeight: 700 }}>
                  {t.todayPrice} ({activeMarket.date})
                </span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                  ₹{activeMarket.modalPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', display: 'block', fontWeight: 700 }}>
                  {t.yesterdayPrice}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ag-color-text-secondary)' }}>
                  ₹{activeMarket.previousDayModal.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', display: 'block', fontWeight: 700 }}>
                  {t.priceChange}
                </span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: (activeMarket.changeAmount || 0) >= 0 ? '#15803D' : '#B91C1C',
                }}>
                  {(activeMarket.changeAmount || 0) > 0 ? '+' : ''}₹{activeMarket.changeAmount || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 5. "WHAT DOES THIS MEAN?" & DECISION CHECKLIST */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--ag-radius-md)',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ag-color-primary-dark)', fontWeight: 800, fontSize: '14px' }}>
            <Info size={16} />
            <span>{t.whatDoesThisMean}</span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--ag-color-text-primary)', lineHeight: 1.5 }}>
            {activeMarket.actionReason || `The current modal reference at ${activeMarket.marketName} is ₹${activeMarket.modalPrice.toLocaleString('en-IN')}/quintal. Evaluate your harvest timing, transportation costs, and moisture levels before transporting.`}
          </p>

          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              {t.sellingChecklistTitle}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '13px', color: 'var(--ag-color-text-primary)' }}>
                <CheckCircle2 size={16} color="var(--ag-color-primary-base)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.sellingChecklist1}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '13px', color: 'var(--ag-color-text-primary)' }}>
                <CheckCircle2 size={16} color="var(--ag-color-primary-base)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.sellingChecklist2}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '13px', color: 'var(--ag-color-text-primary)' }}>
                <CheckCircle2 size={16} color="var(--ag-color-primary-base)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.sellingChecklist3}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '13px', color: 'var(--ag-color-text-primary)' }}>
                <CheckCircle2 size={16} color="var(--ag-color-primary-base)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.sellingChecklist4}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. ESTIMATE GROSS SALE VALUE (Farmer Tool) */}
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: 'var(--ag-radius-card)',
        border: '1px solid var(--ag-border-default)',
        padding: '20px 24px',
        boxShadow: 'var(--ag-shadow-card)',
      }}>
        <div 
          onClick={() => setShowCalculator(!showCalculator)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'var(--ag-color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ag-color-primary-dark)',
            }}>
              <Calculator size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                {t.estimateSaleValue}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>
                Based on {activeMarket.marketName} rate (₹{activeMarket.modalPrice.toLocaleString('en-IN')}/qtl)
              </span>
            </div>
          </div>

          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-primary-dark)' }}>
            {showCalculator ? 'Hide' : 'Open Calculator'}
          </span>
        </div>

        {showCalculator && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--ag-border-default)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', marginBottom: '4px' }}>
                  {t.expectedQuantity}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={calcQuantity}
                    onChange={(e) => setCalcQuantity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--ag-radius-md)',
                      border: '1px solid var(--ag-border-default)',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  />
                  <select
                    value={calcUnit}
                    onChange={(e) => setCalcUnit(e.target.value as any)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--ag-radius-md)',
                      border: '1px solid var(--ag-border-default)',
                      fontSize: '13px',
                      fontWeight: 700,
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="quintals">Quintals</option>
                    <option value="bags">Bags (50kg)</option>
                  </select>
                </div>
              </div>

              {/* Calculated Result Box */}
              <div style={{
                flex: '1 1 240px',
                backgroundColor: 'var(--ag-color-primary-light)',
                borderRadius: 'var(--ag-radius-md)',
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-primary-dark)', textTransform: 'uppercase' }}>
                    {t.estimatedGrossValue}
                  </span>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ag-color-primary-dark)' }}>
                    ₹{estimatedGrossValue.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ag-color-primary-dark)', textAlign: 'right', fontWeight: 600 }}>
                  {calcQuantity} {calcUnit} @ ₹{activeMarket.modalPrice}/qtl
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', margin: '12px 0 0 0', lineHeight: 1.4 }}>
              {t.calcDisclaimer}
            </p>
          </div>
        )}
      </div>

      {/* 7. PRICE HISTORY TREND (Chronological observations from DB) */}
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: 'var(--ag-radius-card)',
        border: '1px solid var(--ag-border-default)',
        padding: '22px 24px',
        boxShadow: 'var(--ag-shadow-card)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
              {t.priceHistoryTitle}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>
              {activeMarket.marketName} ({activeMarket.commodity})
            </span>
          </div>

          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-primary-dark)', backgroundColor: 'var(--ag-color-primary-light)', padding: '2px 8px', borderRadius: '4px' }}>
            Official APMC Observations
          </span>
        </div>

        {activeMarket.priceHistory && activeMarket.priceHistory.length > 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* SVG Trend Line */}
            <div style={{
              backgroundColor: '#F8FAF5',
              borderRadius: 'var(--ag-radius-md)',
              border: '1px solid var(--ag-border-default)',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--ag-color-text-secondary)', fontWeight: 600 }}>
                <span>Observed Price Progression (₹/quintal)</span>
                <span>{activeMarket.priceHistory.length} Recorded Dates</span>
              </div>

              {/* Responsive SVG Chart */}
              <svg viewBox="0 0 500 120" style={{ width: '100%', height: '120px', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="mandiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2F7D32" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2F7D32" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {(() => {
                  const pts = activeMarket.priceHistory;
                  const prices = pts.map(p => p.modalPrice);
                  const minP = Math.min(...prices) * 0.98;
                  const maxP = Math.max(...prices) * 1.02;
                  const range = maxP - minP || 1;

                  const coords = pts.map((p, idx) => {
                    const x = 40 + (idx * (420 / (pts.length - 1 || 1)));
                    const y = 95 - ((p.modalPrice - minP) / range) * 70;
                    return { x, y, ...p };
                  });

                  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
                  const areaPath = `${linePath} L ${coords[coords.length - 1].x} 105 L ${coords[0].x} 105 Z`;

                  return (
                    <g>
                      {/* Area Fill */}
                      <path d={areaPath} fill="url(#mandiGrad)" />
                      {/* Trend Line */}
                      <path d={linePath} fill="none" stroke="#2F7D32" strokeWidth="3" strokeLinecap="round" />
                      
                      {/* Data Points */}
                      {coords.map((c, idx) => (
                        <g key={idx}>
                          <circle cx={c.x} cy={c.y} r="5" fill="#FFFFFF" stroke="#2F7D32" strokeWidth="3" />
                          <text x={c.x} y={c.y - 10} fontSize="11" fontWeight="800" fill="#19352A" textAnchor="middle">
                            ₹{c.modalPrice}
                          </text>
                          <text x={c.x} y="115" fontSize="10" fontWeight="600" fill="#64748B" textAnchor="middle">
                            {c.date.slice(5)}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Historical Observation Rows */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              {activeMarket.priceHistory.map((h, i) => (
                <div key={i} style={{
                  padding: '10px 14px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--ag-border-default)',
                  borderRadius: 'var(--ag-radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', display: 'block' }}>
                      {h.date}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                      ₹{h.modalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)' }}>
                    ₹{h.minPrice} – ₹{h.maxPrice}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '24px',
            backgroundColor: '#F8FAF5',
            borderRadius: 'var(--ag-radius-md)',
            textAlign: 'center',
            color: 'var(--ag-color-text-secondary)',
            fontSize: '13px',
          }}>
            <Calendar size={20} style={{ margin: '0 auto 6px auto', display: 'block', color: 'var(--ag-color-text-secondary)' }} />
            <span>{t.historyUnavailable}</span>
          </div>
        )}
      </div>

      {/* 8. COMPARE RELEVANT MARKETS (Regional APMC Comparison) */}
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: 'var(--ag-radius-card)',
        border: '1px solid var(--ag-border-default)',
        padding: '22px 24px',
        boxShadow: 'var(--ag-shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
              {t.nearbyMarketsTitle} ({localizeCropName(activeMarket.commodity, currentLang)})
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>
              {t.nearbyMarketsSubtitle}
            </span>
          </div>

          {/* Sort Controls */}
          {comparableMarkets.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', fontWeight: 600 }}>
                {t.sortBy}
              </span>
              <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '6px' }}>
                <button
                  onClick={() => setSortBy('highest')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: sortBy === 'highest' ? 800 : 600,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: sortBy === 'highest' ? '#FFFFFF' : 'transparent',
                    color: sortBy === 'highest' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                    boxShadow: sortBy === 'highest' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {t.highestPrice}
                </button>
                <button
                  onClick={() => setSortBy('lowest')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: sortBy === 'lowest' ? 800 : 600,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: sortBy === 'lowest' ? '#FFFFFF' : 'transparent',
                    color: sortBy === 'lowest' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                    boxShadow: sortBy === 'lowest' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {t.lowestPrice}
                </button>
                <button
                  onClick={() => setSortBy('recent')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: sortBy === 'recent' ? 800 : 600,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: sortBy === 'recent' ? '#FFFFFF' : 'transparent',
                    color: sortBy === 'recent' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                    boxShadow: sortBy === 'recent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {t.mostRecent}
                </button>
              </div>
            </div>
          )}
        </div>

        {comparableMarkets.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {comparableMarkets.map((mkt, idx) => {
              const isSelected = activeMarket.marketName === mkt.marketName;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedMarketName(mkt.marketName)}
                  style={{
                    backgroundColor: isSelected ? 'var(--ag-color-primary-light)' : '#FFFFFF',
                    border: isSelected ? '2px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                    borderRadius: 'var(--ag-radius-md)',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--ag-color-primary-base)';
                      e.currentTarget.style.boxShadow = 'var(--ag-shadow-card)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--ag-border-default)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ag-color-text-primary)', display: 'block' }}>
                        {mkt.marketName}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <MapPin size={11} />
                        {mkt.district}
                      </span>
                    </div>

                    {isSelected && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: 'var(--ag-color-primary-base)',
                        color: '#FFFFFF',
                        padding: '2px 7px',
                        borderRadius: '10px',
                      }}>
                        {t.selectedMarket}
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderTop: '1px solid #E2E8F0',
                    paddingTop: '8px',
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)' }}>
                        Range: ₹{mkt.minPrice} – ₹{mkt.maxPrice}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--ag-color-text-secondary)', display: 'block' }}>
                        Date: {mkt.date}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: isSelected ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)' }}>
                        ₹{mkt.modalPrice.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '11px', display: 'block', color: 'var(--ag-color-text-secondary)' }}>/ quintal</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '16px',
            backgroundColor: '#F8FAF5',
            borderRadius: 'var(--ag-radius-md)',
            color: 'var(--ag-color-text-secondary)',
            fontSize: '13px',
            textAlign: 'center',
          }}>
            {t.noNearbyMarkets}
          </div>
        )}
      </div>

      {/* 9. MINIMUM SUPPORT PRICE (MSP) BENCHMARK REFERENCE */}
      {mspBenchmark && (
        <div style={{
          backgroundColor: '#F8FAF5',
          borderRadius: 'var(--ag-radius-card)',
          border: '1px solid #DDE5DE',
          padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#E8F5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ag-color-primary-dark)',
              }}>
                <Building2 size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                  {t.mspReferenceTitle} ({mspBenchmark.commodity})
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>
                  {mspBenchmark.season}
                </span>
              </div>
            </div>

            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: mspBenchmark.isCentralMspCovered ? '#E8F5E9' : '#FEF3C7',
              color: mspBenchmark.isCentralMspCovered ? '#166534' : '#92400E',
            }}>
              {mspBenchmark.isCentralMspCovered ? 'Statutory Floor Benchmark' : 'Open Market'}
            </span>
          </div>

          {mspBenchmark.isCentralMspCovered && mspBenchmark.rates.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              {mspBenchmark.rates.map((rate, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  border: '1px solid #DDE5DE',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
                    {rate.varietyOrGrade}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--ag-color-primary-dark)' }}>
                      ₹{rate.mspPrice.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--ag-color-text-secondary)', display: 'block' }}>
                      / {rate.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '6px 0' }}>
              {t.noMspDeclared}
            </p>
          )}

          <p style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
            {mspBenchmark.officialNote}
          </p>
          <div style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
            {t.sourcePrefix} {mspBenchmark.source}
          </div>
        </div>
      )}

      {/* 10. ABOUT THIS MARKET PRICE & DATA PROVENANCE */}
      <div style={{
        backgroundColor: '#F8FAF5',
        borderRadius: 'var(--ag-radius-card)',
        border: '1px solid var(--ag-border-default)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '12px',
        color: 'var(--ag-color-text-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
          <ShieldCheck size={18} color="var(--ag-color-primary-base)" />
          <span>{t.aboutThisPrice}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontWeight: 600 }}>
          <span><strong>{t.sourcePrefix}</strong> {activeMarket.source}</span>
          <span>•</span>
          <span><strong>{t.observationDate}:</strong> {activeMarket.date}</span>
          <span>•</span>
          <span><strong>Commodity / Variety:</strong> {activeMarket.commodity} ({activeMarket.variety})</span>
        </div>
        <p style={{ margin: '4px 0 0 0', lineHeight: 1.5 }}>
          {t.aboutPriceDisclaimer}
        </p>
      </div>

    </div>
  );
};
