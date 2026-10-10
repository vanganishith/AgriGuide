import React, { useEffect } from 'react';
import type { SchemeInfo, Language } from '../../types';
import { translations } from '../../i18n/translations';
import { 
  X, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  AlertCircle, 
  FileText, 
  Landmark, 
  ShieldCheck, 
  Droplets, 
  Sprout, 
  Clock 
} from 'lucide-react';

interface SchemeDetailsModalProps {
  scheme: SchemeInfo | null;
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  isSaved: boolean;
  onToggleSave: (schemeId: string) => void;
}

export const SchemeDetailsModal: React.FC<SchemeDetailsModalProps> = ({
  scheme,
  isOpen,
  onClose,
  currentLang,
  isSaved,
  onToggleSave,
}) => {
  const t = translations[currentLang];

  // Lock background scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !scheme) return null;

  // Localized texts
  const schemeName = currentLang === 'te' && scheme.officialNameTe 
    ? scheme.officialNameTe 
    : currentLang === 'hi' && scheme.officialNameHi 
    ? scheme.officialNameHi 
    : scheme.officialName;

  const benefitSummary = currentLang === 'te' && scheme.benefitSummaryTe 
    ? scheme.benefitSummaryTe 
    : currentLang === 'hi' && scheme.benefitSummaryHi 
    ? scheme.benefitSummaryHi 
    : scheme.benefitSummary;

  const benefitAmount = currentLang === 'te' && scheme.benefitAmountDetailsTe 
    ? scheme.benefitAmountDetailsTe 
    : currentLang === 'hi' && scheme.benefitAmountDetailsHi 
    ? scheme.benefitAmountDetailsHi 
    : scheme.benefitAmountDetails;

  const eligibilityList = currentLang === 'te' && scheme.eligibilityCriteriaTe 
    ? scheme.eligibilityCriteriaTe 
    : currentLang === 'hi' && scheme.eligibilityCriteriaHi 
    ? scheme.eligibilityCriteriaHi 
    : scheme.eligibilityCriteria;

  // Icon mapping
  const renderSchemeIcon = (category: string) => {
    switch (category) {
      case 'credit':
        return <Landmark size={22} color="var(--ag-color-primary-dark)" />;
      case 'insurance':
        return <ShieldCheck size={22} color="#1D4ED8" />;
      case 'irrigation':
        return <Droplets size={22} color="#0284C7" />;
      case 'soil_health':
      case 'soil':
        return <Sprout size={22} color="#16A34A" />;
      default:
        return <FileText size={22} color="var(--ag-color-primary-base)" />;
    }
  };

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
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
      />

      {/* Centered Modal Container */}
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
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: 'var(--ag-color-bg-base)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--ag-radius-sm)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--ag-border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {renderSchemeIcon(scheme.category)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: scheme.authority === 'central' ? '#EFF6FF' : '#F0FDF4',
                  color: scheme.authority === 'central' ? '#1E40AF' : '#166534',
                  border: `1px solid ${scheme.authority === 'central' ? '#BFDBFE' : '#BBF7D0'}`,
                }}>
                  {scheme.authority === 'central' ? 'Central Government' : 'Telangana State'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>
                  {scheme.ministry}
                </span>
              </div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--ag-color-text-primary)',
                margin: 0,
                lineHeight: 1.3,
              }}>
                {schemeName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close scheme details"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ag-color-text-secondary)',
              minWidth: '40px',
              minHeight: '40px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* Summary Box */}
          <div style={{
            backgroundColor: 'var(--ag-color-primary-light)',
            padding: '14px 16px',
            borderRadius: 'var(--ag-radius-sm)',
            border: '1px solid #C8E6C9',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-primary-dark)', marginBottom: '4px' }}>
              {t.benefitDetailsHeading}
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--ag-color-text-primary)', lineHeight: 1.5 }}>
              {benefitSummary}
            </p>
          </div>

          {/* Section 1: Financial & Support Details */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '6px' }}>
              Financial & Support Details
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--ag-color-text-primary)', lineHeight: 1.5, margin: 0 }}>
              {benefitAmount}
            </p>
          </div>

          {/* Section 2: Who May Qualify */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '6px' }}>
              {t.eligibilitySummaryHeading}
            </h3>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.5 }}>
              {eligibilityList.map((c, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{c}</li>
              ))}
            </ul>
          </div>

          {/* Section 3: Exclusions & Conditions if any */}
          {scheme.exclusions && scheme.exclusions.length > 0 && (
            <div style={{
              backgroundColor: '#FFFBEB',
              padding: '12px 14px',
              borderRadius: 'var(--ag-radius-sm)',
              border: '1px solid #FDE68A',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <AlertCircle size={15} color="#D97706" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>
                  Key Exclusions & Conditions
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#78350F', lineHeight: 1.5 }}>
                {scheme.exclusions.map((cond, idx) => (
                  <li key={idx} style={{ marginBottom: '3px' }}>{cond}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 4: Required Documents */}
          {scheme.requiredDocuments && scheme.requiredDocuments.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '6px' }}>
                {t.requiredDocsHeading}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {scheme.requiredDocuments.map((doc, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--ag-color-bg-base)',
                      border: '1px solid var(--ag-border-default)',
                      color: 'var(--ag-color-text-primary)',
                    }}
                  >
                    📄 {currentLang === 'te' && doc.nameTe ? doc.nameTe : currentLang === 'hi' && doc.nameHi ? doc.nameHi : doc.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Application Status */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '6px' }}>
              Application & Availability Status
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ag-color-text-secondary)' }}>
              <Clock size={15} />
              <span>{scheme.applicationStatusText}</span>
            </div>
          </div>

          {/* Section 6: Official source & Verification stamp */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--ag-radius-sm)',
            border: '1px solid var(--ag-border-default)',
            backgroundColor: 'var(--ag-color-bg-base)',
            fontSize: '12px',
            color: 'var(--ag-color-text-secondary)',
          }}>
            <div>
              <strong>Official Authority:</strong> {scheme.sourceAuthority}
            </div>
            <div style={{ marginTop: '4px' }}>
              <strong>{t.sourceVerifiedDatePrefix}</strong> {scheme.lastVerifiedDate}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--ag-border-default)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          <button
            onClick={() => onToggleSave(scheme.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 'var(--ag-radius-sm)',
              border: '1px solid var(--ag-border-default)',
              backgroundColor: isSaved ? 'var(--ag-color-primary-light)' : '#FFFFFF',
              color: isSaved ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
            }}
          >
            {isSaved ? (
              <>
                <BookmarkCheck size={18} color="var(--ag-color-primary-dark)" />
                {t.savedSchemeBtn}
              </>
            ) : (
              <>
                <Bookmark size={18} />
                {t.saveSchemeBtn}
              </>
            )}
          </button>

          <a
            href={scheme.officialPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1.5,
              padding: '12px 16px',
              borderRadius: 'var(--ag-radius-sm)',
              backgroundColor: 'var(--ag-color-primary-base)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
            }}
          >
            <span>{t.officialPortalBtn}</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};
