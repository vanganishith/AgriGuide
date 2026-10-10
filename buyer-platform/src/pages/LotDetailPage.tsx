import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Scale, 
  Tag, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  Building,
  Info,
  Send,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import type { SellingLot } from '../types/marketplace';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';
import { MakeOfferModal } from '../components/marketplace/MakeOfferModal';

interface LotDetailPageProps {
  lotId: string;
  onBack: () => void;
  onNavigate: (route: string, param?: string) => void;
}

export const LotDetailPage: React.FC<LotDetailPageProps> = ({ lotId, onBack, onNavigate }) => {
  const [lot, setLot] = useState<SellingLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);

  useEffect(() => {
    async function loadLotDetail() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await api.getSellingLotById(lotId);
        setLot(data.lot);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load produce lot.');
      } finally {
        setLoading(false);
      }
    }

    if (lotId) {
      loadLotDetail();
    }
  }, [lotId]);

  if (loading) {
    return <LoadingSpinner message="Loading verified lot details..." />;
  }

  if (errorMsg || !lot) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{errorMsg || 'Produce lot not found.'}</p>
        <button
          onClick={onBack}
          style={{
            marginTop: '14px',
            backgroundColor: 'var(--brand-blue)',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '6px 0',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Marketplace</span>
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left: Detailed Lot Specs */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: '28px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Badge variant="green">{lot.status}</Badge>
              {lot.quality_grade && <Badge variant="blue">{lot.quality_grade}</Badge>}
              <Badge variant="neutral">Lot #{lot.id.slice(0, 8)}</Badge>
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              {lot.crop_name}
            </h1>
            {lot.variety && (
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 600, margin: '4px 0 0 0' }}>
                Variety: {lot.variety}
              </p>
            )}
          </div>

          {/* Key Pricing & Stock Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Available Volume
              </span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                {lot.available_quantity} <span style={{ fontSize: '14px', fontWeight: 700 }}>{lot.unit}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Total harvest: {lot.total_quantity} {lot.unit}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Farmer Asking Rate
              </span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: lot.is_open_to_offers ? 'var(--brand-blue)' : 'var(--accent-green)', marginTop: '2px' }}>
                {lot.is_open_to_offers ? 'Open to Offers' : `₹${lot.asking_price_per_unit}`}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {lot.is_open_to_offers ? 'Flexible price terms' : `per ${lot.unit}`}
              </span>
            </div>
          </div>

          {/* Detailed Specifications */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Produce Specifications & Quality
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>Quality Grade:</span>
                <strong>{lot.quality_grade || 'Standard Farmer Grade'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>Expected Ready Date:</span>
                <strong>{lot.expected_availability_date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>Pickup / Farm Region:</span>
                <strong>{lot.approx_location}, {lot.district}, {lot.state}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>Listing Status:</span>
                <strong style={{ color: 'var(--accent-green)' }}>Active in Marketplace</strong>
              </div>
            </div>
          </div>

          {/* Quality Details Text */}
          {lot.quality_details && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Farmer Inspection Notes
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, backgroundColor: '#FAFBF7', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                {lot.quality_details}
              </p>
            </div>
          )}
        </div>

        {/* Right: Procurement Action & Trust Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Box */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Direct Negotiation & Bidding
            </h3>

            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Submit a formal purchase bid with custom volume, pricing, and logistics terms directly to the producer in <strong>{lot.district}</strong>.
            </div>

            <button
              onClick={() => setShowOfferModal(true)}
              style={{
                backgroundColor: 'var(--brand-blue)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Send size={16} />
              <span>Make Purchase Offer</span>
            </button>

            <button
              onClick={() => onNavigate('requirements/new')}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Post Requirement for Bulk Sourcing
            </button>
          </div>

          {/* Trust & Compliance Guardrails */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>
              <ShieldCheck size={16} color="var(--accent-green)" />
              <span>AgriGuide Verified Listing</span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.4 }}>
              • Sourced from confirmed farm cultivation records in {lot.district}.
            </p>
            <p style={{ margin: 0, lineHeight: 1.4 }}>
              • Exact contact information is protected until negotiation confirmation.
            </p>
            <p style={{ margin: 0, lineHeight: 1.4 }}>
              • Atomic inventory locking ensures zero overselling upon acceptance.
            </p>
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <MakeOfferModal
          lot={lot}
          onClose={() => setShowOfferModal(false)}
          onSuccess={(offerId) => {
            setShowOfferModal(false);
            onNavigate('offers/detail', offerId);
          }}
        />
      )}
    </div>
  );
};
