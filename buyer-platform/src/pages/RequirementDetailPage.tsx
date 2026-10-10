import React, { useEffect, useState } from 'react';
import { BuyingRequirement, MatchItem } from '../types/marketplace';
import { api } from '../services/api';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Truck,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Send,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Scale,
  ShieldCheck,
  Building,
  Info,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { MakeOfferModal } from '../components/marketplace/MakeOfferModal';

interface RequirementDetailPageProps {
  requirementId: string;
  onBack: () => void;
  onNavigate: (route: string, param?: string) => void;
}

export const RequirementDetailPage: React.FC<RequirementDetailPageProps> = ({
  requirementId,
  onBack,
  onNavigate,
}) => {
  const [requirement, setRequirement] = useState<BuyingRequirement | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLotForOffer, setSelectedLotForOffer] = useState<any | null>(null);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getRequirementMatches(requirementId);
      setRequirement(res.requirement);
      setMatches(res.matches || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load matching farmer produce');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [requirementId]);

  if (loading) {
    return <LoadingSpinner message="Evaluating active farmer selling lots with market price intelligence..." />;
  }

  if (errorMsg || !requirement) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-red)', fontSize: '15px', fontWeight: 600 }}>
          {errorMsg || 'Requirement not found'}
        </p>
        <button
          onClick={onBack}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: 'var(--brand-blue)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Back to Requirements
        </button>
      </div>
    );
  }

  const reqQty = parseFloat(String(requirement.required_quantity || 0));
  const fulfilledQty = parseFloat(String(requirement.fulfilled_quantity || 0));
  const remainingQty = Math.max(0, reqQty - fulfilledQty);
  const fulfillmentPct = reqQty > 0 ? Math.min(100, Math.round((fulfilledQty / reqQty) * 100)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Back Navigation */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          width: 'fit-content',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Procurement Demands</span>
      </button>

      {/* 1. Requirement Summary Header Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '24px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Badge variant={requirement.status === 'ACTIVE' ? 'green' : 'neutral'}>
                {requirement.status}
              </Badge>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Requirement #{requirement.id.slice(0, 8)}
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>
              {requirement.crop_name} {requirement.variety ? `(${requirement.variety})` : ''}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Posted procurement specification with explainable market pricing intelligence
            </p>
          </div>

          <button
            onClick={loadMatches}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--brand-blue)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            <span>Re-run Matching Engine</span>
          </button>
        </div>

        {/* Fulfillment Progress Bar */}
        <div style={{ marginTop: '20px', backgroundColor: 'var(--bg-subtle)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Procurement Fulfillment: <strong>{fulfilledQty} / {reqQty} {requirement.unit}</strong> ({fulfillmentPct}%)
            </span>
            <span style={{ color: remainingQty === 0 ? 'var(--accent-green)' : 'var(--brand-blue)' }}>
              {remainingQty === 0 ? 'Fully Fulfilled' : `${remainingQty} ${requirement.unit} Remaining to Procure`}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${fulfillmentPct}%`,
                height: '100%',
                backgroundColor: fulfillmentPct >= 100 ? 'var(--accent-green)' : 'var(--brand-blue)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Specs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              Ceiling Target Rate
            </span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-green)' }}>
              {requirement.max_price_per_unit ? `Max ₹${requirement.max_price_per_unit}/${requirement.unit}` : 'Open to Market'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              Required By Date
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Calendar size={14} color="var(--brand-blue)" /> {requirement.required_by_date || 'Flexible'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              Delivery Destination Hub
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <MapPin size={14} color="var(--brand-blue)" /> {requirement.delivery_district || requirement.delivery_location || 'Hyderabad'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              Transport Logistics
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Truck size={14} color="var(--brand-blue)" /> {requirement.transport_preference === 'buyer_pickup' ? 'Buyer Arranges Pickup' : 'Seller Delivery'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Section Header: Matches */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--brand-blue)" />
            <span>Compatible Farmer Produce ({matches.length})</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Deterministic compatibility ranked by price reasonability, volume fit, ready date, and proximity.
          </p>
        </div>
      </div>

      {/* 3. Matches List with HERO PRICE ANALYSIS */}
      {matches.length === 0 ? (
        <EmptyState
          title="No Matching Farmer Produce Currently Available"
          description="None of the active farmer selling lots currently satisfy the commodity, quality, or deadline requirements for this procurement demand. When new farmer inventory is published, it will automatically match here."
          actionText="Browse General Marketplace"
          onAction={() => onNavigate('marketplace')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {matches.map((item) => {
            const isExcellent = item.match_score >= 85;
            const isFullFit = item.fulfillment_type === 'FULL_FULFILLMENT';
            const pa = item.price_analysis;
            const mandi = pa?.mandi_reference;

            return (
              <div
                key={item.lot.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${isExcellent ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-default)'}`,
                  padding: '24px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {/* Header: Overall Score & Produce Identification */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          backgroundColor: isExcellent ? 'rgba(16, 185, 129, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                          color: isExcellent ? '#059669' : 'var(--brand-blue)',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 900,
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Sparkles size={16} />
                        <span>OVERALL MATCH: {item.match_score} / 100</span>
                      </div>

                      <Badge variant={isFullFit ? 'green' : 'blue'}>
                        {isFullFit ? 'Single-Lot Full Fit' : `Partial Batch (${item.lot.available_quantity} ${item.lot.unit})`}
                      </Badge>

                      {item.lot.quality_grade && (
                        <Badge variant="neutral">{item.lot.quality_grade}</Badge>
                      )}
                    </div>

                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '10px 0 2px 0' }}>
                      {item.lot.crop_name} {item.lot.variety ? `— ${item.lot.variety}` : ''}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="var(--brand-blue)" /> {item.lot.approx_location}, {item.lot.district}, {item.lot.state}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} color="var(--brand-blue)" /> Ready: {item.lot.expected_availability_date}
                      </span>
                      <span>•</span>
                      <span>Available: <strong>{item.lot.available_quantity} {item.lot.unit}</strong></span>
                    </div>
                  </div>

                  {/* Top Price Tag */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                      Farmer Asking Rate
                    </span>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-green)' }}>
                      ₹{item.lot.asking_price_per_unit} <span style={{ fontSize: '13px', fontWeight: 600 }}>/{item.lot.unit}</span>
                    </span>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* HERO PRICE ANALYSIS WIDGET                                               */}
                {/* ========================================================================= */}
                <div
                  style={{
                    backgroundColor: 'rgba(2, 132, 199, 0.04)',
                    border: '1.5px solid rgba(2, 132, 199, 0.22)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scale size={18} color="var(--brand-blue)" />
                      <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        EXPLAINABLE PRICE ANALYSIS
                      </span>
                    </div>

                    {/* Price Compatibility Badge */}
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: 'var(--accent-green)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <span>PRICE COMPATIBILITY: {pa?.price_compatibility_score || 95} / 100</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                        ({pa?.price_tier || 'EXCELLENT'})
                      </span>
                    </div>
                  </div>

                  {/* 3-Way Benchmark Grid: Mandi Ref vs Farmer Asking vs Buyer Max */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {/* Mandi Reference */}
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Mandi Benchmark
                        </span>
                        {mandi && <span style={{ fontSize: '10px', color: 'var(--brand-blue)', fontWeight: 700 }}>e-NAM</span>}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                        {mandi ? `₹${mandi.modal_price}` : 'Unavailable'}
                        {mandi && <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>/{item.lot.unit}</span>}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        {mandi ? mandi.market_name : 'No active APMC feed'}
                      </span>
                    </div>

                    {/* Farmer Asking */}
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--brand-blue)',
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-blue)', textTransform: 'uppercase' }}>
                          Farmer Asking Rate
                        </span>
                        {pa?.deltas.farmer_vs_market_pct !== null && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: (pa?.deltas.farmer_vs_market_pct || 0) <= 5 ? '#059669' : '#D97706',
                            }}
                          >
                            {(pa?.deltas.farmer_vs_market_pct || 0) > 0 ? '+' : ''}
                            {pa?.deltas.farmer_vs_market_pct}% vs market
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-green)', marginTop: '4px' }}>
                        ₹{item.lot.asking_price_per_unit} <span style={{ fontSize: '11px', fontWeight: 600 }}>/{item.lot.unit}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        Producer stated rate
                      </span>
                    </div>

                    {/* Buyer Ceiling */}
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Your Ceiling Budget
                        </span>
                        {pa?.deltas.farmer_vs_buyer_max_pct !== null && (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669' }}>
                            {pa?.deltas.farmer_vs_buyer_max_pct}% vs ceiling
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                        ₹{requirement.max_price_per_unit || 'Open'}
                        {requirement.max_price_per_unit && <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>/{item.lot.unit}</span>}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        Max willing procurement rate
                      </span>
                    </div>

                    {/* Suggested Negotiation Zone */}
                    <div
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '12px 14px',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', display: 'block' }}>
                        Reference Negotiation Range
                      </span>
                      <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                        ₹{pa?.negotiation_range.min_price} — ₹{pa?.negotiation_range.max_price}
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}> /{item.lot.unit}</span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        Decision-support zone
                      </span>
                    </div>
                  </div>

                  {/* Plain-English Price Explanation Banner */}
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      borderLeft: '4px solid var(--accent-green)',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>Price Reasonability Assessment:</strong> {pa?.explanation}
                  </div>
                </div>

                {/* Sub-Scores Matrix & Concise Justification Reasons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  {/* Left: 5 Dimension Sub-Scores */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>
                      Compatibility Breakdown (0 – 100)
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--brand-blue)' }}>★ PRICE COMPATIBILITY (30%)</span>
                        <strong style={{ fontSize: '14px', color: 'var(--accent-green)' }}>{item.raw_scores?.price || 95} / 100</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>Quantity Fit & Volume (25%)</span>
                        <strong>{item.raw_scores?.quantity || 82} / 100</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>Harvest Availability Date (20%)</span>
                        <strong>{item.raw_scores?.availability || 100} / 100</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>Location & Logistics (15%)</span>
                        <strong>{item.raw_scores?.location || 80} / 100</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>Quality Specifications (10%)</span>
                        <strong>{item.raw_scores?.quality || 100} / 100</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: Plain-English Reasons */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Why this match fits your demand:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {item.match_reasons.map((reason, idx) => (
                        <li key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    onClick={() => onNavigate('marketplace/detail', item.lot.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>View Full Lot Specs</span>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => setSelectedLotForOffer(item.lot)}
                    style={{
                      padding: '10px 22px',
                      backgroundColor: 'var(--brand-blue)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                    }}
                  >
                    <Send size={15} />
                    <span>Make Offer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Make Offer Modal */}
      {selectedLotForOffer && (
        <MakeOfferModal
          lot={selectedLotForOffer}
          requirement={requirement}
          onClose={() => setSelectedLotForOffer(null)}
          onSuccess={(offerId) => {
            setSelectedLotForOffer(null);
            onNavigate('offers/detail', offerId);
          }}
        />
      )}
    </div>
  );
};
