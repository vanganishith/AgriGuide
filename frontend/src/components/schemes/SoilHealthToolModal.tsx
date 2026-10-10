import React, { useState, useEffect } from 'react';
import type { Language } from '../../types';
import { 
  X, 
  Sprout, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink
} from 'lucide-react';

interface SoilHealthToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: Language;
  soilTexture?: string;
  hasSoilTestReport?: boolean;
}

export const SoilHealthToolModal: React.FC<SoilHealthToolModalProps> = ({
  isOpen,
  onClose,
  soilTexture = 'Red Loamy Soil',
}) => {
  const [showSamplingGuide, setShowSamplingGuide] = useState<boolean>(false);

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
              backgroundColor: '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Sprout size={22} color="#16A34A" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ag-color-text-primary)' }}>
                Soil Health
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', marginTop: '2px' }}>
                {soilTexture}
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
          {/* Status Box */}
          <div style={{
            padding: '16px 18px',
            borderRadius: 'var(--ag-radius-sm)',
            backgroundColor: 'var(--ag-color-bg-base)',
            border: '1px solid var(--ag-border-default)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
                Recorded Field Texture:
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-primary-dark)' }}>
                {soilTexture}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)' }}>
              No laboratory soil-test report is recorded for this farm yet.
            </div>
          </div>

          {/* Why test your soil? */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '8px' }}>
              Why test your soil?
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.6 }}>
              A laboratory chemical test measures exact Available Nitrogen (N), Phosphorus (P₂O₅), Potassium (K₂O), Organic Carbon, and Soil pH. Balanced application based on soil testing prevents over-fertilization and can save up to ₹1,500/acre while protecting long-term soil fertility.
            </p>
          </div>

          {/* Collapsible How to Collect a Sample */}
          <div style={{
            borderRadius: 'var(--ag-radius-sm)',
            border: '1px solid var(--ag-border-default)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setShowSamplingGuide(!showSamplingGuide)}
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
              <span>How to collect a soil sample (5 simple steps)</span>
              {showSamplingGuide ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showSamplingGuide && (
              <div style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.6, borderTop: '1px solid var(--ag-border-default)' }}>
                <ol style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ marginBottom: '8px' }}><strong>V-Shaped Cut:</strong> Clear surface weeds/litter and dig a V-shaped hole (15–20 cm depth for field crops).</li>
                  <li style={{ marginBottom: '8px' }}><strong>8–10 Spots:</strong> Collect a 1-inch slice of soil from top to bottom at 8 to 10 representative spots across the plot in a zig-zag pattern.</li>
                  <li style={{ marginBottom: '8px' }}><strong>Mix & Quarter:</strong> Mix all collected sub-samples thoroughly on a clean plastic sheet, divide into four quarters, and discard opposite corners.</li>
                  <li style={{ marginBottom: '8px' }}><strong>Dry in Shade:</strong> Repeat quartering until ~500 grams remain. Air-dry in shade (never in direct hot sun or oven).</li>
                  <li><strong>Submit:</strong> Pack in a clean polythene bag with farmer name, survey number, and village, and submit to your nearest Mandal Agriculture Office (MAO) or KVK.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Action */}
          <a
            href="https://soilhealth.dac.gov.in/"
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
            <span>Visit Soil Health Card Portal</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};
