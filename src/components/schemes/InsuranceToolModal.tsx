import React, { useEffect } from 'react';
import type { Language } from '../../types';
import { 
  X, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

interface InsuranceToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: Language;
  selectedCrop: string;
  selectedAcres: number;
  locationDistrict?: string;
  locationState?: string;
}

export const InsuranceToolModal: React.FC<InsuranceToolModalProps> = ({
  isOpen,
  onClose,
  selectedCrop,
  selectedAcres,
  locationDistrict = 'Warangal',
  locationState = 'Telangana',
}) => {
  // Lock background scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCommercialOrHorticulture = ['Cotton', 'Chilli', 'Tomato', 'Turmeric', 'Sugarcane'].includes(selectedCrop);
  const premiumRatePct = isCommercialOrHorticulture ? 5.0 : 2.0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(25, 53, 42, 0.45)',
      padding: '16px',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
      />

      <div style={{
        position: 'relative',
        zIndex: 1001,
        width: '100%',
        maxWidth: '720px',
        maxHeight: '88vh',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--ag-radius-md, 8px)',
        border: '1px solid var(--ag-border-default)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--ag-border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--ag-color-bg-base)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--ag-radius-sm)',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ShieldCheck size={22} color="#1D4ED8" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ag-color-text-primary)' }}>
                Check Insurance Availability
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', marginTop: '2px' }}>
                {selectedCrop} • {selectedAcres} acres • {locationDistrict}, {locationState}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              color: 'var(--ag-color-text-secondary)',
              minWidth: '40px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* Status Context Grid */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: 'var(--ag-color-bg-base)',
            padding: '16px 18px',
            borderRadius: 'var(--ag-radius-sm)',
            border: '1px solid var(--ag-border-default)',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ag-color-text-secondary)' }}>Crop & Cultivated Area:</span>
              <strong>{selectedCrop} ({selectedAcres} Acres)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ag-color-text-secondary)' }}>Location:</span>
              <strong>{locationDistrict}, {locationState}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ag-color-text-secondary)' }}>Coverage Status:</span>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#92400E',
                backgroundColor: '#FEF3C7',
                padding: '3px 10px',
                borderRadius: '4px',
              }}>
                Needs verification on PMFBY
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ag-color-text-secondary)' }}>Standard Farmer Premium Cap:</span>
              <strong>{premiumRatePct}% of Sum Insured</strong>
            </div>
          </div>

          {/* Explanation */}
          <div style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.6 }}>
            Under the Pradhan Mantri Fasal Bima Yojana (PMFBY), crop insurance coverage is notified by state governments for specific crops in designated insurance units (Gram Panchayat / Mandal level) for each Kharif and Rabi season.
          </div>

          {/* Verification Notice */}
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--ag-radius-sm)',
            padding: '14px 16px',
            fontSize: '13px',
            color: '#78350F',
            lineHeight: 1.5,
          }}>
            <strong>Important:</strong> Coverage and premium cannot be calculated without the official state notification for your specific village/mandal. Please check active notification dates on the PMFBY portal.
          </div>

          {/* Action */}
          <a
            href="https://pmfby.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--ag-radius-sm)',
              backgroundColor: '#1D4ED8',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
            }}
          >
            <span>Check on PMFBY Official Portal</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};
