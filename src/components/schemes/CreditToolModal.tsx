import React, { useState, useEffect } from 'react';
import type { Language } from '../../types';
import { SchemeRelevanceEngine } from '../../services/schemes/schemeRelevanceEngine';
import { 
  X, 
  Landmark, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink 
} from 'lucide-react';

interface CreditToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: Language;
  selectedCrop: string;
  selectedAcres: number;
  locationDistrict?: string;
  locationState?: string;
}

export const CreditToolModal: React.FC<CreditToolModalProps> = ({
  isOpen,
  onClose,
  selectedCrop,
  selectedAcres,
  locationDistrict = 'Warangal',
  locationState = 'Telangana',
}) => {
  const [showCalculationDetails, setShowCalculationDetails] = useState<boolean>(false);

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

  const kccData = SchemeRelevanceEngine.calculateKccCreditRequirement(
    selectedCrop,
    selectedAcres
  );

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
              backgroundColor: 'var(--ag-color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Landmark size={22} color="var(--ag-color-primary-dark)" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ag-color-text-primary)' }}>
                Farm Credit (KCC)
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
          {/* Highlight card */}
          <div style={{
            backgroundColor: 'var(--ag-color-primary-light)',
            borderRadius: 'var(--ag-radius-sm)',
            padding: '18px 20px',
            border: '1px solid #C8E6C9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Estimated Cultivation Requirement
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', marginTop: '4px' }}>
                ₹{kccData.estimatedBaseCredit.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', marginTop: '4px' }}>
                Based on SLBC Benchmark rate of ₹{kccData.scalePerAcre.toLocaleString('en-IN')}/acre
              </div>
            </div>
          </div>

          {/* Expandable Calculation Details */}
          <div style={{
            borderRadius: 'var(--ag-radius-sm)',
            border: '1px solid var(--ag-border-default)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setShowCalculationDetails(!showCalculationDetails)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'var(--ag-color-bg-base)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ag-color-text-primary)',
              }}
            >
              <span>How this is calculated</span>
              {showCalculationDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showCalculationDetails && (
              <div style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.6, borderTop: '1px solid var(--ag-border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--ag-color-text-secondary)' }}>Cultivated Area:</span>
                  <strong>{selectedAcres} Acres</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--ag-color-text-secondary)' }}>Scale of Finance:</span>
                  <strong>₹{kccData.scalePerAcre.toLocaleString('en-IN')} / acre</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--ag-color-text-secondary)' }}>Source Benchmark:</span>
                  <span>{kccData.source}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--ag-color-text-secondary)' }}>Collateral-free limit:</span>
                  <strong style={{ color: '#166534' }}>Up to ₹2.00 Lakhs (RBI guidelines)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--ag-color-text-secondary)' }}>Interest Subvention:</span>
                  <span>{kccData.effectiveInterestRate}</span>
                </div>
              </div>
            )}
          </div>

          {/* Crucial Disclaimer */}
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--ag-radius-sm)',
            padding: '14px 16px',
            fontSize: '13px',
            color: '#78350F',
            lineHeight: 1.5,
          }}>
            <strong>Important:</strong> Actual sanctioned credit limit, interest rate, and eligibility are determined exclusively by the lending bank following physical verification and credit assessment.
          </div>

          {/* Action */}
          <a
            href="https://www.myscheme.gov.in/schemes/kcc"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--ag-radius-sm)',
              backgroundColor: 'var(--ag-color-primary-base)',
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
            <span>Check Official KCC Guidelines</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};
