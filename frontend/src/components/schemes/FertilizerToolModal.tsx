import React, { useState, useEffect } from 'react';
import type { Language } from '../../types';
import { translations } from '../../i18n/translations';
import { SchemeRelevanceEngine } from '../../services/schemes/schemeRelevanceEngine';
import { 
  X, 
  Sprout, 
  ChevronDown, 
  ChevronUp, 
  Calculator, 
  Info 
} from 'lucide-react';

interface FertilizerToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  selectedCrop: string;
  selectedAcres: number;
  locationState?: string;
  soilTexture?: string;
  hasSoilTestReport?: boolean;
}

export const FertilizerToolModal: React.FC<FertilizerToolModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  selectedCrop,
  selectedAcres,
  soilTexture = 'Red Loamy Soil',
}) => {
  const t = translations[currentLang];

  // Custom bag prices state
  const [customUreaPrice, setCustomUreaPrice] = useState<number>(266.50);
  const [customDapPrice, setCustomDapPrice] = useState<number>(1350.00);
  const [customMopPrice, setCustomMopPrice] = useState<number>(1700.00);

  // Accordion for cost calculator and timeline items
  const [showCostCalculator, setShowCostCalculator] = useState<boolean>(false);
  const [expandedScheduleIdx, setExpandedScheduleIdx] = useState<number | null>(0);

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

  const fertilizerData = SchemeRelevanceEngine.getFertilizerGuidance(
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
        maxWidth: '800px',
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
              <Sprout size={22} color="var(--ag-color-primary-dark)" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ag-color-text-primary)' }}>
                {t.fertilizerGuideTitle}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', marginTop: '2px' }}>
                {selectedCrop} • {selectedAcres} acres • {soilTexture}
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
          {/* Soil Test Honest Note */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--ag-radius-sm)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '13px',
            color: '#475569',
            lineHeight: 1.5,
          }}>
            <Info size={18} color="#64748B" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              No laboratory soil test is recorded for this farm. Recommendations are based on general crop guidance ({fertilizerData.guidance.sourceBenchmark}).
            </span>
          </div>

          {/* Recommended Input Bags */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '10px' }}>
              Recommended Input Bags ({selectedAcres} Acres)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <div style={{
                padding: '16px',
                borderRadius: 'var(--ag-radius-sm)',
                backgroundColor: 'var(--ag-color-bg-base)',
                border: '1px solid var(--ag-border-default)',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Urea</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', margin: '6px 0 2px' }}>
                  {fertilizerData.totalBagsEstimated.ureaBags}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>45kg bags</span>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: 'var(--ag-radius-sm)',
                backgroundColor: 'var(--ag-color-bg-base)',
                border: '1px solid var(--ag-border-default)',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>DAP</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', margin: '6px 0 2px' }}>
                  {fertilizerData.totalBagsEstimated.dapBags}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>50kg bags</span>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: 'var(--ag-radius-sm)',
                backgroundColor: 'var(--ag-color-bg-base)',
                border: '1px solid var(--ag-border-default)',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>MOP</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', margin: '6px 0 2px' }}>
                  {fertilizerData.totalBagsEstimated.mopBags}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>50kg bags</span>
              </div>
            </div>
          </div>

          {/* Application Timeline Plan */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '10px' }}>
              Application Plan
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fertilizerData.guidance.splitSchedule.map((step: any, idx: number) => {
                const isExp = expandedScheduleIdx === idx;
                const stageLabel = idx === 0 ? 'NOW' : idx === 1 ? 'NEXT' : 'LATER';
                return (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 'var(--ag-radius-sm)',
                      border: '1px solid var(--ag-border-default)',
                      backgroundColor: isExp ? '#F9FAF8' : '#FFFFFF',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => setExpandedScheduleIdx(isExp ? null : idx)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: idx === 0 ? 'var(--ag-color-primary-light)' : '#E2E8F0',
                          color: idx === 0 ? 'var(--ag-color-primary-dark)' : '#475569',
                        }}>
                          {stageLabel}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ag-color-text-primary)' }}>
                          {step.stageName} ({step.timingDayRange})
                        </span>
                      </div>
                      {isExp ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isExp && (
                      <div style={{ padding: '0 16px 14px', fontSize: '13px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.5, borderTop: '1px solid #F1F5F0', paddingTop: '10px' }}>
                        {step.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estimate Input Cost Accordion */}
          <div style={{
            borderRadius: 'var(--ag-radius-sm)',
            border: '1px solid #BBF7D0',
            backgroundColor: '#F0FDF4',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setShowCostCalculator(!showCostCalculator)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#14532D',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calculator size={18} color="#166534" />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>
                  Estimated Input Cost
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <strong style={{ fontSize: '16px', color: '#14532D' }}>
                  ₹{((fertilizerData.totalBagsEstimated.ureaBags * customUreaPrice) + (fertilizerData.totalBagsEstimated.dapBags * customDapPrice) + (fertilizerData.totalBagsEstimated.mopBags * customMopPrice)).toLocaleString('en-IN')}
                </strong>
                {showCostCalculator ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {showCostCalculator && (
              <div style={{ padding: '0 18px 16px', borderTop: '1px dashed #86EFAC', paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', color: '#166534', marginBottom: '10px', fontWeight: 600 }}>
                  Adjust Dealer Rates (₹ / 45-50kg bag):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#15803D', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Urea (₹/bag)</label>
                    <input
                      type="number"
                      value={customUreaPrice}
                      onChange={(e) => setCustomUreaPrice(Number(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #86EFAC', backgroundColor: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#15803D', display: 'block', marginBottom: '4px', fontWeight: 600 }}>DAP (₹/bag)</label>
                    <input
                      type="number"
                      value={customDapPrice}
                      onChange={(e) => setCustomDapPrice(Number(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #86EFAC', backgroundColor: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#15803D', display: 'block', marginBottom: '4px', fontWeight: 600 }}>MOP (₹/bag)</label>
                    <input
                      type="number"
                      value={customMopPrice}
                      onChange={(e) => setCustomMopPrice(Number(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #86EFAC', backgroundColor: '#FFFFFF' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
