import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Store, 
  FileText, 
  PlusCircle, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Scale, 
  Tag,
  Handshake,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import type { SellingLot, BuyingRequirement, MarketplaceStats } from '../types/marketplace';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';
import { sortLotsByBuyerPreferences, getLotPreferenceRank } from '../utils/cropPreferences';

interface DashboardPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<MarketplaceStats>({
    activeLotsCount: 0,
    totalAvailableQuantity: 0,
    activeRequirementsCount: 0,
    registeredBuyersCount: 0,
    activeOffersCount: 0,
  });
  const [recentLots, setRecentLots] = useState<SellingLot[]>([]);
  const [myRequirements, setMyRequirements] = useState<BuyingRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [statsData, lotsData, reqsData] = await Promise.all([
          api.getMarketStats(),
          api.getSellingLots({ limit: 12, sort: 'preferred' }),
          api.getBuyingRequirements(),
        ]);
        setStats(statsData);
        setRecentLots(lotsData.lots || []);
        setMyRequirements(reqsData.requirements || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Dynamically sort and slice lots by buyer's profile preferences
  const displayedLots = React.useMemo(() => {
    const sorted = sortLotsByBuyerPreferences(recentLots, profile?.preferred_crops);
    return sorted.slice(0, 4);
  }, [recentLots, profile?.preferred_crops]);

  if (loading) {
    return <LoadingSpinner message="Loading procurement dashboard..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="blue">Verified Buyer Account</Badge>
            {profile?.gstin && <Badge variant="green">GST: {profile.gstin}</Badge>}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {profile?.business_name ? `Welcome back, ${profile.business_name}` : 'Agricultural Commodity Buyer Portal'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Real-time procurement hub connected to verified farmer produce listings in Telangana and Andhra Pradesh.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('requirements/new')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--brand-blue)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <PlusCircle size={16} />
            <span>Post Requirement</span>
          </button>

          <button
            onClick={() => onNavigate('marketplace')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Store size={16} />
            <span>Browse Produce</span>
          </button>
        </div>
      </div>

      {/* 2. Real Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          onClick={() => onNavigate('marketplace')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Active Farmer Listings</span>
            <Store size={18} color="var(--brand-blue)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '8px' }}>
            {stats.activeLotsCount}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real produce available</span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Total Available Quantity</span>
            <Scale size={18} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '8px' }}>
            {stats.totalAvailableQuantity} <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)' }}>Quintals</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Verified farmer stock</span>
        </div>

        <div
          onClick={() => onNavigate('requirements')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>My Buying Requirements</span>
            <FileText size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '8px' }}>
            {myRequirements.length}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active procurement demands</span>
        </div>

        <div
          onClick={() => onNavigate('offers')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Active Bids & Deals</span>
            <Handshake size={18} color="var(--brand-blue)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--accent-green)', marginTop: '8px' }}>
            {stats.activeOffersCount || 0}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Negotiations & contracts</span>
        </div>
      </div>

      {/* 3. Two Columns: Live Produce vs Active Demands */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Column: Recent Available Produce */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: '22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Latest Published Produce
                </h3>
                {profile?.preferred_crops && profile.preferred_crops.length > 0 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--brand-blue)',
                      backgroundColor: 'var(--brand-blue-light)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    <Sparkles size={11} />
                    Buyer Preference Order
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                {profile?.preferred_crops && profile.preferred_crops.length > 0
                  ? `Prioritized by your preferred commodities (${profile.preferred_crops.slice(0, 3).join(', ')}${profile.preferred_crops.length > 3 ? '...' : ''})`
                  : 'Real stock explicitly offered by farmers'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('marketplace')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--brand-blue)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View All ({stats.activeLotsCount})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {displayedLots.length === 0 ? (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-default)',
              }}
            >
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                No active farmer selling lots in the marketplace yet.
              </p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                When farmers publish harvested produce for sale, listings will appear here in real time.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedLots.map((lot) => {
                const { rank } = getLotPreferenceRank(lot, profile?.preferred_crops);
                const isPreferred = rank < 9999;

                return (
                  <div
                    key={lot.id}
                    onClick={() => onNavigate('marketplace/detail', lot.id)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      border: isPreferred ? '1px solid #BAE6FD' : '1px solid var(--border-default)',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--brand-blue)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isPreferred ? '#BAE6FD' : 'var(--border-default)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {lot.crop_name}
                        </span>
                        {lot.variety && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            ({lot.variety})
                          </span>
                        )}
                        {lot.quality_grade && <Badge variant="green">{lot.quality_grade}</Badge>}
                        {isPreferred && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#0369A1',
                              backgroundColor: '#E0F2FE',
                              padding: '1px 7px',
                              borderRadius: '12px',
                              border: '1px solid #BAE6FD',
                            }}
                          >
                            <Sparkles size={10} color="#0284C7" />
                            Preference #{rank + 1}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={12} color="var(--brand-blue)" />
                          {lot.approx_location}, {lot.district}
                        </span>
                        <span>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={12} />
                          Available: {lot.expected_availability_date}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>
                        {lot.available_quantity} {lot.unit}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: lot.is_open_to_offers ? 'var(--brand-blue)' : 'var(--accent-green)' }}>
                        {lot.is_open_to_offers ? 'Open to Offers' : `₹${lot.asking_price_per_unit} / ${lot.unit}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: My Active Buying Requirements */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: '22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                My Procurement Demands
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Commodity demands posted to farmers with instant produce matching
              </p>
            </div>
            <button
              onClick={() => onNavigate('requirements')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--brand-blue)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Manage ({myRequirements.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {myRequirements.length === 0 ? (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-default)',
              }}
            >
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                You have not posted any buying requirements yet.
              </p>
              <button
                onClick={() => onNavigate('requirements/new')}
                style={{
                  marginTop: '12px',
                  backgroundColor: 'var(--brand-blue)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Post Your First Requirement
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myRequirements.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  onClick={() => onNavigate('requirements/detail', req.id)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-blue)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {req.crop_name}
                      </span>
                      <Badge variant={req.status === 'ACTIVE' ? 'green' : 'amber'}>
                        {req.status}
                      </Badge>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <span>Demand: <strong>{req.required_quantity} {req.unit}</strong></span>
                      <span>·</span>
                      <span>Delivery: {req.delivery_location || req.delivery_district}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {req.max_price_per_unit ? `Max ₹${req.max_price_per_unit}/${req.unit}` : 'Negotiable'}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        By {req.required_by_date}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'var(--brand-blue-light)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--brand-blue)',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Sparkles size={12} />
                      <span>Matches</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
