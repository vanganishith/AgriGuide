import React, { useEffect, useState } from 'react';
import { Offer } from '../types/marketplace';
import { api } from '../services/api';
import {
  Handshake,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  MapPin,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

interface OffersPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const OffersPage: React.FC<OffersPageProps> = ({ onNavigate }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const loadOffers = async (tab: string = activeTab) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getBuyerOffers(tab);
      setOffers(res.offers || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers(activeTab);
  }, [activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="blue">Pending Farmer Response</Badge>;
      case 'COUNTERED':
        return <Badge variant="yellow">Counteroffer Received</Badge>;
      case 'ACCEPTED':
        return <Badge variant="green">Deal Accepted & Reserved</Badge>;
      case 'REJECTED':
        return <Badge variant="red">Rejected</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="neutral">Withdrawn</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
          Procurement Negotiations & Bids
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
          Active purchase offers, farmer counter-bids, and deal acceptance history.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'All Bids' },
          { key: 'COUNTERED', label: 'Counteroffers (Action Required)' },
          { key: 'PENDING', label: 'Pending Farmer' },
          { key: 'ACCEPTED', label: 'Accepted Deals' },
          { key: 'REJECTED', label: 'Rejected / Withdrawn' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: activeTab === tab.key ? '1px solid var(--brand-blue)' : '1px solid transparent',
              backgroundColor: activeTab === tab.key ? 'var(--brand-blue-light)' : 'transparent',
              color: activeTab === tab.key ? 'var(--brand-blue)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Offers List */}
      {loading ? (
        <LoadingSpinner message="Retrieving procurement negotiations..." />
      ) : errorMsg ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--accent-red)' }}>
          {errorMsg}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          title="No Offers Found in this Category"
          description="You currently have no active bids or negotiation records matching this filter. Browse verified produce listings or post a buying requirement to initiate direct farm procurement."
          actionText="Browse Available Produce"
          onAction={() => onNavigate('marketplace')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {offers.map((offer) => {
            const cropName = offer.selling_lots?.crop_name || 'Commodity Produce';
            const variety = offer.selling_lots?.variety;
            const effectivePrice = offer.status === 'COUNTERED' && offer.counter_price_per_unit
              ? offer.counter_price_per_unit
              : offer.proposed_price_per_unit;
            const effectiveQty = offer.status === 'COUNTERED' && offer.counter_quantity
              ? offer.counter_quantity
              : offer.proposed_quantity;

            const totalValue = effectivePrice * effectiveQty;
            const lastEvent = offer.timeline && offer.timeline.length > 0
              ? offer.timeline[offer.timeline.length - 1]
              : null;

            return (
              <div
                key={offer.id}
                onClick={() => onNavigate('offers/detail', offer.id)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1.5px solid ${offer.status === 'COUNTERED' ? 'rgba(234, 179, 8, 0.4)' : 'var(--border-default)'}`,
                  padding: '20px 24px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-blue)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = offer.status === 'COUNTERED' ? 'rgba(234, 179, 8, 0.4)' : 'var(--border-default)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {getStatusBadge(offer.status)}
                      {offer.initiated_by === 'FARMER' && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          border: '1px solid #86EFAC',
                          padding: '2px 8px',
                          borderRadius: '12px',
                        }}>
                          🤝 Farmer Match Request
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Offer #{offer.id.slice(0, 8)}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0 2px 0' }}>
                      {cropName} {variety ? `— ${variety}` : ''}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span>
                        Farmer: <strong>{offer.farmer_profile?.full_name || 'Producer'}</strong>
                      </span>
                      {offer.farmer_profile?.phone && (
                        <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                          📞 {offer.farmer_profile.phone}
                        </span>
                      )}
                      <span>
                        • in {offer.selling_lots?.district || offer.farmer_profile?.district || 'Warangal'}, {offer.selling_lots?.state || 'Telangana'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Overview */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                      {offer.status === 'COUNTERED' ? 'Counter-Rate' : 'Offered Rate'}
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-green)' }}>
                      ₹{effectivePrice} <span style={{ fontSize: '12px', fontWeight: 600 }}>/{offer.price_unit}</span>
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                      Total: <strong>₹{totalValue.toLocaleString('en-IN')}</strong> ({effectiveQty} {offer.price_unit})
                    </span>
                  </div>
                </div>

                {/* Latest Negotiation Step Note */}
                {lastEvent && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderLeft: `3px solid ${lastEvent.actor === 'FARMER' ? 'var(--brand-blue)' : 'var(--accent-green)'}`,
                    }}
                  >
                    <MessageSquare size={14} color="var(--brand-blue)" />
                    <span>
                      <strong>{lastEvent.actor === 'BUYER' ? 'You' : 'Farmer'}:</strong> {lastEvent.message || `Proposed ₹${lastEvent.price_per_unit}/${offer.price_unit}`}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(lastEvent.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Footer specs and action */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span>
                      Transport: <strong>{offer.transport_responsibility === 'buyer' ? 'Buyer Arranges' : 'Seller Delivery'}</strong>
                    </span>
                    <span>
                      Terms: <strong>{offer.payment_terms}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-blue)', fontWeight: 800 }}>
                    <span>Inspect Negotiation</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
