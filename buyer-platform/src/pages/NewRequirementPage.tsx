import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FilePlus2, 
  Sparkles, 
  Check, 
  AlertCircle,
  Truck,
  Calendar,
  Building,
  Scale
} from 'lucide-react';
import { api } from '../services/api';

interface NewRequirementPageProps {
  onBack: () => void;
  onNavigate: (route: string) => void;
}

export const NewRequirementPage: React.FC<NewRequirementPageProps> = ({ onBack, onNavigate }) => {
  const [cropName, setCropName] = useState('Cotton');
  const [customCrop, setCustomCrop] = useState('');
  const [variety, setVariety] = useState('');
  const [requiredQuantity, setRequiredQuantity] = useState('');
  const [unit, setUnit] = useState('quintal');
  const [maxPrice, setMaxPrice] = useState('');
  const [requiredByDate, setRequiredByDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [deliveryLocation, setDeliveryLocation] = useState('Sanath Nagar Industrial Area');
  const [deliveryDistrict, setDeliveryDistrict] = useState('Hyderabad');
  const [deliveryState, setDeliveryState] = useState('Telangana');
  const [preferredRadiusKm, setPreferredRadiusKm] = useState('150');
  const [qualityRequirements, setQualityRequirements] = useState('');
  const [transportPreference, setTransportPreference] = useState('buyer_arranged');
  const [paymentPreferences, setPaymentPreferences] = useState('Payment upon delivery and weighing');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const resolvedCrop = cropName === 'Other' ? customCrop.trim() : cropName;
    if (!resolvedCrop) {
      setErrorMsg('Please specify the crop commodity.');
      return;
    }

    const qty = Number(requiredQuantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Please enter a valid positive quantity.');
      return;
    }

    if (!requiredByDate) {
      setErrorMsg('Please specify the required by delivery date.');
      return;
    }

    if (!deliveryLocation.trim()) {
      setErrorMsg('Please specify the delivery / destination location.');
      return;
    }

    setLoading(true);
    try {
      await api.createBuyingRequirement({
        crop_name: resolvedCrop,
        variety: variety.trim() || undefined,
        requiredQuantity: qty,
        unit,
        maxPricePerUnit: maxPrice ? Number(maxPrice) : null,
        requiredByDate,
        deliveryLocation: deliveryLocation.trim(),
        deliveryDistrict: deliveryDistrict.trim(),
        deliveryState: deliveryState.trim(),
        preferredRadiusKm: Number(preferredRadiusKm) || 150,
        qualityRequirements: qualityRequirements.trim() || undefined,
        transportPreference,
        paymentPreferences,
        notes: notes.trim() || undefined,
      });

      onNavigate('requirements');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish requirement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          <span>Back to Requirements</span>
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-blue)',
            }}
          >
            <FilePlus2 size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Post Buying Requirement
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Broadcast your procurement demand to registered farmers and aggregators.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: 'var(--accent-red-light)',
              color: 'var(--accent-red)',
              border: '1px solid #FECACA',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              margin: '18px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          {/* Section 1: Commodity Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              1. Commodity Specifications
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Crop Commodity *
                </label>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Cotton">Cotton (పత్తి / कपास)</option>
                  <option value="Chilli">Chilli (మిరప / मिर्च)</option>
                  <option value="Paddy">Paddy / Rice (వరి / धान)</option>
                  <option value="Maize">Maize (మొక్కజొన్న / मक्का)</option>
                  <option value="Soybean">Soybean (సోయాబీన్ / सोयाबीन)</option>
                  <option value="Wheat">Wheat (గోధుమ / गेहूं)</option>
                  <option value="Groundnut">Groundnut (వేరుశనగ / मूंगफली)</option>
                  <option value="Other">Other Commodity</option>
                </select>
              </div>

              {cropName === 'Other' ? (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Specify Commodity Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Turmeric, Pulses..."
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Preferred Variety / Subtype
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bt Hybrid, Long Staple, Teja..."
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Required Quantity *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="quintal">Quintals (q)</option>
                  <option value="metric_ton">Metric Tons (MT)</option>
                  <option value="kg">Kilograms (kg)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Max Willing Price (₹ / {unit})
                </label>
                <input
                  type="number"
                  placeholder="Optional max ceiling budget"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Logistics & Schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              2. Logistics & Delivery Schedule
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Required By Date *
                </label>
                <input
                  type="date"
                  value={requiredByDate}
                  onChange={(e) => setRequiredByDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Delivery State
                </label>
                <select
                  value={deliveryState}
                  onChange={(e) => setDeliveryState(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Telangana">Telangana</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Delivery District
                </label>
                <input
                  type="text"
                  value={deliveryDistrict}
                  onChange={(e) => setDeliveryDistrict(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Delivery Address / Destination Hub *
              </label>
              <input
                type="text"
                placeholder="e.g. Warehouse #4, Sanath Nagar Industrial Area, Hyderabad"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Transport Preference
                </label>
                <select
                  value={transportPreference}
                  onChange={(e) => setTransportPreference(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="buyer_arranged">Buyer Arranges Pickup (Ex-Farm)</option>
                  <option value="farmer_delivery">Farmer Arranges Delivery to Warehouse</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Max Procurement Radius (km)
                </label>
                <input
                  type="number"
                  value={preferredRadiusKm}
                  onChange={(e) => setPreferredRadiusKm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Quality & Terms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              3. Quality & Payment Terms
            </h4>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Quality & Moisture Specifications
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Moisture < 8%, Staple length >= 29mm, Clean without extraneous matter..."
                value={qualityRequirements}
                onChange={(e) => setQualityRequirements(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Payment Terms Preference
              </label>
              <input
                type="text"
                value={paymentPreferences}
                onChange={(e) => setPaymentPreferences(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: 'var(--brand-blue)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 28px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 800,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {loading ? 'Publishing Requirement...' : 'Publish Buying Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
