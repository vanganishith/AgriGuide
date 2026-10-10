import React from 'react';
import type { Language } from '../../types';
import type { BuyerRequirementOpportunity, FarmerPublishedLot } from '../../services/marketplace/farmerMarketplaceService';
import { localizeCropName } from '../../i18n/agriLocalization';
import { 
  X, 
  MapPin, 
  Calendar, 
  BadgeCheck, 
  Truck, 
  CreditCard, 
  CheckCircle2,
  Handshake
} from 'lucide-react';

interface BuyerRequirementDetailModalProps {
  opportunity: BuyerRequirementOpportunity | null;
  onClose: () => void;
  onOfferProduce: (opp: BuyerRequirementOpportunity) => void;
  farmerPublishedLots?: FarmerPublishedLot[];
  onViewMyLot?: (lot: FarmerPublishedLot) => void;
  currentLang: Language;
}

export const BuyerRequirementDetailModal: React.FC<BuyerRequirementDetailModalProps> = ({
  opportunity,
  onClose,
  onOfferProduce,
  farmerPublishedLots = [],
  onViewMyLot,
  currentLang,
}) => {
  if (!opportunity) return null;

  // Check if farmer already has an active selling lot for this exact crop
  const existingActiveLot = farmerPublishedLots.find(
    lot => lot.crop_name.toLowerCase().trim() === opportunity.cropName.toLowerCase().trim() && lot.status === 'ACTIVE'
  );

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(25, 53, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 110,
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
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--ag-border-default)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px 16px 24px',
          borderBottom: '1px solid var(--ag-border-default)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          backgroundColor: 'var(--ag-color-bg-base)',
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
                {currentLang === 'te' ? 'ఖరీదుదారుని డిమాండ్' : (currentLang === 'hi' ? 'खरीदार की मांग' : 'Buyer Requirement')}
              </span>
              {opportunity.buyer?.buyerType && (
                <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', fontWeight: 600 }}>
                  • {opportunity.buyer.buyerType}
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
              {opportunity.buyer?.businessName || (currentLang === 'te' ? 'నమోదిత ఖరీదుదారు' : 'Verified Buyer')}
            </h3>

            {(opportunity.deliveryDistrict || opportunity.deliveryState) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--ag-color-text-secondary)', marginTop: '4px' }}>
                <MapPin size={13} color="var(--ag-color-primary-base)" />
                <span>
                  {[opportunity.deliveryLocation, opportunity.deliveryDistrict, opportunity.deliveryState].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ag-color-text-secondary)',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Main Requirement Highlight Box */}
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534', marginBottom: '2px' }}>
                {currentLang === 'te' ? 'కావాల్సిన పంట' : (currentLang === 'hi' ? 'आवश्यक फसल' : 'Required Crop')}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#14532D' }}>
                {localizeCropName(opportunity.cropName, currentLang)}
                {opportunity.variety && (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#166534', marginLeft: '6px' }}>
                    ({opportunity.variety})
                  </span>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534', marginBottom: '2px' }}>
                {currentLang === 'te' ? 'పరిమాణం' : (currentLang === 'hi' ? 'मात्रा' : 'Required Quantity')}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#14532D' }}>
                {opportunity.remainingQuantity || opportunity.requiredQuantity} {opportunity.unit}
              </div>
            </div>
          </div>

          {/* Price & Budget if actually provided */}
          {opportunity.maxPricePerUnit !== null && opportunity.maxPricePerUnit !== undefined && (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--ag-border-default)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ag-color-text-secondary)' }}>
                  {currentLang === 'te' ? 'ఖరీదుదారు ఆఫర్ ధర' : (currentLang === 'hi' ? 'खरीदार का बजट' : 'Buyer Target Price')}
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', marginTop: '2px' }}>
                  ₹{opportunity.maxPricePerUnit.toLocaleString('en-IN')} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ag-color-text-secondary)' }}>/{opportunity.unit}</span>
                </div>
              </div>

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#15803D',
                backgroundColor: '#DCFCE7',
                padding: '4px 8px',
                borderRadius: '6px',
              }}>
                {opportunity.priceType === 'max_willing_to_pay' ? (currentLang === 'te' ? 'గరిష్ట ధర' : 'Max Budget') : (currentLang === 'te' ? 'చర్చించదగినది' : 'Target Rate')}
              </span>
            </div>
          )}

          {/* Quality & Specifications (Only if provided) */}
          {opportunity.qualityRequirements && (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--ag-border-default)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '4px' }}>
                <BadgeCheck size={16} color="var(--ag-color-primary-base)" />
                <span>{currentLang === 'te' ? 'నాణ్యత అవసరాలు' : (currentLang === 'hi' ? 'गुणवत्ता आवश्यकताएं' : 'Quality Requirements')}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {opportunity.qualityRequirements}
              </p>
            </div>
          )}

          {/* Logistics & Payment Preferences */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {opportunity.requiredByDate && (
              <div style={{
                backgroundColor: 'var(--ag-color-bg-base)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid var(--ag-border-default)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ag-color-text-secondary)', marginBottom: '3px' }}>
                  <Calendar size={14} />
                  <span>{currentLang === 'te' ? 'అవసరమైన తేదీ' : 'Required By'}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
                  {opportunity.requiredByDate}
                </div>
              </div>
            )}

            {opportunity.transportPreference && (
              <div style={{
                backgroundColor: 'var(--ag-color-bg-base)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid var(--ag-border-default)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ag-color-text-secondary)', marginBottom: '3px' }}>
                  <Truck size={14} />
                  <span>{currentLang === 'te' ? 'రవాణా' : 'Transport'}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
                  {opportunity.transportPreference === 'buyer_arranged' 
                    ? (currentLang === 'te' ? 'ఖరీదుదారు రవాణా' : 'Buyer Arranged') 
                    : (currentLang === 'te' ? 'రైతు డెలివరీ' : 'Farmer Delivery')}
                </div>
              </div>
            )}

            {opportunity.paymentPreferences && (
              <div style={{
                backgroundColor: 'var(--ag-color-bg-base)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid var(--ag-border-default)',
                gridColumn: '1 / -1',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ag-color-text-secondary)', marginBottom: '3px' }}>
                  <CreditCard size={14} />
                  <span>{currentLang === 'te' ? 'చెల్లింపు విధానం' : 'Payment Terms'}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ag-color-text-primary)' }}>
                  {opportunity.paymentPreferences}
                </div>
              </div>
            )}
          </div>

          {/* Existing Listing Warning/Banner if farmer already published this crop */}
          {existingActiveLot && (
            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#1D4ED8" />
                <span style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 600 }}>
                  {currentLang === 'te' 
                    ? `మీరు ఇప్పటికే ${localizeCropName(existingActiveLot.crop_name, currentLang)} కోసం ప్రచురించిన లిస్టింగ్ (${existingActiveLot.available_quantity} ${existingActiveLot.unit}) కలిగి ఉన్నారు.` 
                    : `You already have an active published listing for ${existingActiveLot.crop_name} (${existingActiveLot.available_quantity} ${existingActiveLot.unit}).`}
                </span>
              </div>

              {onViewMyLot && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewMyLot(existingActiveLot);
                  }}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #93C5FD',
                    borderRadius: '6px',
                    color: '#1D4ED8',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentLang === 'te' ? 'నా లిస్టింగ్ చూడండి' : 'View My Listing'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '16px 24px',
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
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--ag-radius-sm)',
              border: '1px solid var(--ag-border-default)',
              backgroundColor: '#FFFFFF',
              color: 'var(--ag-color-text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {currentLang === 'te' ? 'మూసివేయి' : (currentLang === 'hi' ? 'बंद करें' : 'Close')}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOfferProduce(opportunity);
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--ag-radius-sm)',
              border: 'none',
              backgroundColor: 'var(--ag-color-primary-base)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(47, 125, 50, 0.25)',
              transition: 'background 0.15s ease',
            }}
          >
            <Handshake size={16} />
            <span>{currentLang === 'te' ? '🤝 మ్యాచ్ రిక్వెస్ట్ పంపండి' : '🤝 Send Match Request'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
