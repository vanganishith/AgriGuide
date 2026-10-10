import React, { useState } from 'react';
import { SellingLot, BuyingRequirement } from '../../types/marketplace';
import { api } from '../../services/api';
import { X, Send, ShieldCheck, AlertCircle, MapPin, Tag } from 'lucide-react';
import { Badge } from '../common/Badge';

interface MakeOfferModalProps {
  lot: SellingLot;
  requirement?: BuyingRequirement | null;
  onClose: () => void;
  onSuccess: (offerId: string) => void;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  lot,
  requirement,
  onClose,
  onSuccess,
}) => {
  const maxAvailable = lot.available_quantity;
  const remainingNeeded = requirement
    ? parseFloat(String(requirement.required_quantity || 0)) - parseFloat(String(requirement.fulfilled_quantity || 0))
    : maxAvailable;

  const defaultQty = Math.min(maxAvailable, remainingNeeded > 0 ? remainingNeeded : maxAvailable);

  const [quantity, setQuantity] = useState<string>(String(defaultQty));
  const [pricePerUnit, setPricePerUnit] = useState<string>(
    lot.asking_price_per_unit ? String(lot.asking_price_per_unit) : '7000'
  );
  const [transportResponsibility, setTransportResponsibility] = useState<'buyer' | 'farmer'>('buyer');
  const [pickupDeliveryPref, setPickupDeliveryPref] = useState<'pickup_at_farm' | 'delivery_to_buyer'>('pickup_at_farm');
  const [paymentTerms, setPaymentTerms] = useState<string>(
    '50% advance on weighment, 50% upon delivery receipt'
  );
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numQty = parseFloat(quantity) || 0;
  const numPrice = parseFloat(pricePerUnit) || 0;
  const totalValue = numQty * numPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (numQty <= 0) {
      setErrorMsg('Proposed quantity must be greater than zero.');
      return;
    }
    if (numQty > maxAvailable) {
      setErrorMsg(`Quantity cannot exceed available farm stock (${maxAvailable} ${lot.unit}).`);
      return;
    }
    if (requirement && remainingNeeded > 0 && numQty > remainingNeeded) {
      setErrorMsg(`Quantity cannot exceed remaining needed volume (${remainingNeeded} ${lot.unit}).`);
      return;
    }
    if (numPrice <= 0) {
      setErrorMsg('Proposed price per unit must be greater than zero.');
      return;
    }
    if (!paymentTerms.trim()) {
      setErrorMsg('Please specify payment terms for this transaction.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createOffer({
        selling_lot_id: lot.id,
        buying_requirement_id: requirement ? requirement.id : null,
        proposed_quantity: numQty,
        proposed_price_per_unit: numPrice,
        price_unit: lot.unit || 'quintal',
        pickup_delivery_preference: pickupDeliveryPref,
        transport_responsibility: transportResponsibility,
        payment_terms: paymentTerms,
        message: message.trim() || undefined,
        expected_date: lot.expected_availability_date,
      });

      onSuccess(res.offer.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit offer. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Submit Purchase Offer
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Direct procurement negotiation with registered farmer in {lot.district}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Lot Summary Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {lot.crop_name} {lot.variety ? `(${lot.variety})` : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={12} color="var(--brand-blue)" /> {lot.approx_location}, {lot.district}
                  </span>
                  <span>•</span>
                  <span>Available: <strong>{lot.available_quantity} {lot.unit}</strong></span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                  Asking Rate
                </span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-green)' }}>
                  ₹{lot.asking_price_per_unit} <span style={{ fontSize: '11px', fontWeight: 600 }}>/{lot.unit}</span>
                </span>
              </div>
            </div>

            {requirement && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--brand-blue)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Targeted Requirement: <strong>{requirement.crop_name} ({requirement.required_quantity} {requirement.unit})</strong></span>
                <span>Remaining: <strong>{remainingNeeded} {requirement.unit}</strong></span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--accent-red)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Volume and Rate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Offered Volume ({lot.unit}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                max={maxAvailable}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  fontSize: '14px',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Max available: {maxAvailable} {lot.unit}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Offered Rate (₹ / {lot.unit}) *
              </label>
              <input
                type="number"
                step="any"
                min="1"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  fontSize: '14px',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Farmer asking: ₹{lot.asking_price_per_unit}
              </span>
            </div>
          </div>

          {/* Calculated Offer Total Value */}
          <div
            style={{
              backgroundColor: 'rgba(2, 132, 199, 0.06)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase', display: 'block' }}>
                Total Proposed Transaction Value
              </span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>
                ₹{totalValue.toLocaleString('en-IN')}
              </span>
            </div>
            {lot.asking_price_per_unit > 0 && numPrice > 0 && (
              <Badge variant={numPrice >= lot.asking_price_per_unit ? 'green' : 'blue'}>
                {numPrice >= lot.asking_price_per_unit
                  ? 'At / Above Asking Rate'
                  : `${Math.round(((lot.asking_price_per_unit - numPrice) / lot.asking_price_per_unit) * 100)}% below asking`}
              </Badge>
            )}
          </div>

          {/* Logistics & Responsibility */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Transport Responsibility
              </label>
              <select
                value={transportResponsibility}
                onChange={(e) => setTransportResponsibility(e.target.value as 'buyer' | 'farmer')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="buyer">Buyer Arranges & Pays Transport</option>
                <option value="farmer">Farmer Arranges & Delivers to Buyer</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Fulfillment Mode
              </label>
              <select
                value={pickupDeliveryPref}
                onChange={(e) => setPickupDeliveryPref(e.target.value as 'pickup_at_farm' | 'delivery_to_buyer')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="pickup_at_farm">Ex-Farm Gate Pickup</option>
                <option value="delivery_to_buyer">Destination Delivery</option>
              </select>
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Payment Terms & Settlement *
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g. 50% on weighment, 50% upon delivery receipt"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Procurement Message / Special Terms
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. We require moisture certificate upon weighment. Ready for pickup within 24 hours of confirmation."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Footer Actions */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 22px',
                backgroundColor: 'var(--brand-blue)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 800,
                color: '#FFFFFF',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Send size={15} />
              <span>{loading ? 'Submitting Bid...' : 'Transmit Purchase Offer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
