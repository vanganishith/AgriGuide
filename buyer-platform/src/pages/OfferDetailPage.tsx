import React, { useEffect, useState } from 'react';
import { Offer, NegotiationEvent } from '../types/marketplace';
import { api } from '../services/api';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface OfferDetailPageProps {
  offerId: string;
  onBack: () => void;
  onNavigate: (route: string, param?: string) => void;
}

export const OfferDetailPage: React.FC<OfferDetailPageProps> = ({
  offerId,
  onBack,
  onNavigate,
}) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Counteroffer state form
  const [showCounterForm, setShowCounterForm] = useState<boolean>(false);
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [counterQty, setCounterQty] = useState<string>('');
  const [counterNotes, setCounterNotes] = useState<string>('');

  const loadOffer = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getOfferById(offerId);
      setOffer(res.offer);

      const effectiveP = res.offer.status === 'COUNTERED' && res.offer.counter_price_per_unit
        ? res.offer.counter_price_per_unit
        : res.offer.proposed_price_per_unit;
      const effectiveQ = res.offer.status === 'COUNTERED' && res.offer.counter_quantity
        ? res.offer.counter_quantity
        : res.offer.proposed_quantity;

      setCounterPrice(String(effectiveP));
      setCounterQty(String(effectiveQ));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load offer negotiation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffer();
  }, [offerId]);

  const handleAcceptDeal = async () => {
    if (!window.confirm('Are you sure you want to accept this deal? This will lock in terms and reserve the farm inventory.')) {
      return;
    }

    try {
      setActionLoading(true);
      setErrorMsg(null);
      const res = await api.acceptOffer(offerId, 'BUYER');
      setActionSuccessMsg('Deal Accepted! Produce inventory has been atomically reserved for your account.');
      await loadOffer();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept offer. Check inventory availability.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDeal = async () => {
    const reason = window.prompt('Please enter a reason for rejecting this offer (optional):');
    if (reason === null) return;

    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.rejectOffer(offerId, reason, 'BUYER');
      setActionSuccessMsg('Offer rejected.');
      await loadOffer();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject offer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawDeal = async () => {
    if (!window.confirm('Are you sure you want to withdraw your offer?')) return;

    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.withdrawOffer(offerId, 'Withdrawn by buyer');
      setActionSuccessMsg('Offer withdrawn successfully.');
      await loadOffer();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to withdraw offer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(counterPrice);
    const q = parseFloat(counterQty);

    if (!p || p <= 0) {
      setErrorMsg('Please specify a valid counter-rate');
      return;
    }
    if (!q || q <= 0) {
      setErrorMsg('Please specify a valid quantity');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.submitCounterOffer(offerId, {
        counter_price_per_unit: p,
        counter_quantity: q,
        counter_notes: counterNotes.trim() || undefined,
        actor: 'BUYER',
      });
      setActionSuccessMsg('Counteroffer transmitted to farmer.');
      setShowCounterForm(false);
      await loadOffer();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to transmit counteroffer');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading negotiation timeline and farm inventory status..." />;
  }

  if (errorMsg && !offer) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-red)', fontSize: '15px', fontWeight: 600 }}>{errorMsg}</p>
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
          Back to Offers
        </button>
      </div>
    );
  }

  if (!offer) return null;

  const lot = offer.selling_lots;
  const req = offer.buying_requirements;
  const effectivePrice = offer.status === 'COUNTERED' && offer.counter_price_per_unit
    ? offer.counter_price_per_unit
    : offer.proposed_price_per_unit;
  const effectiveQty = offer.status === 'COUNTERED' && offer.counter_quantity
    ? offer.counter_quantity
    : offer.proposed_quantity;
  const totalVal = effectivePrice * effectiveQty;

  const timeline = offer.timeline || [];
  const isAccepted = offer.status === 'ACCEPTED';
  const isClosed = isAccepted || offer.status === 'REJECTED' || offer.status === 'WITHDRAWN' || offer.status === 'EXPIRED';
  const lastEvent = timeline.length > 0 ? timeline[timeline.length - 1] : null;
  const isFarmerCounterPending = offer.status === 'COUNTERED' && lastEvent?.actor === 'FARMER';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Button */}
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
        <span>Back to Negotiations List</span>
      </button>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-green)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--accent-red)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 0. DEAL AGREED HERO SHOWCASE (When Accepted) */}
      {isAccepted && (
        <div
          data-testid="deal-agreed-hero"
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 28px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(6, 78, 59, 0.25)',
            border: '2px solid #10B981',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: '#10B981', color: '#FFFFFF', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} />
                <span>DEAL AGREED</span>
              </div>
              <span style={{ fontSize: '13px', opacity: 0.9 }}>Negotiation #{offer.id.slice(0, 8)} • Transaction Locked</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
              Status: <span style={{ color: '#6EE7B7' }}>Agreed</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.75, display: 'block', fontWeight: 700 }}>Produce</span>
              <span style={{ fontSize: '18px', fontWeight: 900 }}>{lot?.crop_name || 'Commodity'} {lot?.variety ? `(${lot.variety})` : ''}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.75, display: 'block', fontWeight: 700 }}>Agreed Quantity</span>
              <span style={{ fontSize: '18px', fontWeight: 900 }}>{effectiveQty} {offer.price_unit}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.75, display: 'block', fontWeight: 700 }}>Agreed Rate</span>
              <span style={{ fontSize: '18px', fontWeight: 900 }}>₹{effectivePrice.toLocaleString('en-IN')} / {offer.price_unit}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.75, display: 'block', fontWeight: 700 }}>Total Agreed Valuation</span>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#A7F3D0' }}>₹{totalVal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Deal Header Overview Card */}
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
              <Badge
                variant={
                  offer.status === 'ACCEPTED'
                    ? 'green'
                    : offer.status === 'COUNTERED'
                    ? 'yellow'
                    : offer.status === 'REJECTED'
                    ? 'red'
                    : 'blue'
                }
              >
                {offer.status}
              </Badge>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Negotiation #{offer.id.slice(0, 8)}
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>
              {lot?.crop_name || 'Produce'} {lot?.variety ? `(${lot.variety})` : ''}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Farmer Supply in {lot?.approx_location || 'Telangana'}, {lot?.district || 'Warangal'}
            </p>
          </div>

          {/* Current Deal Valuation */}
          <div
            style={{
              backgroundColor: isAccepted ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-subtle)',
              border: `1px solid ${isAccepted ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-default)'}`,
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'right',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              {isAccepted ? 'Agreed Deal Value' : 'Current Active Term Value'}
            </span>
            <span style={{ fontSize: '22px', fontWeight: 900, color: isAccepted ? 'var(--accent-green)' : 'var(--text-primary)' }}>
              ₹{totalVal.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
              ₹{effectivePrice}/{offer.price_unit} × {effectiveQty} {offer.price_unit}
            </span>
          </div>
        </div>

        {/* Key Logistics & Terms Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '13px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Logistics Preference
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Truck size={14} color="var(--brand-blue)" />
              {offer.pickup_delivery_preference === 'pickup_at_farm' ? 'Farm Gate Pickup' : 'Destination Delivery'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Transport Paid By
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', display: 'block' }}>
              {offer.transport_responsibility === 'buyer' ? 'Buyer Arranges & Pays' : 'Farmer Delivery'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Payment Terms
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', display: 'block' }}>
              {offer.payment_terms}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Target Availability
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Calendar size={14} color="var(--brand-blue)" /> {offer.expected_date || lot?.expected_availability_date || 'Immediate'}
            </span>
          </div>
        </div>

        {/* Direct Farmer Contact & Match Request Banner */}
        <div
          style={{
            marginTop: '20px',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            border: '1.5px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase' }}>
                🌾 Direct Farmer Producer Details
              </span>
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
                  🤝 Direct Farmer Match Request
                </span>
              )}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
              {offer.farmer_profile?.full_name || 'Farmer Producer'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Direct Phone: <strong style={{ color: 'var(--text-primary)' }}>+91 {offer.farmer_profile?.phone || '9367025781'}</strong>
              {offer.farmer_profile?.district && ` • Location: ${offer.farmer_profile.district}, ${offer.farmer_profile.state || 'Telangana'}`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a
              href={`tel:${offer.farmer_profile?.phone || '9367025781'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: 'var(--accent-green)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '13px',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
              }}
            >
              <span>📞</span>
              <span>Call Farmer ({offer.farmer_profile?.phone || '9367025781'})</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Interactive Action Panel (When Action Required) */}
      {!isClosed && (
        <div
          style={{
            backgroundColor: isFarmerCounterPending ? 'rgba(234, 179, 8, 0.08)' : 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: `1.5px solid ${isFarmerCounterPending ? 'rgba(234, 179, 8, 0.35)' : 'var(--border-default)'}`,
            padding: '20px 24px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {isFarmerCounterPending
                  ? 'Farmer Counteroffer Received — Action Required'
                  : 'Offer Pending Farmer Consideration'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                {isFarmerCounterPending
                  ? `Farmer proposed ₹${offer.counter_price_per_unit}/${offer.price_unit} for ${offer.counter_quantity} ${offer.price_unit}. You can accept, submit a counter-bid, or decline.`
                  : 'Your proposed offer has been transmitted. You can adjust your terms or withdraw prior to farmer response.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {isFarmerCounterPending && (
                <button
                  onClick={handleAcceptDeal}
                  disabled={actionLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'var(--accent-green)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Accept Farmer Counteroffer</span>
                </button>
              )}

              <button
                onClick={() => setShowCounterForm(!showCounterForm)}
                disabled={actionLoading}
                style={{
                  padding: '10px 18px',
                  backgroundColor: showCounterForm ? 'var(--bg-subtle)' : 'var(--brand-blue)',
                  color: showCounterForm ? 'var(--text-primary)' : '#FFFFFF',
                  border: showCounterForm ? '1px solid var(--border-default)' : 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={15} />
                <span>{showCounterForm ? 'Cancel Edit' : 'Propose Counter-Rate'}</span>
              </button>

              <button
                onClick={handleRejectDeal}
                disabled={actionLoading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: 'var(--accent-red)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Decline / Reject
              </button>

              {offer.status === 'PENDING' && (
                <button
                  onClick={handleWithdrawDeal}
                  disabled={actionLoading}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Withdraw Bid
                </button>
              )}
            </div>
          </div>

          {/* Counter Form Accordion */}
          {showCounterForm && (
            <form
              onSubmit={handleSendCounter}
              style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Specify New Counter Terms
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Counter Volume ({offer.price_unit}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={counterQty}
                    onChange={(e) => setCounterQty(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Counter Rate (₹ / {offer.price_unit}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Negotiation Note / Terms Rationale
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adjusted price factoring warehouse transit costs from Geesugonda."
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: 'var(--brand-blue)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Send size={14} />
                  <span>Transmit Counter-Bid</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Accepted Deal Banner */}
      {isAccepted && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', backgroundColor: '#FFFFFF', borderRadius: '50%', color: 'var(--accent-green)' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-green)', margin: 0 }}>
                Legally Bound & Inventory Reserved
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Atomic database transaction completed. Total volume of {effectiveQty} {offer.price_unit} is reserved. Phase 3 will handle electronic delivery notes and dispatch release.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Chronological Negotiation Timeline */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '24px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--brand-blue)" />
          <span>Negotiation History & Audit Trail ({timeline.length} Steps)</span>
        </h2>

        {timeline.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Initial offer record registered.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {timeline.map((evt: NegotiationEvent, idx: number) => {
              const isBuyer = evt.actor === 'BUYER';
              const isActionAccept = evt.action === 'ACCEPT';
              const isActionReject = evt.action === 'REJECT';

              return (
                <div
                  key={evt.event_id || idx}
                  style={{
                    backgroundColor: isActionAccept
                      ? 'rgba(16, 185, 129, 0.06)'
                      : isBuyer
                      ? 'var(--bg-subtle)'
                      : 'rgba(2, 132, 199, 0.05)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${
                      isActionAccept
                        ? 'rgba(16, 185, 129, 0.25)'
                        : isBuyer
                        ? 'var(--border-default)'
                        : 'rgba(2, 132, 199, 0.2)'
                    }`,
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant={isBuyer ? 'blue' : 'yellow'}>
                        {isBuyer ? 'Your Office (Buyer)' : 'Farmer (Producer)'}
                      </Badge>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {evt.action === 'OFFER'
                          ? 'Initial Purchase Bid'
                          : evt.action === 'COUNTER'
                          ? 'Counteroffer Proposal'
                          : evt.action === 'ACCEPT'
                          ? 'Deal Accepted'
                          : 'Declined / Rejected'}
                      </span>
                    </div>

                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {evt.price_per_unit && (
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700, marginTop: '4px' }}>
                      <span>Rate: <strong>₹{evt.price_per_unit} / {evt.unit || offer.price_unit}</strong></span>
                      {evt.quantity && <span>Volume: <strong>{evt.quantity} {evt.unit || offer.price_unit}</strong></span>}
                      {evt.price_per_unit && evt.quantity && (
                        <span>Valuation: <strong>₹{(evt.price_per_unit * evt.quantity).toLocaleString('en-IN')}</strong></span>
                      )}
                    </div>
                  )}

                  {evt.message && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      "{evt.message}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
