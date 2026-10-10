import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Language, LocationContext, CropHealth, Farm, FarmerProfile } from '../../types';
import type { BuyerRequirementOpportunity, FarmerPublishedLot, FarmerSentMatchRequest } from '../../services/marketplace/farmerMarketplaceService';
import { FarmerMarketplaceService } from '../../services/marketplace/farmerMarketplaceService';
import { BuyerRequirementDetailModal } from './BuyerRequirementDetailModal';
import { PublishProduceModal } from './PublishProduceModal';
import { localizeCropName } from '../../i18n/agriLocalization';
import { 
  MapPin, 
  Calendar, 
  BadgeCheck, 
  Store, 
  Sprout, 
  ArrowUpRight, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  PackageCheck,
  Tag,
  Handshake,
  Phone
} from 'lucide-react';

interface FarmerBuyersExperienceProps {
  currentLang: Language;
  location: LocationContext;
  farmerCrops?: CropHealth[];
  farms?: Farm[];
  farmerProfile?: FarmerProfile | null;
  onNavigateMyFarm?: () => void;
  style?: React.CSSProperties;
}

export const FarmerBuyersExperience: React.FC<FarmerBuyersExperienceProps> = ({
  currentLang,
  location,
  farmerCrops = [],
  farms = [],
  style,
}) => {
  // Data states
  const [opportunities, setOpportunities] = useState<BuyerRequirementOpportunity[]>([]);
  const [mySellingLots, setMySellingLots] = useState<FarmerPublishedLot[]>([]);
  const [myMatchRequests, setMyMatchRequests] = useState<FarmerSentMatchRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('ALL_MY_CROPS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedOpportunity, setSelectedOpportunity] = useState<BuyerRequirementOpportunity | null>(null);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [publishingForOpportunity, setPublishingForOpportunity] = useState<BuyerRequirementOpportunity | null>(null);
  const [prefilledCropForPublish, setPrefilledCropForPublish] = useState<string | undefined>(undefined);

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Extract farmer's actual crops from My Farm
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

  // Load Opportunities, Farmer's Selling Lots, and Farmer's Sent Match Requests
  const loadMarketplaceData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [oppsData, lotsData, matchReqsData] = await Promise.all([
        FarmerMarketplaceService.getBuyerOpportunities(),
        FarmerMarketplaceService.getMySellingLots(),
        FarmerMarketplaceService.getMyMatchRequests()
      ]);

      setOpportunities(oppsData);
      setMySellingLots(lotsData);
      setMyMatchRequests(matchReqsData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load marketplace data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMarketplaceData();
  }, [loadMarketplaceData]);

  // Helper to check if crop name matches
  const isCropMatch = (cropA: string, cropB: string) => {
    if (!cropA || !cropB) return false;
    const a = cropA.toLowerCase().trim();
    const b = cropB.toLowerCase().trim();
    if (a === b) return true;
    if (a.includes('red gram') && b.includes('red gram')) return true;
    if (a.includes('groundnut') && b.includes('groundnut')) return true;
    if (a.includes('paddy') && b.includes('paddy')) return true;
    if (a.includes('cotton') && b.includes('cotton')) return true;
    if (a.includes('chilli') && b.includes('chilli')) return true;
    if (a.includes('maize') && b.includes('maize')) return true;
    return a.includes(b) || b.includes(a);
  };

  // Filter & prioritize buyer opportunities
  const filteredOpportunities = useMemo(() => {
    let list = [...opportunities];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(opp => 
        opp.cropName.toLowerCase().includes(q) ||
        (opp.variety && opp.variety.toLowerCase().includes(q)) ||
        (opp.buyer?.businessName && opp.buyer.businessName.toLowerCase().includes(q)) ||
        (opp.deliveryDistrict && opp.deliveryDistrict.toLowerCase().includes(q)) ||
        (opp.deliveryState && opp.deliveryState.toLowerCase().includes(q))
      );
    }

    // Crop Pill Filter
    if (selectedCropFilter === 'ALL_MY_CROPS' && farmerCropNames.length > 0) {
      // Prioritize farmer's crops first, then others
      list.sort((a, b) => {
        const aMatches = farmerCropNames.some(c => isCropMatch(c, a.cropName));
        const bMatches = farmerCropNames.some(c => isCropMatch(c, b.cropName));
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    } else if (selectedCropFilter !== 'ALL' && selectedCropFilter !== 'ALL_MY_CROPS') {
      list = list.filter(opp => isCropMatch(opp.cropName, selectedCropFilter));
    }

    return list;
  }, [opportunities, searchQuery, selectedCropFilter, farmerCropNames]);

  // Handle successful produce publishing / match request
  const handlePublishSuccess = (result: any, message?: string) => {
    setShowPublishModal(false);
    setPublishingForOpportunity(null);
    setPrefilledCropForPublish(undefined);

    // Refresh data
    loadMarketplaceData(true);

    // Show Toast
    if (message) {
      setToastMessage(message);
    } else if (result?.crop_name) {
      setToastMessage(
        currentLang === 'te' 
          ? `${localizeCropName(result.crop_name, currentLang)} (${result.available_quantity} ${result.unit}) విజయవంతంగా మార్కెట్‌ప్లేస్‌లో ప్రచురించబడింది!` 
          : `${result.crop_name} (${result.available_quantity} ${result.unit}) successfully published to buyer marketplace!`
      );
    } else {
      setToastMessage(currentLang === 'te' ? 'విజయవంతంగా పూర్తయింది!' : 'Request sent successfully!');
    }

    setTimeout(() => setToastMessage(null), 6000);
  };

  // Handle deactivate lot
  const handleDeactivateLot = async (lotId: string) => {
    const ok = window.confirm(
      currentLang === 'te' 
        ? 'ఈ అమ్మకపు లిస్టింగ్‌ను రద్దు చేయాలనుకుంటున్నారా?' 
        : 'Are you sure you want to cancel this selling listing?'
    );
    if (!ok) return;

    const success = await FarmerMarketplaceService.updateLotStatus(lotId, 'CANCELLED');
    if (success) {
      setMySellingLots(prev => prev.map(lot => lot.id === lotId ? { ...lot, status: 'CANCELLED' } : lot));
      setToastMessage(
        currentLang === 'te' ? 'లిస్టింగ్ రద్దు చేయబడింది.' : 'Listing status updated to Cancelled.'
      );
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', ...style }}>
      
      {/* Toast notification banner */}
      {toastMessage && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #6EE7B7',
          borderRadius: '12px',
          padding: '12px 16px',
          color: '#065F46',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
          animation: 'fadeInScale 0.2s ease',
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER HERO: DISCOVER BUYERS & FARM CROP SUMMARY                       */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: 'var(--ag-radius-card)',
        border: '1px solid var(--ag-border-default)',
        padding: '24px',
        boxShadow: 'var(--ag-shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--ag-color-primary-base)',
                backgroundColor: 'var(--ag-color-primary-light)',
                padding: '2px 8px',
                borderRadius: 'var(--ag-radius-full)',
              }}>
                {currentLang === 'te' ? 'రైతు ↔ కొనుగోలుదారుల మార్కెట్‌ప్లేస్' : (currentLang === 'hi' ? 'किसान ↔ खरीदार बाज़ार' : 'Farmer ↔ Buyer Marketplace')}
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
              {currentLang === 'te' ? 'ఖరీదుదారులు & అమ్మకాలు' : (currentLang === 'hi' ? 'खरीदार और बिक्री' : 'Sell & Buyers')}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '4px 0 0 0' }}>
              {currentLang === 'te' 
                ? 'మీరు పండించే పంటలను కొనుగోలు చేయడానికి సిద్ధంగా ఉన్న ధృవీకరించబడిన ఖరీదుదారులను కనుగొనండి.' 
                : 'Find verified buyers looking to purchase crops you actually grow.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => loadMarketplaceData(true)}
              disabled={refreshing || loading}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--ag-radius-sm)',
                border: '1px solid var(--ag-border-default)',
                backgroundColor: '#FFFFFF',
                color: 'var(--ag-color-primary-base)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? '...' : (currentLang === 'te' ? 'తాజాకరించండి' : 'Refresh')}</span>
            </button>

            <button
              onClick={() => {
                setPublishingForOpportunity(null);
                setPrefilledCropForPublish(farmerCropNames[0]);
                setShowPublishModal(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--ag-radius-sm)',
                border: 'none',
                backgroundColor: 'var(--ag-color-primary-base)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(47, 125, 50, 0.2)',
              }}
            >
              <Plus size={15} />
              <span>{currentLang === 'te' ? '+ పంటను ప్రచురించండి' : '+ Publish Produce'}</span>
            </button>
          </div>
        </div>

        {/* My Farm Crops Filter Pills Bar */}
        <div style={{
          borderTop: '1px solid var(--ag-border-default)',
          paddingTop: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-secondary)' }}>
              <Sprout size={15} color="var(--ag-color-primary-base)" />
              <span>{currentLang === 'te' ? 'నా పొలంలో పంటలు:' : 'My Farm Crops:'}</span>
            </div>

            {farmerCropNames.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)' }}>
                {farmerCropNames.map(c => localizeCropName(c, currentLang)).join(' · ')}
              </span>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
          }}>
            <button
              type="button"
              onClick={() => setSelectedCropFilter('ALL_MY_CROPS')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--ag-radius-full)',
                fontSize: '12px',
                fontWeight: selectedCropFilter === 'ALL_MY_CROPS' ? 700 : 500,
                backgroundColor: selectedCropFilter === 'ALL_MY_CROPS' ? 'var(--ag-color-primary-light)' : '#FFFFFF',
                color: selectedCropFilter === 'ALL_MY_CROPS' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                border: selectedCropFilter === 'ALL_MY_CROPS' ? '1px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              🌾 {currentLang === 'te' ? 'నా పంటలకు సంబంధించినవి' : 'Relevant to My Crops'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedCropFilter('ALL')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--ag-radius-full)',
                fontSize: '12px',
                fontWeight: selectedCropFilter === 'ALL' ? 700 : 500,
                backgroundColor: selectedCropFilter === 'ALL' ? 'var(--ag-color-primary-light)' : '#FFFFFF',
                color: selectedCropFilter === 'ALL' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                border: selectedCropFilter === 'ALL' ? '1px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {currentLang === 'te' ? 'అన్ని కొనుగోలుదారులు' : 'All Buyers'}
            </button>

            {farmerCropNames.map(crop => {
              const isSelected = selectedCropFilter === crop;
              return (
                <button
                  key={crop}
                  type="button"
                  onClick={() => setSelectedCropFilter(crop)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--ag-radius-full)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? 'var(--ag-color-primary-light)' : '#FFFFFF',
                    color: isSelected ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                    border: isSelected ? '1px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {localizeCropName(crop, currentLang)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BUYER OPPORTUNITIES DISCOVERY SECTION                                  */}
      {/* ========================================================================= */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
              {currentLang === 'te' ? 'మీ పంటల కోసం వెతుకుతున్న ఖరీదుదారులు' : (currentLang === 'hi' ? 'आपकी फसलों की मांग कर रहे खरीदार' : 'Buyers Looking for Your Crops')}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>
              {filteredOpportunities.length} {currentLang === 'te' ? 'ధృవీకరించబడిన అవకాశాలు' : 'active buyer opportunities'}
            </span>
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--ag-color-text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLang === 'te' ? 'పంట లేదా జిల్లా వెతకండి...' : 'Filter crop or district...'}
              style={{
                width: '100%',
                padding: '8px 10px 8px 30px',
                borderRadius: 'var(--ag-radius-sm)',
                border: '1px solid var(--ag-border-default)',
                fontSize: '12px',
                boxSizing: 'border-box',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{
            backgroundColor: 'var(--ag-color-surface-base)',
            borderRadius: 'var(--ag-radius-card)',
            border: '1px solid var(--ag-border-default)',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--ag-color-text-secondary)',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '3px solid var(--ag-color-primary-light)',
              borderTopColor: 'var(--ag-color-primary-base)',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px auto',
            }} />
            <span>{currentLang === 'te' ? 'ఖరీదుదారుల సమాచారం తీసుకువస్తున్నాము...' : 'Loading buyer requirements from marketplace...'}</span>
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: '#FDF0F0',
            borderRadius: 'var(--ag-radius-card)',
            border: '1px solid #F7B5B3',
            padding: '16px 20px',
            color: 'var(--ag-color-danger-base)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          /* Honest Empty State (No Mock Buyers) */
          <div style={{
            backgroundColor: 'var(--ag-color-surface-base)',
            borderRadius: 'var(--ag-radius-card)',
            border: '1.5px dashed var(--ag-border-default)',
            padding: '36px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--ag-color-bg-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--ag-border-default)',
            }}>
              <Store size={22} color="var(--ag-color-text-secondary)" />
            </div>

            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
              {currentLang === 'te' 
                ? 'ప్రస్తుతానికి క్రియాశీల ఖరీదుదారుల డిమాండ్లు సరిపోలడం లేదు.' 
                : 'No active buyer requirements match this selection yet.'}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', maxWidth: '420px', margin: 0, lineHeight: 1.4 }}>
              {currentLang === 'te'
                ? 'ఖరీదుదారులు కొత్త కొనుగోలు డిమాండ్లను పోస్ట్ చేసినప్పుడు అవి ఇక్కడ కనిపిస్తాయి. మీరు మీ పంటను ముందుగానే ప్రచురించి ఉంచవచ్చు.'
                : 'When verified buyers post new purchase requirements, they will appear here. You can also publish your produce in advance to be discoverable.'}
            </p>

            <button
              onClick={() => {
                setPublishingForOpportunity(null);
                setPrefilledCropForPublish(farmerCropNames[0]);
                setShowPublishModal(true);
              }}
              style={{
                marginTop: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--ag-radius-sm)',
                border: '1px solid var(--ag-color-primary-base)',
                backgroundColor: 'var(--ag-color-primary-light)',
                color: 'var(--ag-color-primary-dark)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {currentLang === 'te' ? '+ అమ్మకానికి పంటను నమోదు చేయండి' : '+ Publish Produce for Sale'}
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            {filteredOpportunities.map((opp) => {
              const isFarmerCrop = farmerCropNames.some(c => isCropMatch(c, opp.cropName));

              return (
                <div
                  key={opp.id}
                  style={{
                    backgroundColor: 'var(--ag-color-surface-base)',
                    borderRadius: '14px',
                    border: isFarmerCrop ? '1.5px solid #86EFAC' : '1px solid var(--ag-border-default)',
                    padding: '18px',
                    boxShadow: isFarmerCrop ? '0 4px 12px rgba(47, 125, 50, 0.08)' : 'var(--ag-shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    {/* Top Tag & Buyer Name */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                          {opp.buyer?.businessName || (currentLang === 'te' ? 'నమోదిత ఖరీదుదారు' : 'Verified Buyer')}
                        </span>
                        {opp.buyer?.buyerType && (
                          <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)' }}>
                            {opp.buyer.buyerType}
                          </span>
                        )}
                      </div>

                      {isFarmerCrop && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 'var(--ag-radius-full)',
                          backgroundColor: '#DCFCE7',
                          color: '#166534',
                          border: '1px solid #86EFAC',
                          whiteSpace: 'nowrap',
                        }}>
                          {currentLang === 'te' ? 'మీ పంటకు సరిపోలుతుంది' : 'Relevant to your crop'}
                        </span>
                      )}
                    </div>

                    {/* Crop & Quantity */}
                    <div style={{
                      backgroundColor: 'var(--ag-color-bg-base)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ag-color-text-secondary)' }}>
                          {currentLang === 'te' ? 'అవసరమైన పంట' : 'Looking for'}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-primary-dark)' }}>
                          {localizeCropName(opp.cropName, currentLang)}
                          {opp.variety && <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ag-color-text-secondary)', marginLeft: '4px' }}>({opp.variety})</span>}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ag-color-text-secondary)' }}>
                          {currentLang === 'te' ? 'పరిమాణం' : 'Quantity'}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                          {opp.remainingQuantity || opp.requiredQuantity} {opp.unit}
                        </div>
                      </div>
                    </div>

                    {/* Specific Fields (Only if provided) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>
                      {(opp.deliveryDistrict || opp.deliveryState) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} color="var(--ag-color-primary-base)" style={{ flexShrink: 0 }} />
                          <span>
                            {[opp.deliveryLocation, opp.deliveryDistrict, opp.deliveryState].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}

                      {opp.maxPricePerUnit !== null && opp.maxPricePerUnit !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={13} color="#059669" style={{ flexShrink: 0 }} />
                          <span style={{ color: 'var(--ag-color-text-primary)', fontWeight: 600 }}>
                            {currentLang === 'te' ? 'బడ్జెట్:' : 'Target Price:'} ₹{opp.maxPricePerUnit.toLocaleString('en-IN')}/{opp.unit}
                          </span>
                        </div>
                      )}

                      {opp.qualityRequirements && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BadgeCheck size={13} color="#0284C7" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {opp.qualityRequirements}
                          </span>
                        </div>
                      )}

                      {opp.requiredByDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="var(--ag-color-text-secondary)" style={{ flexShrink: 0 }} />
                          <span>
                            {currentLang === 'te' ? 'అవసరమైన గడువు:' : 'Required by:'} {opp.requiredByDate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedOpportunity(opp)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--ag-radius-sm)',
                      border: '1px solid var(--ag-color-primary-base)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--ag-color-primary-dark)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--ag-color-primary-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    <span>{currentLang === 'te' ? 'ఖరీదుదారు వివరాలు చూడండి' : (currentLang === 'hi' ? 'मांग विवरण देखें' : 'View Buyer Requirement')}</span>
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2.5 MY SENT MATCH REQUESTS                                                */}
      {/* ========================================================================= */}
      {myMatchRequests.length > 0 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--ag-radius-card)',
          border: '1.5px solid #86EFAC',
          padding: '24px',
          boxShadow: 'var(--ag-shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Handshake size={20} color="#15803D" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#166534', margin: 0 }}>
                {currentLang === 'te' ? 'నా పంపిన మ్యాచ్ అభ్యర్థనలు' : 'My Sent Match Requests'}
              </h3>
              <span style={{
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 800,
              }}>
                {myMatchRequests.length}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', margin: '4px 0 0 0' }}>
              {currentLang === 'te'
                ? 'మీరు కొనుగోలుదారులకు పంపిన ధర ఆఫర్లు మరియు సంప్రదింపు వివరాలు. కొనుగోలుదారులు మిమ్మల్ని ఫోన్ ద్వారా సంప్రదిస్తారు.'
                : 'Direct purchase offers and phone contact shared with buyers. Buyers will call your number to connect.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myMatchRequests.map((req) => {
              const buyerName = req.buying_requirements?.buyer_profiles?.business_name || 'Verified Buyer';
              const crop = req.buying_requirements?.crop_name || req.selling_lots?.crop_name || 'Produce';
              const isPending = req.status === 'PENDING' || req.status === 'pending';

              return (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#14532D' }}>
                        🌱 {localizeCropName(crop, currentLang)}
                      </span>
                      <span style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>
                        → {buyerName}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        backgroundColor: isPending ? '#FEF3C7' : '#DCFCE7',
                        color: isPending ? '#92400E' : '#15803D',
                        border: `1px solid ${isPending ? '#FDE68A' : '#86EFAC'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {isPending 
                          ? (currentLang === 'te' ? '⏳ కొనుగోలుదారు కాల్ కోసం వేచి ఉంది' : '⏳ Awaiting Buyer Call') 
                          : req.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#166534', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span>
                        {currentLang === 'te' ? 'పరిమాణం:' : 'Offered:'} <strong>{req.proposed_quantity} {req.price_unit}</strong>
                      </span>
                      <span>
                        • {currentLang === 'te' ? 'కోరిన ధర:' : 'Rate:'} <strong>₹{req.proposed_price_per_unit.toLocaleString('en-IN')}/{req.price_unit}</strong>
                      </span>
                      {req.buying_requirements?.buyer_profiles?.district && (
                        <span>• {req.buying_requirements.buyer_profiles.district}</span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #BBF7D0',
                    fontSize: '11px',
                    color: '#15803D',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <Phone size={13} />
                    <span>{currentLang === 'te' ? 'ఫోన్ నంబర్ భాగస్వామ్యం చేయబడింది' : 'Phone Shared With Buyer'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MY PUBLISHED PRODUCE SECTION (Explicit Selling Lots)                    */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: 'var(--ag-radius-card)',
        border: '1px solid var(--ag-border-default)',
        padding: '24px',
        boxShadow: 'var(--ag-shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PackageCheck size={18} color="var(--ag-color-primary-base)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                {currentLang === 'te' ? 'నా ప్రచురిత అమ్మకపు పంటలు' : (currentLang === 'hi' ? 'मेरी प्रकाशित उपज' : 'My Published Produce')}
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', margin: '2px 0 0 0' }}>
              {currentLang === 'te'
                ? 'మీరు కొనుగోలుదారుల కోసం ప్రత్యేకంగా ప్రచురించిన అమ్మకపు నిల్వలు (My Farm పంటలు కావు).'
                : 'Produce you have explicitly offered for sale on the marketplace (separate from farm records).'}
            </p>
          </div>

          <button
            onClick={() => {
              setPublishingForOpportunity(null);
              setPrefilledCropForPublish(farmerCropNames[0]);
              setShowPublishModal(true);
            }}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--ag-radius-sm)',
              border: '1px solid var(--ag-border-default)',
              backgroundColor: '#FFFFFF',
              color: 'var(--ag-color-primary-base)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={14} />
            <span>{currentLang === 'te' ? 'కొత్త పంటను ప్రచురించండి' : 'Publish Produce'}</span>
          </button>
        </div>

        {mySellingLots.length === 0 ? (
          <div style={{
            padding: '24px 16px',
            borderRadius: '12px',
            backgroundColor: 'var(--ag-color-bg-base)',
            border: '1px dashed var(--ag-border-default)',
            textAlign: 'center',
            color: 'var(--ag-color-text-secondary)',
            fontSize: '13px',
          }}>
            <p style={{ margin: '0 0 8px 0' }}>
              {currentLang === 'te' 
                ? 'మీరు ఇంకా అమ్మకపు పంటను ప్రచురించలేదు.' 
                : 'You have not published any produce for sale yet.'}
            </p>
            <button
              onClick={() => {
                setPublishingForOpportunity(null);
                setPrefilledCropForPublish(farmerCropNames[0]);
                setShowPublishModal(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ag-color-primary-base)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {currentLang === 'te' ? 'మొదటి పంటను ఇప్పుడే ప్రచురించండి →' : 'Publish your first listing now →'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mySellingLots.map((lot) => {
              const isActive = lot.status === 'ACTIVE' || lot.status === 'active';

              return (
                <div
                  key={lot.id}
                  style={{
                    backgroundColor: 'var(--ag-color-bg-base)',
                    borderRadius: '12px',
                    border: '1px solid var(--ag-border-default)',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? 'var(--ag-color-primary-light)' : '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}>
                      🌱
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                          {localizeCropName(lot.crop_name, currentLang)}
                        </span>
                        {lot.variety && (
                          <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', fontWeight: 600 }}>
                            ({lot.variety})
                          </span>
                        )}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--ag-radius-full)',
                          backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9',
                          color: isActive ? '#166534' : '#64748B',
                          border: `1px solid ${isActive ? '#86EFAC' : '#CBD5E1'}`,
                        }}>
                          {isActive ? (currentLang === 'te' ? 'క్రియాశీలకంగా ఉంది' : 'Active') : lot.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--ag-color-text-secondary)', flexWrap: 'wrap' }}>
                        <span>
                          <strong>{lot.available_quantity}</strong> {lot.unit}
                        </span>
                        {lot.asking_price_per_unit && (
                          <span>• <strong>₹{lot.asking_price_per_unit.toLocaleString('en-IN')}</strong>/{lot.unit}</span>
                        )}
                        {lot.approx_location && (
                          <span>• {lot.approx_location}</span>
                        )}
                        {lot.expected_availability_date && (
                          <span>• {currentLang === 'te' ? 'తేదీ:' : 'Available:'} {lot.expected_availability_date}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <button
                      type="button"
                      onClick={() => handleDeactivateLot(lot.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--ag-radius-sm)',
                        border: '1px solid #FCA5A5',
                        backgroundColor: '#FFFFFF',
                        color: '#DC2626',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {currentLang === 'te' ? 'రద్దు చేయి' : 'Cancel Listing'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS: DETAIL VIEW & PUBLISH PRODUCE                                   */}
      {/* ========================================================================= */}
      {selectedOpportunity && (
        <BuyerRequirementDetailModal
          opportunity={selectedOpportunity}
          farmerPublishedLots={mySellingLots}
          currentLang={currentLang}
          onClose={() => setSelectedOpportunity(null)}
          onOfferProduce={(opp) => {
            setPublishingForOpportunity(opp);
            setPrefilledCropForPublish(opp.cropName);
            setShowPublishModal(true);
          }}
          onViewMyLot={() => {
            // Focus on my lots section
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }}
        />
      )}

      {showPublishModal && (
        <PublishProduceModal
          initialCrop={prefilledCropForPublish}
          initialVariety={publishingForOpportunity?.variety || undefined}
          targetOpportunity={publishingForOpportunity}
          farmerCrops={farmerCropDetails}
          location={location}
          currentLang={currentLang}
          onClose={() => {
            setShowPublishModal(false);
            setPublishingForOpportunity(null);
            setPrefilledCropForPublish(undefined);
          }}
          onSuccess={handlePublishSuccess}
        />
      )}
    </div>
  );
};
