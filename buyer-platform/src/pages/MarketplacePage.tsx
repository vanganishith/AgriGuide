import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Tag, 
  RotateCcw, 
  ArrowUpDown, 
  Layers,
  ChevronRight,
  PackageCheck,
  Sparkles
} from 'lucide-react';
import { BuyerAPI } from '../services/api';
import type { SellingLot } from '../types/marketplace';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { sortLotsByBuyerPreferences, getLotPreferenceRank } from '../utils/cropPreferences';

interface MarketplacePageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const [lots, setLots] = useState<SellingLot[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
  const [searchCrop, setSearchCrop] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [minQty, setMinQty] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [qualityGrade, setQualityGrade] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('preferred');

  const loadLots = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await BuyerAPI.getSellingLots({
        crop: searchCrop,
        state: selectedState,
        district: selectedDistrict,
        minQty: minQty ? Number(minQty) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        qualityGrade,
        sort: sortBy,
      });

      let fetchedLots = data.lots || [];
      if (sortBy === 'preferred') {
        fetchedLots = sortLotsByBuyerPreferences(fetchedLots, profile?.preferred_crops);
      }

      setLots(fetchedLots);
      setTotalCount((data as any).totalCount || data.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load produce listings.');
    } finally {
      setLoading(false);
    }
  }, [searchCrop, selectedState, selectedDistrict, minQty, maxPrice, qualityGrade, sortBy, profile?.preferred_crops]);

  useEffect(() => {
    loadLots();
  }, [loadLots]);

  const handleResetFilters = () => {
    setSearchCrop('');
    setSelectedState('');
    setSelectedDistrict('');
    setMinQty('');
    setMaxPrice('');
    setQualityGrade('');
    setSortBy(profile?.preferred_crops?.length ? 'preferred' : 'newest');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            Available Produce Marketplace
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Verified agricultural commodity lots published directly by farmers across Telangana & AP.
          </p>
        </div>

        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
          Showing <strong>{lots.length}</strong> active lots
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '12px' }}
            />
            <input
              type="text"
              placeholder="Search by crop name (e.g. Cotton, Chilli, Paddy)..."
              value={searchCrop}
              onChange={(e) => setSearchCrop(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              fontSize: '13px',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-primary)',
              minWidth: '140px',
            }}
          >
            <option value="">All States</option>
            <option value="Telangana">Telangana</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
          </select>

          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              fontSize: '13px',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-primary)',
              minWidth: '150px',
            }}
          >
            <option value="">All Districts</option>
            <option value="Warangal">Warangal</option>
            <option value="Hanamkonda">Hanamkonda</option>
            <option value="Khammam">Khammam</option>
            <option value="Karimnagar">Karimnagar</option>
            <option value="Nalgonda">Nalgonda</option>
            <option value="Medchal">Medchal</option>
            <option value="Guntur">Guntur</option>
            <option value="Kurnool">Kurnool</option>
          </select>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <ArrowUpDown size={15} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                fontSize: '13px',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}
            >
              <option value="preferred">⭐ My Preferences (Profile)</option>
              <option value="newest">Recently Published</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="quantity_high">Highest Quantity</option>
              <option value="available_soon">Available Soonest</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Min Quantity:</span>
            <input
              type="number"
              placeholder="e.g. 10"
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              style={{
                width: '80px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                fontSize: '12px',
              }}
            />
            <span>Quintals</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Max Price:</span>
            <input
              type="number"
              placeholder="e.g. 7500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{
                width: '90px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                fontSize: '12px',
              }}
            />
            <span>₹/Quintal</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Quality:</span>
            <select
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                fontSize: '12px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="">Any Grade</option>
              <option value="Grade A">Grade A</option>
              <option value="Grade B">Grade B</option>
              <option value="FAQ">FAQ Standard</option>
            </select>
          </div>

          <button
            onClick={handleResetFilters}
            style={{
              marginLeft: 'auto',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* 3. Produce Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Searching verified produce listings..." />
      ) : errorMsg ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--accent-red)' }}>
          {errorMsg}
        </div>
      ) : lots.length === 0 ? (
        <EmptyState
          title="No Matching Produce Found"
          description="There are currently no active farmer selling lots matching your criteria. Try adjusting your filters or post a buying requirement to alert matching farmers."
          actionText="Post a Buying Requirement"
          onAction={() => onNavigate('requirements/new')}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '18px',
          }}
        >
          {lots.map((lot) => (
            <div
              key={lot.id}
              onClick={() => onNavigate('marketplace/detail', lot.id)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-blue)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
            >
              <div>
                {/* Header: Crop & Grade */}
                {(() => {
                  const { rank } = getLotPreferenceRank(lot, profile?.preferred_crops);
                  const isPreferred = rank < 9999;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                            {lot.crop_name}
                          </h3>
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
                        {lot.variety && (
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                            {lot.variety}
                          </span>
                        )}
                      </div>

                      {lot.quality_grade && (
                        <Badge variant="green">{lot.quality_grade}</Badge>
                      )}
                    </div>
                  );
                })()}

                {/* Main Specs: Quantity & Price */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    margin: '14px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                      Available Quantity
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {lot.available_quantity} {lot.unit}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                      Asking Price
                    </span>
                    {lot.is_open_to_offers ? (
                      <Badge variant="blue">Open to Offers</Badge>
                    ) : (
                      <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-green)' }}>
                        ₹{lot.asking_price_per_unit} <span style={{ fontSize: '12px', fontWeight: 600 }}>/{lot.unit}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Quality Notes */}
                {lot.quality_details && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      margin: '0 0 14px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    📝 {lot.quality_details}
                  </p>
                )}
              </div>

              {/* Footer: Location, Date & CTA */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <MapPin size={13} color="var(--brand-blue)" />
                    {lot.approx_location}, {lot.district}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                    <Calendar size={12} />
                    Ready: {lot.expected_availability_date}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    color: 'var(--brand-blue)',
                    fontWeight: 800,
                    fontSize: '12px',
                  }}
                >
                  <span>Inspect</span>
                  <ChevronRight size={15} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
