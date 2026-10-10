import React, { useState, useMemo } from 'react';
import type { 
  AlertNotification, 
  Language, 
  CropHealth, 
  Farm, 
  MarketPrice, 
  FarmerProfile, 
  DesktopNavTab 
} from '../../types';
import { AlertEngine } from '../../services/alert/alertEngine';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  PlusCircle, 
  ChevronRight
} from 'lucide-react';

interface AlertsSectionProps {
  alerts: AlertNotification[];
  currentLang: Language;
  crops?: CropHealth[];
  farms?: Farm[];
  markets?: MarketPrice[];
  farmerProfile?: FarmerProfile | null;
  onNavigateTab?: (tab: DesktopNavTab) => void;
  onRefreshAlerts?: () => void;
  style?: React.CSSProperties;
}

type AlertFilterCategory = 'all' | 'skipped_activity' | 'scheme_deadline' | 'mandi_fluctuation' | 'weather';

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  alerts: rawAlerts,
  currentLang,
  crops = [],
  farms = [],
  markets = [],
  farmerProfile = null,
  onNavigateTab,
  onRefreshAlerts,
  style,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AlertFilterCategory>('all');
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(() => new Set());
  const [simulatedSkipCount, setSimulatedSkipCount] = useState<number>(0);

  // Generate enriched comprehensive alerts
  const allEnrichedAlerts = useMemo(() => {
    return AlertEngine.generateComprehensiveAlerts({
      serverAlerts: rawAlerts,
      crops,
      farms,
      markets,
      currentLang,
      farmerProfile,
    });
  }, [rawAlerts, crops, farms, markets, currentLang, farmerProfile, simulatedSkipCount]);

  // Active alerts excluding dismissed
  const activeAlerts = useMemo(() => {
    return allEnrichedAlerts.filter(a => !dismissedAlertIds.has(a.id));
  }, [allEnrichedAlerts, dismissedAlertIds]);

  // Filtered by selected category tab
  const displayedAlerts = useMemo(() => {
    if (selectedCategory === 'all') return activeAlerts;
    return activeAlerts.filter(a => a.category === selectedCategory);
  }, [activeAlerts, selectedCategory]);

  // Category counts
  const countSkipped = activeAlerts.filter(a => a.category === 'skipped_activity').length;
  const countSchemes = activeAlerts.filter(a => a.category === 'scheme_deadline').length;
  const countMandi = activeAlerts.filter(a => a.category === 'mandi_fluctuation').length;
  const countWeather = activeAlerts.filter(a => a.category === 'weather').length;

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlertIds(prev => new Set(prev).add(id));
  };

  const handleClearAll = () => {
    const allIds = new Set(allEnrichedAlerts.map(a => a.id));
    setDismissedAlertIds(allIds);
  };

  const handleSimulateSkip = () => {
    AlertEngine.recordSkippedActivityDemo(
      crops[0]?.cropName || 'Cotton',
      currentLang === 'te' ? 'కలుపు నివారణ & ఎరువుల పిచికారీ' : 'Intercultivation & Urea Top Dressing'
    );
    setSimulatedSkipCount(prev => prev + 1);
    if (onRefreshAlerts) onRefreshAlerts();
  };

  return (
    <section 
      aria-labelledby="notifications-heading" 
      style={{
        margin: '0 auto',
        maxWidth: '780px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxSizing: 'border-box',
        padding: '4px 0 40px 0',
        ...style,
      }}
    >
      {/* 1. Slim Notification Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '2px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--ag-radius-full)',
            backgroundColor: 'rgba(46, 125, 50, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ag-color-primary-base)',
          }}>
            <Bell size={17} />
          </div>

          <h2 id="notifications-heading" style={{
            fontSize: '19px',
            fontWeight: 800,
            color: 'var(--ag-color-text-primary)',
            letterSpacing: '-0.02em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>{currentLang === 'te' ? 'నోటిఫికేషన్లు' : (currentLang === 'hi' ? 'सूचनाएं' : 'Notifications')}</span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'var(--ag-color-primary-base)',
              color: '#FFFFFF',
              padding: '1px 7px',
              borderRadius: 'var(--ag-radius-full)',
            }}>
              {activeAlerts.length}
            </span>
          </h2>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleSimulateSkip}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'transparent',
              color: '#DC2626',
              border: '1px solid #FECACA',
              padding: '4px 9px',
              borderRadius: 'var(--ag-radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Simulate a skipped task to see instant notification"
          >
            <PlusCircle size={12} />
            <span>{currentLang === 'te' ? '+ పని దాటవేత టెస్ట్' : '+ Test Skip'}</span>
          </button>

          {activeAlerts.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--ag-color-text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              {currentLang === 'te' ? 'అన్నీ తొలగించండి' : (currentLang === 'hi' ? 'सभी हटाएं' : 'Clear all')}
            </button>
          )}
        </div>
      </div>

      {/* 2. Compact Filter Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '2px',
      }}>
        {[
          { id: 'all', label: currentLang === 'te' ? `అన్నీ (${activeAlerts.length})` : `All (${activeAlerts.length})` },
          { id: 'skipped_activity', label: currentLang === 'te' ? `దాటవేసిన పనులు (${countSkipped})` : `Tasks (${countSkipped})` },
          { id: 'scheme_deadline', label: currentLang === 'te' ? `పథకాలు (${countSchemes})` : `Schemes (${countSchemes})` },
          { id: 'mandi_fluctuation', label: currentLang === 'te' ? `మార్కెట్ (${countMandi})` : `Mandi (${countMandi})` },
          { id: 'weather', label: currentLang === 'te' ? `వాతావరణం (${countWeather})` : `Weather (${countWeather})` },
        ].map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as AlertFilterCategory)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 11px',
                borderRadius: 'var(--ag-radius-full)',
                border: isActive ? '1px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                backgroundColor: isActive ? 'var(--ag-color-primary-base)' : 'var(--ag-color-surface-base)',
                color: isActive ? '#FFFFFF' : 'var(--ag-color-text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Real Notification Cards Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {displayedAlerts.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--ag-color-surface-base)',
            borderRadius: '14px',
            border: '1px dashed var(--ag-border-default)',
            padding: '36px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle2 size={28} color="var(--ag-color-primary-base)" />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
              {currentLang === 'te' ? 'ఎలాంటి కొత్త నోటిఫికేషన్లు లేవు' : (currentLang === 'hi' ? 'कोई नई सूचना नहीं है' : 'No new notifications')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)' }}>
              {currentLang === 'te' 
                ? 'మీ పంట పనులు, మార్కెట్ ధరలు మరియు పథకాలు అన్నీ సజావుగా ఉన్నాయి.' 
                : 'All scheduled farm activities, mandi rates, and scheme deadlines are up to date.'}
            </div>
          </div>
        ) : (
          displayedAlerts.map((alert) => {
            const isSkipped = alert.category === 'skipped_activity';
            const isScheme = alert.category === 'scheme_deadline';
            const isMandi = alert.category === 'mandi_fluctuation';

            // Category accent, icon, and label
            let leftAccent = '#059669';
            let categoryLabel = 'AgriGuide';
            let iconEmoji = '🌱';

            if (isSkipped) {
              leftAccent = '#EF4444';
              categoryLabel = currentLang === 'te' ? 'పంట పని హెచ్చరిక' : (currentLang === 'hi' ? 'फसल कार्य' : 'Crop Task');
              iconEmoji = '⚠️';
            } else if (isScheme) {
              leftAccent = '#F59E0B';
              categoryLabel = currentLang === 'te' ? 'ప్రభుత్వ పథకం' : (currentLang === 'hi' ? 'सरकारी योजना' : 'Govt Scheme');
              iconEmoji = '🏛';
            } else if (isMandi) {
              leftAccent = alert.metadata?.recommendation === 'HOLD' ? '#E11D48' : '#7C3AED';
              categoryLabel = currentLang === 'te' ? 'మార్కెట్ ధర' : (currentLang === 'hi' ? 'मंडी भाव' : 'Mandi Ticker');
              iconEmoji = alert.metadata?.recommendation === 'HOLD' ? '📉' : '📈';
            }

            return (
              <div
                key={alert.id}
                onClick={() => alert.actionTab && onNavigateTab && onNavigateTab(alert.actionTab)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '13px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderLeft: `4px solid ${leftAccent}`,
                  padding: '12px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: alert.actionTab ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.06)';
                  e.currentTarget.style.backgroundColor = '#FAFAF9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                {/* Micro App Header Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', lineHeight: 1 }}>{iconEmoji}</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--ag-color-primary-base)',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                    }}>
                      AgriGuide
                    </span>
                    <span style={{ fontSize: '10px', color: '#CBD5E1' }}>•</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#64748B',
                    }}>
                      {categoryLabel}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                      {alert.issuedAt}
                    </span>

                    <button
                      onClick={(e) => handleDismiss(alert.id, e)}
                      aria-label="Dismiss notification"
                      title="Dismiss"
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: 'var(--ag-radius-full)',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F1F5F9';
                        e.currentTarget.style.color = '#334155';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#94A3B8';
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* BIG PROMINENT HEADLINE */}
                <div style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.35,
                  paddingRight: '20px',
                }}>
                  {alert.title}
                </div>

                {/* Concise 1-Sentence Subtext with Subtle Action Arrow */}
                {alert.description && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginTop: '2px',
                  }}>
                    <div style={{
                      fontSize: '12.5px',
                      color: '#475569',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {alert.description}
                    </div>

                    {alert.actionTab && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--ag-color-primary-base)',
                        flexShrink: 0,
                      }}>
                        <span>{alert.actionLabel || 'Open'}</span>
                        <ChevronRight size={11} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
