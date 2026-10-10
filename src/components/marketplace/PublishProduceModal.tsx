import React, { useState } from 'react';
import type { Language, LocationContext } from '../../types';
import type { BuyerRequirementOpportunity } from '../../services/marketplace/farmerMarketplaceService';
import { FarmerMarketplaceService } from '../../services/marketplace/farmerMarketplaceService';
import { localizeCropName } from '../../i18n/agriLocalization';
import { 
  X, 
  Sprout, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Phone,
  Handshake,
  Lock
} from 'lucide-react';

interface PublishProduceModalProps {
  initialCrop?: string;
  initialVariety?: string;
  targetOpportunity?: BuyerRequirementOpportunity | null;
  farmerCrops?: { name: string; variety?: string; acres?: number; plotName?: string }[];
  location: LocationContext;
  currentLang: Language;
  onClose: () => void;
  onSuccess: (result: any, message?: string) => void;
}

export const PublishProduceModal: React.FC<PublishProduceModalProps> = ({
  initialCrop,
  initialVariety,
  targetOpportunity,
  farmerCrops = [],
  location,
  currentLang,
  onClose,
  onSuccess,
}) => {
  const isMatchMode = Boolean(targetOpportunity);

  // Available crop options for standalone publishing
  const availableCrops = farmerCrops.length > 0 
    ? Array.from(new Set(farmerCrops.map(c => c.name)))
    : ['Cotton', 'Paddy', 'Groundnut', 'Red Gram', 'Chilli', 'Maize'];

  const defaultCrop = targetOpportunity?.cropName || initialCrop || availableCrops[0] || 'Cotton';

  // Form States
  const [selectedCrop, setSelectedCrop] = useState<string>(defaultCrop);
  const [variety, setVariety] = useState<string>(targetOpportunity?.variety || initialVariety || '');
  
  // Quantity prefill: if responding to buyer, prefill with required quantity
  const [quantity, setQuantity] = useState<string>(
    targetOpportunity ? String(targetOpportunity.remainingQuantity || targetOpportunity.requiredQuantity || '') : ''
  );
  const [unit, setUnit] = useState<string>(targetOpportunity?.unit || 'quintal');

  // Price farmer is willing to charge: prefill with buyer target price if available
  const [askingPrice, setAskingPrice] = useState<string>(
    targetOpportunity?.maxPricePerUnit ? String(targetOpportunity.maxPricePerUnit) : ''
  );

  // Farmer direct contact details (prefilled from profile / storage)
  const [farmerPhone, setFarmerPhone] = useState<string>(() => {
    return localStorage.getItem('agriguide_user_phone') || '9367025781';
  });
  const [farmerName, setFarmerName] = useState<string>(() => {
    return localStorage.getItem('agriguide_user_name') || 'Nishith';
  });

  const [isOpenToOffers, setIsOpenToOffers] = useState<boolean>(true);
  const [availableFromDate, setAvailableFromDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [qualityGrade, setQualityGrade] = useState<string>('Grade A');
  const [qualityDetails, setQualityDetails] = useState<string>('');
  const [locationName, setLocationName] = useState<string>(location.village || location.district || 'Warangal');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMessage(currentLang === 'te' ? 'దయచేసి సరైన పరిమాణాన్ని నమోదు చేయండి.' : 'Please enter a valid quantity.');
      return;
    }

    if (isMatchMode) {
      const parsedPrice = parseFloat(askingPrice);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        setErrorMessage(currentLang === 'te' ? 'దయచేసి మీరు ఆశించే ధరను (₹) నమోదు చేయండి.' : 'Please enter the price you are willing to charge.');
        return;
      }

      if (!farmerPhone || farmerPhone.trim().length < 10) {
        setErrorMessage(currentLang === 'te' ? 'దయచేసి కొనుగోలుదారు సంప్రదించడానికి 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి.' : 'Please enter a valid 10-digit phone number for the buyer to contact you.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Remember phone & name for future
      if (farmerPhone) localStorage.setItem('agriguide_user_phone', farmerPhone.trim());
      if (farmerName) localStorage.setItem('agriguide_user_name', farmerName.trim());

      if (isMatchMode && targetOpportunity) {
        // Send direct Match Request to the buyer!
        const matchPayload = {
          buyingRequirementId: targetOpportunity.id,
          cropName: targetOpportunity.cropName.trim(),
          variety: variety.trim() || undefined,
          quantity: parsedQty,
          unit: unit,
          askingPricePerUnit: parseFloat(askingPrice),
          farmerPhone: farmerPhone.trim(),
          farmerName: farmerName.trim() || undefined,
          qualityGrade: qualityGrade,
          qualityNotes: qualityDetails.trim() || undefined,
          approxLocation: locationName.trim() || location.district,
          state: location.state || 'Telangana',
          district: location.district || 'Warangal',
          expectedDate: availableFromDate,
        };

        const result = await FarmerMarketplaceService.sendMatchRequest(matchPayload);

        if (result.success) {
          const successMsg = currentLang === 'te'
            ? `${targetOpportunity.buyer?.businessName || 'కొనుగోలుదారు'}కి మీ మ్యాచ్ రిక్వెస్ట్ విజయవంతంగా పంపబడింది! వారు మీ ఆఫర్ మరియు ఫోన్ నంబర్‌ను పరిశీలించి నేరుగా కాల్ చేస్తారు.`
            : `Match request sent to ${targetOpportunity.buyer?.businessName || 'Buyer'}! Your proposed price of ₹${askingPrice}/${unit} and phone number ${farmerPhone} have been transmitted. The buyer can call you directly to finalize the deal.`;

          onSuccess(result.offer || result, successMsg);
        } else {
          setErrorMessage(result.error || (currentLang === 'te' ? 'మ్యాచ్ అభ్యర్థన పంపడంలో లోపం సంభవించింది.' : 'Failed to send match request. Please try again.'));
        }
      } else {
        // Standalone produce publishing to selling_lots
        const publishPayload = {
          cropName: selectedCrop.trim(),
          variety: variety.trim() || undefined,
          totalQuantity: parsedQty,
          unit: unit,
          askingPricePerUnit: askingPrice && !isNaN(parseFloat(askingPrice)) ? parseFloat(askingPrice) : null,
          priceUnit: `INR/${unit}`,
          isOpenToOffers: isOpenToOffers,
          approxLocation: locationName.trim() || location.district,
          state: location.state || 'Telangana',
          district: location.district || 'Warangal',
          expectedAvailabilityDate: availableFromDate,
          qualityGrade: qualityGrade,
          qualityDetails: qualityDetails.trim() || undefined,
        };

        const result = await FarmerMarketplaceService.publishProduce(publishPayload);

        if (result.success && result.lot) {
          const successMsg = currentLang === 'te'
            ? 'మీ పంట మార్కెట్‌ప్లేస్‌లో విజయవంతంగా ప్రచురించబడింది.'
            : 'Your produce listing has been published to the buyer marketplace.';
          onSuccess(result.lot, successMsg);
        } else {
          setErrorMessage(result.error || (currentLang === 'te' ? 'ప్రచురించడంలో లోపం సంభవించింది.' : 'Failed to publish produce. Please try again.'));
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(25, 53, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--ag-radius-lg)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--ag-border-default)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--ag-border-default)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isMatchMode ? '#F0FDF4' : 'var(--ag-color-bg-base)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: isMatchMode ? '#DCFCE7' : 'var(--ag-color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isMatchMode ? '#15803D' : 'var(--ag-color-primary-base)',
            }}>
              {isMatchMode ? <Handshake size={20} /> : <Sprout size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                {isMatchMode 
                  ? (currentLang === 'te' ? 'కొనుగోలుదారుకు మ్యాచ్ రిక్వెస్ట్ పంపండి' : 'Send Match Request to Buyer')
                  : (currentLang === 'te' ? 'పంటను అమ్మకానికి ప్రచురించండి' : 'Publish Produce for Sale')}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', marginTop: '2px' }}>
                {isMatchMode
                  ? (currentLang === 'te' 
                      ? `${targetOpportunity?.buyer?.businessName || 'కొనుగోలుదారు'}తో నేరుగా కనెక్ట్ అవ్వండి` 
                      : `Connect directly with ${targetOpportunity?.buyer?.businessName || 'Buyer'}`)
                  : (currentLang === 'te' 
                      ? 'ధృవీకరించబడిన కొనుగోలుదారులకు అందుబాటులో ఉంచండి' 
                      : 'Make your produce visible to verified buyers')}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ag-color-text-secondary)',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            
            {/* If Responding to a Buyer Requirement: Display Locked Crop & Buyer Demand Summary */}
            {isMatchMode && targetOpportunity ? (
              <>
                {/* 1. Locked Crop Identification (NO RE-SELECTION) */}
                <div style={{
                  backgroundColor: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {currentLang === 'te' ? 'పంట (కొనుగోలుదారు కోరినది)' : 'Crop Name (Buyer Requested)'}
                    </span>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#14532D', marginTop: '2px' }}>
                      🌱 {localizeCropName(targetOpportunity.cropName, currentLang)}
                      {variety ? ` (${variety})` : ''}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Lock size={12} />
                    <span>{currentLang === 'te' ? 'ఎంచుకోబడింది' : 'Selected'}</span>
                  </div>
                </div>

                {/* 2. What the Buyer is Asking Summary Card */}
                <div style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📋</span>
                      <span>{currentLang === 'te' ? `${targetOpportunity.buyer?.businessName || 'కొనుగోలుదారు'} ఏమి కోరుతున్నారు:` : `What ${targetOpportunity.buyer?.businessName || 'Buyer'} is Asking:`}</span>
                    </span>
                    {targetOpportunity.buyer?.buyerType && (
                      <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '10px' }}>
                        {targetOpportunity.buyer.buyerType}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#6B7280', fontSize: '11px', display: 'block' }}>
                        {currentLang === 'te' ? 'అవసరమైన పరిమాణం:' : 'Required Quantity:'}
                      </span>
                      <span style={{ fontWeight: 800, color: '#111827' }}>
                        {targetOpportunity.requiredQuantity} {targetOpportunity.unit}
                      </span>
                    </div>

                    {targetOpportunity.maxPricePerUnit ? (
                      <div>
                        <span style={{ color: '#6B7280', fontSize: '11px', display: 'block' }}>
                          {currentLang === 'te' ? 'కొనుగోలుదారు బడ్జెట్/ధర:' : 'Buyer Target Price:'}
                        </span>
                        <span style={{ fontWeight: 800, color: '#047857' }}>
                          ₹{targetOpportunity.maxPricePerUnit.toLocaleString('en-IN')} / {targetOpportunity.priceUnit || targetOpportunity.unit}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span style={{ color: '#6B7280', fontSize: '11px', display: 'block' }}>
                          {currentLang === 'te' ? 'ధర విధానం:' : 'Price Terms:'}
                        </span>
                        <span style={{ fontWeight: 700, color: '#1D4ED8' }}>
                          {currentLang === 'te' ? 'చర్చలకు సిద్ధం' : 'Open to offers'}
                        </span>
                      </div>
                    )}

                    {targetOpportunity.deliveryLocation && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: '#6B7280', fontSize: '11px', display: 'block' }}>
                          {currentLang === 'te' ? 'డెలివరీ ప్రాంతం:' : 'Delivery Area:'}
                        </span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>
                          {targetOpportunity.deliveryLocation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Standalone Mode: Allow Selecting Crop */
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '6px' }}>
                  {currentLang === 'te' ? 'పంట పేరు *' : 'Crop Name *'}
                </label>
                
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {availableCrops.map(crop => {
                    const isSelected = selectedCrop.toLowerCase() === crop.toLowerCase();
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => setSelectedCrop(crop)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--ag-radius-full)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 700 : 500,
                          backgroundColor: isSelected ? 'var(--ag-color-primary-light)' : 'var(--ag-color-bg-base)',
                          color: isSelected ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-secondary)',
                          border: isSelected ? '1px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                          cursor: 'pointer',
                        }}
                      >
                        {localizeCropName(crop, currentLang)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variety / Hybrid (Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '4px' }}>
                {currentLang === 'te' ? 'రకం / వెరైటీ (ఐచ్ఛికం)' : 'Variety (Optional)'}
              </label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder={currentLang === 'te' ? 'ఉదా. లాంగ్ స్టేపుల్, బీటీ హైబ్రిడ్...' : 'e.g. Bt Hybrid, Long Staple, Teja...'}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--ag-radius-sm)',
                  border: '1px solid var(--ag-border-default)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Selling Quantity (Explicit manual input, never acreage assumed) & Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '4px' }}>
                  {isMatchMode 
                    ? (currentLang === 'te' ? 'మీరు సరఫరా చేయగల పరిమాణం *' : 'Quantity You Can Supply *')
                    : (currentLang === 'te' ? 'అమ్మదలిచిన పరిమాణం *' : 'Quantity to Sell *')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 40"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--ag-radius-sm)',
                      border: '1.5px solid var(--ag-border-default)',
                      fontSize: '14px',
                      fontWeight: 700,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', marginTop: '2px', display: 'block' }}>
                  {currentLang === 'te' ? 'అమ్మకానికి సిద్ధంగా ఉన్న అసలు పరిమాణం నమోదు చేయండి' : 'Enter actual quantity available for sale'}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '4px' }}>
                  {currentLang === 'te' ? 'యూనిట్' : 'Unit'}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 'var(--ag-radius-sm)',
                    border: '1px solid var(--ag-border-default)',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="quintal">{currentLang === 'te' ? 'క్వింటాల్ (Quintal)' : 'Quintal'}</option>
                  <option value="kg">{currentLang === 'te' ? 'కిలోలు (kg)' : 'kg'}</option>
                  <option value="ton">{currentLang === 'te' ? 'టన్నులు (Ton)' : 'Ton'}</option>
                  <option value="bags">{currentLang === 'te' ? 'బస్తాలు (Bags)' : 'Bags'}</option>
                </select>
              </div>
            </div>

            {/* Price Farmer is Willing to Charge */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: isMatchMode ? '#15803D' : 'var(--ag-color-text-primary)', marginBottom: '4px' }}>
                {isMatchMode
                  ? (currentLang === 'te' ? `మీరు ఆశించే ధర (₹ ప్రతి ${unit}కి) *` : `Price You Are Willing to Charge (₹ per ${unit}) *`)
                  : (currentLang === 'te' ? 'ఆశించే ధర (₹/యూనిట్ - ఐచ్ఛికం)' : 'Asking Price (₹ per unit - Optional)')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#15803D', fontWeight: 800, fontSize: '15px' }}>
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  required={isMatchMode}
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder={targetOpportunity?.maxPricePerUnit ? String(targetOpportunity.maxPricePerUnit) : "e.g. 7600"}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 28px',
                    borderRadius: 'var(--ag-radius-sm)',
                    border: isMatchMode ? '1.5px solid #86EFAC' : '1px solid var(--ag-border-default)',
                    backgroundColor: isMatchMode ? '#F0FDF4' : '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#15803D',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', marginTop: '2px', display: 'block' }}>
                {isMatchMode 
                  ? (currentLang === 'te' 
                      ? 'ఈ డీల్ కోసం మీరు ఎంత ధర (క్వింటాల్/కేజీకి) ఛార్జ్ చేయాలనుకుంటున్నారో నమోదు చేయండి' 
                      : 'Enter the exact rate you want to charge for this quantity.')
                  : (currentLang === 'te' ? 'స్పష్టమైన ధర లేకపోతే ఖాళీగా వదిలివేయవచ్చు' : 'Leave empty if open to negotiation')}
              </span>

              {!isMatchMode && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--ag-color-text-secondary)', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={isOpenToOffers}
                    onChange={(e) => setIsOpenToOffers(e.target.checked)}
                  />
                  <span>{currentLang === 'te' ? 'కొనుగోలుదారుల కౌంటర్ ఆఫర్లను అంగీకరించు' : 'Open to buyer negotiation / counter offers'}</span>
                </label>
              )}
            </div>

            {/* Farmer Phone Number & Direct Contact (Crucial for Matchup) */}
            <div style={{
              backgroundColor: '#FEFCE8',
              border: '1.5px solid #FDE047',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#854D0E' }}>
                <Phone size={15} color="#CA8A04" />
                <span>
                  {currentLang === 'te' ? 'రైతు సంప్రదింపు వివరాలు (కొనుగోలుదారు కాల్ చేయడానికి) *' : 'Farmer Contact Details (For Buyer to Call You) *'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#713F12', marginBottom: '3px' }}>
                    {currentLang === 'te' ? 'మీ మొబైల్ నంబర్ *' : 'Mobile Number *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      required
                      value={farmerPhone}
                      onChange={(e) => setFarmerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--ag-radius-sm)',
                        border: '1px solid #EAB308',
                        backgroundColor: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 700,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#713F12', marginBottom: '3px' }}>
                    {currentLang === 'te' ? 'మీ పేరు' : 'Farmer Name'}
                  </label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder="e.g. Nishith"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--ag-radius-sm)',
                      border: '1px solid #EAB308',
                      backgroundColor: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <span style={{ fontSize: '11px', color: '#854D0E', lineHeight: 1.35 }}>
                {currentLang === 'te'
                  ? 'కొనుగోలుదారు ఈ నంబర్‌ను వారి డాష్‌బోర్డ్‌లో అందుకుంటారు మరియు పంటను పరిశీలించడానికి లేదా డీల్ ఖరారు చేయడానికి నేరుగా కాల్ చేస్తారు.'
                  : 'The buyer receives your verified phone number in their portal to call you directly to inspect produce, verify logistics, and agree on terms.'}
              </span>
            </div>

            {/* Availability Date & Quality Grade */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '4px' }}>
                  {currentLang === 'te' ? 'అందుబాటు తేదీ' : 'Available From'}
                </label>
                <input
                  type="date"
                  value={availableFromDate}
                  onChange={(e) => setAvailableFromDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--ag-radius-sm)',
                    border: '1px solid var(--ag-border-default)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '4px' }}>
                  {currentLang === 'te' ? 'నాణ్యత గ్రేడ్' : 'Quality Grade'}
                </label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--ag-radius-sm)',
                    border: '1px solid var(--ag-border-default)',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Grade A">{currentLang === 'te' ? 'Grade A (ప్రీమియం)' : 'Grade A (Premium)'}</option>
                  <option value="Grade B">{currentLang === 'te' ? 'Grade B (మంచిది)' : 'Grade B (Good)'}</option>
                  <option value="FAQ">{currentLang === 'te' ? 'FAQ (సాధారణ నాణ్యత)' : 'FAQ (Fair Average Quality)'}</option>
                </select>
              </div>
            </div>

            {/* Quality Notes / Specifications (Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '4px' }}>
                {currentLang === 'te' ? 'నాణ్యత వివరాలు / స్పెసిఫికేషన్లు (ఐచ్ఛికం)' : 'Quality Notes / Specifications (Optional)'}
              </label>
              <input
                type="text"
                value={qualityDetails}
                onChange={(e) => setQualityDetails(e.target.value)}
                placeholder={currentLang === 'te' ? 'ఉదా. తేమ < 8%, శుభ్రమైనది...' : 'e.g. Moisture < 8%, Clean, Large pods...'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--ag-radius-sm)',
                  border: '1px solid var(--ag-border-default)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Produce Location */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '4px' }}>
                {currentLang === 'te' ? 'పంట ఉన్న ప్రదేశం' : 'Produce Location'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--ag-color-text-secondary)' }}>
                  <MapPin size={15} />
                </span>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 30px',
                    borderRadius: 'var(--ag-radius-sm)',
                    border: '1px solid var(--ag-border-default)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#991B1B',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Form Footer Actions */}
          <div style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--ag-border-default)',
            backgroundColor: 'var(--ag-color-bg-base)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--ag-radius-sm)',
                border: '1px solid var(--ag-border-default)',
                backgroundColor: '#FFFFFF',
                color: 'var(--ag-color-text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {currentLang === 'te' ? 'రద్దు చేయి' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '11px 22px',
                borderRadius: 'var(--ag-radius-sm)',
                border: 'none',
                backgroundColor: isMatchMode ? '#16A34A' : 'var(--ag-color-primary-base)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
                opacity: isSubmitting ? 0.8 : 1,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{currentLang === 'te' ? 'పంపుతున్నాము...' : 'Transmitting...'}</span>
                </>
              ) : isMatchMode ? (
                <>
                  <Handshake size={16} />
                  <span>{currentLang === 'te' ? '🤝 కొనుగోలుదారుకు మ్యాచ్ రిక్వెస్ట్ పంపండి' : '🤝 Send Match Request to Buyer'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{currentLang === 'te' ? 'పంటను ప్రచురించండి' : 'Publish Produce'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
