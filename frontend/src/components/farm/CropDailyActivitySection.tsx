import React, { useState, useEffect, useCallback } from 'react';
import type { 
  Language, 
  FarmPlot, 
  CropDailyActivitiesResponse 
} from '../../types';
import { CropDailyActivityService } from '../../services/crop/cropActivityService';
import { formatISTDateForDisplay } from '../../utils/istDateUtils';
import { 
  localizeCropName, 
  localizeSoil, 
  localizeIrrigation, 
  localizeStage, 
  localizeTask, 
  localizeDescription,
  localizeSource,
  localizeWeatherSnippet,
  localizeHybrid, 
  localizeLocation 
} from '../../i18n/agriLocalization';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Droplet, 
  Sprout, 
  FlaskConical, 
  CloudSun, 
  MapPin, 
  Layers, 
  Sparkles, 
  Check, 
  RotateCcw
} from 'lucide-react';


interface CropDailyActivitySectionProps {
  plot: FarmPlot;
  currentLang: Language;
  farmSoilType?: string;
  farmIrrigationSource?: string;
  farmDistrict?: string;
  farmState?: string;
  onActivityChanged?: () => void;
}

export const CropDailyActivitySection: React.FC<CropDailyActivitySectionProps> = ({
  plot,
  currentLang,
  farmSoilType = 'Black Cotton Soil',
  farmIrrigationSource = 'Drip Irrigation',
  farmDistrict = 'Warangal',
  farmState = 'Telangana',
  onActivityChanged,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [activityData, setActivityData] = useState<CropDailyActivitiesResponse | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    if (!plot?.id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await CropDailyActivityService.getCropActivities(plot.id, currentLang, 15);
      if (data) {
        setActivityData(data);
        // Default selected date to today
        const todayItem = data.timeline15Days.find(d => d.isToday);
        if (todayItem) {
          setSelectedDayDate(todayItem.date);
        } else if (data.timeline15Days.length > 0) {
          setSelectedDayDate(data.timeline15Days[0].date);
        }
      }
    } catch (err: any) {
      console.warn('[CropDailyActivitySection] Failed to load activities:', err.message);
      setErrorMessage(
        currentLang === 'te' 
          ? 'పంట దినచర్య పనులు లోడ్ చేయడంలో లోపం సంభవించింది.' 
          : (currentLang === 'hi' 
              ? 'दैनिक फसल कार्य लोड करने में समस्या आई।' 
              : 'Unable to load daily activities from database.')
      );
    } finally {
      setLoading(false);
    }
  }, [plot?.id, currentLang]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleUpdateStatus = async (activityId: string, status: 'completed' | 'skipped' | 'pending') => {
    setActionLoadingId(activityId);
    try {
      await CropDailyActivityService.updateActivityStatus(activityId, status);
      
      if (status === 'skipped') {
        try {
          const act = activityData?.allActivities.find(a => a.id === activityId);
          if (act) {
            const existing = localStorage.getItem('agriguide_skipped_activities');
            const list = existing ? JSON.parse(existing) : [];
            list.unshift({
              id: act.id,
              title: act.title,
              cropName: plot?.currentCrop || 'Crop',
              stage: act.stage || `Day ${act.cropDay}`,
              skippedAt: new Date().toISOString(),
            });
            localStorage.setItem('agriguide_skipped_activities', JSON.stringify(list.slice(0, 10)));
          }
        } catch (e) {
          console.warn('Error saving skipped activity locally:', e);
        }
      }

      // Update local state optimistically
      setActivityData(prev => {
        if (!prev) return null;
        const updatedAll = prev.allActivities.map(a => {
          if (a.id === activityId) {
            return {
              ...a,
              status,
              isCompleted: status === 'completed',
              completedAt: status === 'completed' ? new Date().toISOString() : null,
            };
          }
          return a;
        });

        const updatedToday = prev.todayActivities.map(a => {
          if (a.id === activityId) {
            return {
              ...a,
              status,
              isCompleted: status === 'completed',
              completedAt: status === 'completed' ? new Date().toISOString() : null,
            };
          }
          return a;
        });

        // Recompute timeline day stats
        const updatedTimeline = prev.timeline15Days.map(dayItem => {
          const dayActs = updatedAll.filter(a => a.activityDate === dayItem.date);
          const completedCount = dayActs.filter(a => a.status === 'completed' || a.isCompleted).length;
          const missedCount = dayActs.filter(a => a.status === 'missed').length;
          const pendingCount = dayActs.filter(a => a.status === 'pending').length;

          let dayStatus: 'completed' | 'missed' | 'in_progress' | 'pending' = 'pending';
          if (dayActs.length > 0 && completedCount === dayActs.length) dayStatus = 'completed';
          else if (missedCount > 0) dayStatus = 'missed';
          else if (completedCount > 0) dayStatus = 'in_progress';

          return {
            ...dayItem,
            completedCount,
            missedCount,
            pendingCount,
            status: dayStatus,
          };
        });

        return {
          ...prev,
          allActivities: updatedAll,
          todayActivities: updatedToday,
          timeline15Days: updatedTimeline,
        };
      });

      if (onActivityChanged) {
        onActivityChanged();
      }
    } catch (err: any) {
      console.warn('[CropDailyActivitySection] Error updating activity status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'irrigation':
        return <Droplet size={18} color="#0284C7" />;
      case 'fertilizer':
        return <FlaskConical size={18} color="#7C3AED" />;
      case 'weather_protection':
        return <CloudSun size={18} color="#D97706" />;
      case 'crop_scouting':
      case 'pest_control':
      default:
        return <Sprout size={18} color="#16A34A" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    if (currentLang === 'te') {
      switch (category) {
        case 'irrigation': return 'నీటి పారుదల';
        case 'fertilizer': return 'ఎరువులు & పోషణ';
        case 'weather_protection': return 'వాతావరణ సంరక్షణ';
        case 'crop_scouting': return 'చేను పరిశీలన';
        case 'pest_control': return 'సస్యరక్షణ';
        default: return 'వ్యవసాయ పని';
      }
    }
    if (currentLang === 'hi') {
      switch (category) {
        case 'irrigation': return 'सिंचाई प्रबंधन';
        case 'fertilizer': return 'उर्वरक और पोषण';
        case 'weather_protection': return 'मौसम सुरक्षा';
        case 'crop_scouting': return 'फसल निगरानी';
        case 'pest_control': return 'कीट नियंत्रण';
        default: return 'कृषि कार्य';
      }
    }
    switch (category) {
      case 'irrigation': return 'Irrigation';
      case 'fertilizer': return 'Nutrition & Fertilizer';
      case 'weather_protection': return 'Weather Action';
      case 'crop_scouting': return 'Crop Scouting';
      case 'pest_control': return 'Pest Control';
      default: return 'Field Activity';
    }
  };

  const getCropEmoji = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('chilli') || n.includes('మిరప') || n.includes('मिर्च')) return '🌶️';
    if (n.includes('cotton') || n.includes('పత్తి') || n.includes('कपास')) return '🌾';
    if (n.includes('maize') || n.includes('మొక్కజొన్న') || n.includes('मक्का')) return '🌽';
    if (n.includes('paddy') || n.includes('వరి') || n.includes('धान') || n.includes('rice')) return '🌾';
    if (n.includes('tomato') || n.includes('టమాట') || n.includes('टमाटर')) return '🍅';
    return '🌱';
  };

  const formatDateDisplay = (dateStr: string) => {
    return formatISTDateForDisplay(dateStr, currentLang);
  };

  if (loading) {
    return (
      <div style={{
        padding: '32px 20px',
        textAlign: 'center',
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: '16px',
        border: '1px solid var(--ag-border-default)',
        color: 'var(--ag-color-text-secondary)',
        fontSize: '14px',
        fontWeight: 600,
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} className="animate-spin" color="var(--ag-color-primary-base)" />
          <span>
            {currentLang === 'te' 
              ? 'ధృవీకరించబడిన దినచర్య పనులు లోడ్ అవుతున్నాయి...' 
              : (currentLang === 'hi' ? 'दैनिक कृषि कार्य लोड हो रहे हैं...' : 'Loading verified daily crop activities...')}
          </span>
        </div>
      </div>
    );
  }

  if (errorMessage || !activityData) {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: '#FAFBF7',
        borderRadius: '16px',
        border: '1px dashed var(--ag-border-default)',
        textAlign: 'center',
      }}>
        <p style={{ margin: 0, color: 'var(--ag-color-text-secondary)', fontSize: '14px' }}>
          {errorMessage || (currentLang === 'te' ? 'పంట దినచర్య సమాచారం అందుబాటులో లేదు.' : 'No daily activity data available.')}
        </p>
      </div>
    );
  }

  const { cropHeader, conditions, timeline15Days, allActivities } = activityData;

  // Activities for currently selected timeline date
  const selectedDayActivities = allActivities.filter(a => a.activityDate === selectedDayDate);
  const selectedDayItem = timeline15Days.find(d => d.date === selectedDayDate) || timeline15Days[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. CROP HEADER CARD */}
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: '16px',
        border: '1px solid var(--ag-border-default)',
        padding: '20px',
        boxShadow: 'var(--ag-shadow-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '26px' }}>{getCropEmoji(cropHeader.cropName)}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                  {localizeCropName(cropHeader.cropName, currentLang)}
                </h3>
                {cropHeader.variety && (
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ag-color-text-secondary)' }}>
                    ({localizeHybrid(cropHeader.variety, currentLang)})
                  </span>
                )}
                <span style={{
                  backgroundColor: '#FAFBF7',
                  color: 'var(--ag-color-primary-dark)',
                  fontSize: '13px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 'var(--ag-radius-full)',
                  border: '1px solid var(--ag-border-default)',
                }}>
                  {cropHeader.acres} {currentLang === 'te' ? 'ఎకరాలు' : (currentLang === 'hi' ? 'एकड़' : 'Acres')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--ag-color-text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                <span>🌱 {localizeStage(cropHeader.stage, currentLang)}</span>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} color="var(--ag-color-primary-base)" />
                  {currentLang === 'te' ? 'నాటిన తేదీ:' : (currentLang === 'hi' ? 'बुवाई तिथि:' : 'Sown:')} {formatDateDisplay(cropHeader.sowingDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Prominent Real Calculated Crop Day Badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--ag-color-primary-light)',
          border: '2px solid var(--ag-color-primary-base)',
          borderRadius: '16px',
          padding: '10px 20px',
          minWidth: '110px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {currentLang === 'te' ? 'పంట వయస్సు' : (currentLang === 'hi' ? 'फसल की आयु' : 'Crop Age')}
          </span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ag-color-primary-dark)', lineHeight: 1.1 }}>
            {currentLang === 'te' 
              ? `${cropHeader.cropDay}వ రోజు` 
              : (currentLang === 'hi' ? `दिन ${cropHeader.cropDay}` : `Day ${cropHeader.cropDay}`)}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-primary-base)' }}>
            {currentLang === 'te' ? 'ఈ రోజు' : (currentLang === 'hi' ? 'आज' : 'Today')}
          </span>
        </div>
      </div>

      {/* 2. CONDITIONS CARD (Soil, Irrigation, Live Weather, Location) */}
      <div style={{
        backgroundColor: '#FAFBF7',
        borderRadius: '14px',
        border: '1px solid var(--ag-border-default)',
        padding: '14px 18px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="#854D0E" />
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', display: 'block', textTransform: 'uppercase' }}>
              {currentLang === 'te' ? 'నేల రకం' : (currentLang === 'hi' ? 'मिट्टी का प्रकार' : 'Soil Type')}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
              {localizeSoil(conditions.soilType || farmSoilType, currentLang)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Droplet size={16} color="#0284C7" />
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', display: 'block', textTransform: 'uppercase' }}>
              {currentLang === 'te' ? 'నీటి పారుదల' : (currentLang === 'hi' ? 'सिंचाई स्रोत' : 'Irrigation')}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
              {localizeIrrigation(conditions.irrigationType || farmIrrigationSource, currentLang)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudSun size={16} color="#D97706" />
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', display: 'block', textTransform: 'uppercase' }}>
              {currentLang === 'te' ? 'నేటి వాతావరణం' : (currentLang === 'hi' ? 'आज का मौसम' : 'Live Weather')}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
              {conditions.weather.temperature}°C · {conditions.weather.rainfallProbability}% {currentLang === 'te' ? 'వర్షం' : (currentLang === 'hi' ? 'बारिश' : 'Rain')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={16} color="var(--ag-color-primary-base)" />
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', display: 'block', textTransform: 'uppercase' }}>
              {currentLang === 'te' ? 'ప్రాంతం' : (currentLang === 'hi' ? 'स्थान' : 'Location')}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
              {localizeLocation(conditions.district || farmDistrict, conditions.state || farmState, currentLang)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. 15-DAY ROLLING ACTIVITY TIMELINE */}
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: '16px',
        border: '1px solid var(--ag-border-default)',
        padding: '18px 20px',
        boxShadow: 'var(--ag-shadow-card)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
              🗓 {currentLang === 'te' ? 'గత 15 రోజుల కార్యాచరణ చరిత్ర & నేటి ప్రణాళిక' : (currentLang === 'hi' ? 'पिछले 15 दिनों का कार्य इतिहास और आज की योजना' : "Past 15 Days Activity History & Today's Plan")}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', margin: '2px 0 0 0' }}>
              {currentLang === 'te' 
                ? 'AI మీ గత 2-3 రోజుల పనులు, నేటి వాతావరణం మరియు నేల స్వభావాన్ని విశ్లేషించి నేటి ప్రణాళికను సిద్ధం చేసింది.' 
                : (currentLang === 'hi' ? 'AI आपके पिछले 2-3 दिनों के कार्यों, आज के मौसम और मिट्टी का विश्लेषण करके आज की योजना तैयार करता है।' : "AI analyzes your past 2-3 days' activity, live weather, and soil factors to generate today's adaptive plan.")}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--ag-color-primary-dark)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ag-color-primary-base)' }} />
              {currentLang === 'te' ? 'పూర్తయింది' : (currentLang === 'hi' ? 'पूर्ण' : 'Completed')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#D97706' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              {currentLang === 'te' ? 'మిస్ అయింది' : (currentLang === 'hi' ? 'छूट गया' : 'Missed')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#64748B' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94A3B8' }} />
              {currentLang === 'te' ? 'పెండింగ్' : (currentLang === 'hi' ? 'लंबित' : 'Pending')}
            </span>
          </div>
        </div>

        {/* Horizontal Scrollable Day Selector */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'thin',
        }}>
          {timeline15Days.map((dayItem) => {
            const isSelected = dayItem.date === selectedDayDate;
            const isCompleted = dayItem.status === 'completed';
            const isMissed = dayItem.status === 'missed';

            return (
              <button
                key={dayItem.date}
                onClick={() => setSelectedDayDate(dayItem.date)}
                style={{
                  flex: '0 0 auto',
                  minWidth: '85px',
                  padding: '10px 8px',
                  borderRadius: '12px',
                  border: isSelected 
                    ? '2px solid var(--ag-color-primary-base)' 
                    : (dayItem.isToday ? '2px solid #86EFAC' : '1px solid var(--ag-border-default)'),
                  backgroundColor: isSelected 
                    ? 'var(--ag-color-primary-light)' 
                    : (dayItem.isToday ? '#F0FDF4' : '#FFFFFF'),
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(34, 197, 94, 0.15)' : 'none',
                }}
              >
                {/* Today Pill */}
                {dayItem.isToday && (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 900,
                    backgroundColor: 'var(--ag-color-primary-base)',
                    color: '#FFFFFF',
                    padding: '1px 6px',
                    borderRadius: 'var(--ag-radius-full)',
                    textTransform: 'uppercase',
                  }}>
                    {currentLang === 'te' ? 'నేడు' : (currentLang === 'hi' ? 'आज' : 'Today')}
                  </span>
                )}

                <span style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: isSelected ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)',
                }}>
                  {currentLang === 'te' ? `రోజు ${dayItem.cropDay}` : (currentLang === 'hi' ? `दिन ${dayItem.cropDay}` : `Day ${dayItem.cropDay}`)}
                </span>

                <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', fontWeight: 600 }}>
                  {formatDateDisplay(dayItem.date)}
                </span>

                {/* Status Indicator Icon */}
                <div style={{ marginTop: '2px' }}>
                  {isCompleted ? (
                    <CheckCircle2 size={15} color="var(--ag-color-primary-base)" />
                  ) : isMissed ? (
                    <AlertTriangle size={15} color="#D97706" />
                  ) : (
                    <Clock size={14} color="#94A3B8" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ACTIONS FOR SELECTED DAY */}
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: '16px',
        border: '1px solid var(--ag-border-default)',
        padding: '20px',
        boxShadow: 'var(--ag-shadow-card)',
      }}>
        {/* AI Recent History Analysis Banner */}
        {activityData.recentHistoryAnalysis && (
          <div style={{
            backgroundColor: activityData.recentHistoryAnalysis.missedCount > 0 ? '#FEF3C7' : '#F0FDF4',
            borderRadius: '12px',
            border: `1px solid ${activityData.recentHistoryAnalysis.missedCount > 0 ? '#FDE68A' : '#BBF7D0'}`,
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <Sparkles size={18} color={activityData.recentHistoryAnalysis.missedCount > 0 ? '#D97706' : '#16A34A'} />
            <p style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 600,
              color: activityData.recentHistoryAnalysis.missedCount > 0 ? '#92400E' : '#166534',
              lineHeight: 1.4,
            }}>
              {currentLang === 'te' 
                ? (activityData.recentHistoryAnalysis.summaryTe || activityData.recentHistoryAnalysis.summary)
                : (currentLang === 'hi' 
                    ? (activityData.recentHistoryAnalysis.summaryHi || activityData.recentHistoryAnalysis.summary)
                    : activityData.recentHistoryAnalysis.summary)}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                {selectedDayItem.isToday 
                  ? (currentLang === 'te' ? 'ఈ రోజు వ్యవసాయ పనులు' : (currentLang === 'hi' ? 'आज की कृषि गतिविधियां' : "Today's Farm Activities"))
                  : (currentLang === 'te' 
                      ? `${selectedDayItem.cropDay}వ రోజు పనులు (${formatDateDisplay(selectedDayItem.date)})` 
                      : (currentLang === 'hi' 
                          ? `दिन ${selectedDayItem.cropDay} के कार्य (${formatDateDisplay(selectedDayItem.date)})` 
                          : `Day ${selectedDayItem.cropDay} Activities (${formatDateDisplay(selectedDayItem.date)})`))}
              </h3>
              {selectedDayItem.isToday && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'var(--ag-color-primary-light)',
                  color: 'var(--ag-color-primary-dark)',
                  padding: '2px 8px',
                  borderRadius: 'var(--ag-radius-full)',
                  border: '1px solid #86EFAC',
                }}>
                  {currentLang === 'te' ? 'ఈ రోజే చేయాలి' : (currentLang === 'hi' ? 'आज ही करें' : 'Due Today')}
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '4px 0 0 0' }}>
              {localizeStage(selectedDayItem.stage, currentLang)} · {selectedDayActivities.length} {currentLang === 'te' ? 'పనులు' : (currentLang === 'hi' ? 'कार्य' : 'actionable tasks')}
            </p>
          </div>

          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-secondary)' }}>
            {selectedDayActivities.filter(a => a.isCompleted || a.status === 'completed').length} / {selectedDayActivities.length} {currentLang === 'te' ? 'పూర్తయ్యాయి' : (currentLang === 'hi' ? 'पूर्ण' : 'completed')}
          </div>
        </div>

        {/* Tasks List */}
        {selectedDayActivities.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            backgroundColor: '#FAFBF7',
            borderRadius: '12px',
            border: '1px dashed var(--ag-border-default)',
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--ag-color-text-secondary)', fontWeight: 600 }}>
              {currentLang === 'te' ? 'ఈ రోజు ప్రత్యేక పనులు ఏవీ లేవు.' : (currentLang === 'hi' ? 'इस दिन कोई विशेष कार्य निर्धारित नहीं है।' : 'No tasks scheduled for this day.')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedDayActivities.map((act) => {
              const isCompleted = act.status === 'completed' || act.isCompleted;
              const isMissed = act.status === 'missed';
              const isSkipped = act.status === 'skipped';
              const isBusy = actionLoadingId === act.id;

              return (
                <div
                  key={act.id}
                  style={{
                    backgroundColor: isCompleted ? '#F8FAF9' : (isMissed ? '#FEF8F8' : '#FFFFFF'),
                    borderRadius: '14px',
                    border: isCompleted 
                      ? '1px solid #A3D9A5' 
                      : (isMissed ? '1px solid #FAD48C' : '1px solid var(--ag-border-default)'),
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '240px' }}>
                      <div style={{
                        marginTop: '2px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: isCompleted ? 'var(--ag-color-primary-light)' : '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {getCategoryIcon(act.category)}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: 'var(--ag-color-text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}>
                            {getCategoryLabel(act.category)}
                          </span>

                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: 'var(--ag-radius-full)',
                            backgroundColor: act.priority === 'high' ? '#FDF0F0' : '#FAFBF7',
                            color: act.priority === 'high' ? 'var(--ag-color-danger-base)' : 'var(--ag-color-text-secondary)',
                            border: '1px solid var(--ag-border-default)',
                            textTransform: 'uppercase',
                          }}>
                            {act.priority === 'high' 
                              ? (currentLang === 'te' ? 'అత్యవసరం' : (currentLang === 'hi' ? 'उच्च प्राथमिकता' : 'High Priority'))
                              : (currentLang === 'te' ? 'సాధారణ' : (currentLang === 'hi' ? 'मध्यम' : 'Normal'))}
                          </span>

                          {/* Status Badge */}
                          {isCompleted && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: 'var(--ag-color-primary-dark)',
                              backgroundColor: 'var(--ag-color-primary-light)',
                              padding: '1px 8px',
                              borderRadius: 'var(--ag-radius-full)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}>
                              <Check size={12} />
                              {currentLang === 'te' ? 'పూర్తయింది' : (currentLang === 'hi' ? 'पूर्ण' : 'Completed')}
                            </span>
                          )}

                          {isMissed && !isCompleted && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#B45309',
                              backgroundColor: '#FEF3C7',
                              padding: '1px 8px',
                              borderRadius: 'var(--ag-radius-full)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}>
                              <AlertTriangle size={12} />
                              {currentLang === 'te' ? 'మిస్ అయింది' : (currentLang === 'hi' ? 'छूट गया' : 'Missed')}
                            </span>
                          )}

                          {isSkipped && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#64748B',
                              backgroundColor: '#F1F5F9',
                              padding: '1px 8px',
                              borderRadius: 'var(--ag-radius-full)',
                            }}>
                              {currentLang === 'te' ? 'వదిలివేయబడింది' : (currentLang === 'hi' ? 'छोड़ दिया' : 'Skipped')}
                            </span>
                          )}
                        </div>

                        <h5 style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: isCompleted ? 'var(--ag-color-text-secondary)' : 'var(--ag-color-text-primary)',
                          margin: '4px 0 2px 0',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                        }}>
                          {localizeTask(act.title, currentLang)}
                        </h5>

                        <p style={{
                          fontSize: '13px',
                          color: isCompleted ? 'var(--ag-color-text-secondary)' : 'var(--ag-color-text-primary)',
                          margin: 0,
                          lineHeight: 1.45,
                        }}>
                          {localizeDescription(act.conciseDescription, currentLang)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      {!isCompleted ? (
                        <>
                          <button
                            disabled={isBusy}
                            onClick={() => handleUpdateStatus(act.id, 'completed')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'var(--ag-color-primary-base)',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: 'var(--ag-radius-full)',
                              fontSize: '13px',
                              fontWeight: 800,
                              cursor: isBusy ? 'wait' : 'pointer',
                              minHeight: '38px',
                              boxShadow: 'var(--ag-shadow-button)',
                              opacity: isBusy ? 0.7 : 1,
                            }}
                          >
                            <Check size={16} />
                            <span>{currentLang === 'te' ? 'పూర్తయింది' : (currentLang === 'hi' ? 'पूर्ण करें' : 'Mark Done')}</span>
                          </button>

                          <button
                            disabled={isBusy}
                            onClick={() => handleUpdateStatus(act.id, isSkipped ? 'pending' : 'skipped')}
                            title="Skip this task"
                            style={{
                              backgroundColor: 'transparent',
                              color: 'var(--ag-color-text-secondary)',
                              border: '1px solid var(--ag-border-default)',
                              padding: '8px 12px',
                              borderRadius: 'var(--ag-radius-full)',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: isBusy ? 'wait' : 'pointer',
                              minHeight: '38px',
                            }}
                          >
                            {isSkipped ? <RotateCcw size={14} /> : <span>{currentLang === 'te' ? 'వదిలేయి' : (currentLang === 'hi' ? 'छोड़ें' : 'Skip')}</span>}
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={isBusy}
                          onClick={() => handleUpdateStatus(act.id, 'pending')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#FFFFFF',
                            color: 'var(--ag-color-text-secondary)',
                            border: '1px solid var(--ag-border-default)',
                            padding: '6px 14px',
                            borderRadius: 'var(--ag-radius-full)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: isBusy ? 'wait' : 'pointer',
                            minHeight: '36px',
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>{currentLang === 'te' ? 'మళ్లీ మార్చు' : (currentLang === 'hi' ? 'पुनः खोलें' : 'Reopen')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Context & Provenance Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: 'var(--ag-color-text-secondary)',
                    borderTop: '1px solid var(--ag-border-default)',
                    paddingTop: '8px',
                    marginTop: '4px',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}>
                    <span>
                      {localizeSource(act.sourceContext, currentLang)}
                    </span>
                    {act.weatherContext && (
                      <span>
                        🌦 {localizeWeatherSnippet(act.weatherContext, currentLang)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
