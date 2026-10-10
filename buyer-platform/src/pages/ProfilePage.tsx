import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  MapPin,
  Phone,
  FileCheck,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BuyerAPI } from '../services/api';
import { Badge } from '../components/common/Badge';

export const ProfilePage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [buyerType, setBuyerType] = useState('Wholesaler / Trader');
  const [state, setState] = useState('Telangana');
  const [district, setDistrict] = useState('Hyderabad');
  const [cityTown, setCityTown] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [preferredCrops, setPreferredCrops] = useState<string[]>(['Cotton', 'Paddy', 'Chilli']);
  const [typicalQty, setTypicalQty] = useState('10 - 100 quintals per order');
  const [paymentTerms, setPaymentTerms] = useState('50% advance on weighing, balance upon delivery');
  const [radiusKm, setRadiusKm] = useState(150);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '');
      setContactPerson(profile.contact_person || '');
      setMobileNumber(profile.mobile_number || '');
      setBuyerType(profile.buyer_type || 'Wholesaler / Trader');
      setState(profile.state || 'Telangana');
      setDistrict(profile.district || 'Hyderabad');
      setCityTown(profile.city_town || '');
      setBusinessAddress(profile.business_address || '');
      setGstin(profile.gstin || '');
      if (Array.isArray(profile.preferred_crops)) {
        setPreferredCrops(profile.preferred_crops);
      }
      setTypicalQty(profile.typical_quantity_range || '10 - 100 quintals per order');
      setPaymentTerms(profile.preferred_payment_terms || '50% advance on weighing, balance upon delivery');
      setRadiusKm(profile.preferred_procurement_radius_km || 150);
    }
  }, [profile]);

  const [customCropInput, setCustomCropInput] = useState('');

  const toggleCrop = (crop: string) => {
    if (preferredCrops.includes(crop)) {
      setPreferredCrops(preferredCrops.filter(c => c !== crop));
    } else {
      setPreferredCrops([...preferredCrops, crop]);
    }
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= preferredCrops.length) return;
    const updated = [...preferredCrops];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPreferredCrops(updated);
  };

  const addCustomCrop = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customCropInput.trim();
    if (trimmed && !preferredCrops.includes(trimmed)) {
      setPreferredCrops([...preferredCrops, trimmed]);
      setCustomCropInput('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!businessName.trim()) {
      setSaveError('Business Name is required.');
      return;
    }

    setSaving(true);
    try {
      await BuyerAPI.updateProfile({
        business_name: businessName.trim(),
        contact_person: contactPerson.trim(),
        mobile_number: mobileNumber.trim(),
        buyer_type: buyerType,
        state,
        district,
        city_town: cityTown.trim(),
        business_address: businessAddress.trim(),
        gstin: gstin.trim(),
        preferred_crops: preferredCrops,
        typical_quantity_range: typicalQty,
        preferred_payment_terms: paymentTerms,
        preferred_procurement_radius_km: Number(radiusKm) || 150,
      });

      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const cropOptions = ['Cotton', 'Paddy', 'Chilli', 'Maize', 'Soybean', 'Wheat', 'Groundnut', 'Red Gram', 'Turmeric'];

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
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
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Badge variant="blue">Procurement Account</Badge>
            {gstin && <Badge variant="green">GSTIN Verified</Badge>}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            {businessName || 'Buyer Enterprise Profile'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Manage your company details, GSTIN, preferred commodities, and procurement radius.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-green)', fontWeight: 700 }}>
          <ShieldCheck size={18} />
          <span>Supabase Synced</span>
        </div>
      </div>

      {saveSuccess && (
        <div
          style={{
            backgroundColor: 'var(--accent-green-light)',
            color: 'var(--accent-green)',
            border: '1px solid #86EFAC',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>Buyer profile updated successfully. All changes are live in the database.</span>
        </div>
      )}

      {saveError && (
        <div
          style={{
            backgroundColor: 'var(--accent-red-light)',
            color: 'var(--accent-red)',
            border: '1px solid #FECACA',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Profile Form */}
      <form
        onSubmit={handleSave}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}
      >
        {/* Section 1: Business Identity */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 14px 0' }}>
            1. Enterprise & Business Identity
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Business / Entity Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Hyderabad Agro Processors Ltd"
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
                Buyer Type
              </label>
              <select
                value={buyerType}
                onChange={(e) => setBuyerType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="Wholesaler / Trader">Wholesaler / Trader</option>
                <option value="Flour / Rice / Ginning Mill">Miller / Processor</option>
                <option value="Retailer">Retail Chain</option>
                <option value="Exporter">Commodity Exporter</option>
                <option value="Food Processing Entity">Food Processing</option>
                <option value="Restaurant or catering business">Catering / Bulk Buyer</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Contact Person Name
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
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
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. 9876543210"
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
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="36AAAAA0000A1Z5"
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

        {/* Section 2: Operating Location */}
        <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 14px 0' }}>
            2. Location & Procurement Radius
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Operating State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
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
                Base District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Hyderabad, Medchal, Warangal"
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
                Procurement Radius (km)
              </label>
              <input
                type="number"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
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

          <div style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Registered Business / Warehouse Address
            </label>
            <input
              type="text"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="e.g. Plot 45, IDA Sanath Nagar, Hyderabad"
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

        {/* Section 3: Commodity Preferences */}
        <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px 0' }}>
            3. Target Commodities & Payment Terms
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>
              Select Preferred Commodities (Tap to toggle)
            </label>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Produce feed prioritizes crops in this order
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {cropOptions.map((crop) => {
              const isSelected = preferredCrops.includes(crop);
              const rankIdx = preferredCrops.indexOf(crop);

              return (
                <button
                  type="button"
                  key={crop}
                  onClick={() => toggleCrop(crop)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: isSelected ? '1px solid #0284C7' : '1px solid var(--border-default)',
                    backgroundColor: isSelected ? 'var(--brand-blue-light)' : '#FFFFFF',
                    color: isSelected ? 'var(--brand-blue)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isSelected ? (
                    <span
                      style={{
                        backgroundColor: 'var(--brand-blue)',
                        color: '#FFFFFF',
                        borderRadius: '10px',
                        padding: '1px 5px',
                        fontSize: '10px',
                        fontWeight: 800,
                      }}
                    >
                      #{rankIdx + 1}
                    </span>
                  ) : null}
                  <span>{crop}</span>
                </button>
              );
            })}
          </div>

          {/* Active Priority Sequence Reorderer */}
          {preferredCrops.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                border: '1px solid var(--border-default)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="var(--brand-blue)" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Priority Order in Produce Feed
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Use arrows to adjust which crop appears first
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {preferredCrops.map((crop, idx) => (
                  <div
                    key={crop}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          backgroundColor: idx === 0 ? 'var(--brand-blue)' : '#E2E8F0',
                          color: idx === 0 ? '#FFFFFF' : '#475569',
                          fontWeight: 800,
                          fontSize: '11px',
                          borderRadius: '8px',
                          padding: '2px 7px',
                        }}
                      >
                        Priority #{idx + 1}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {crop}
                      </span>
                      {idx === 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 700 }}>
                          (Top Priority)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => movePriority(idx, 'up')}
                        disabled={idx === 0}
                        style={{
                          border: '1px solid var(--border-default)',
                          backgroundColor: idx === 0 ? '#F8FAFC' : '#FFFFFF',
                          color: idx === 0 ? '#CBD5E1' : '#334155',
                          borderRadius: '4px',
                          padding: '3px 7px',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Move Earlier in Feed"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePriority(idx, 'down')}
                        disabled={idx === preferredCrops.length - 1}
                        style={{
                          border: '1px solid var(--border-default)',
                          backgroundColor: idx === preferredCrops.length - 1 ? '#F8FAFC' : '#FFFFFF',
                          color: idx === preferredCrops.length - 1 ? '#CBD5E1' : '#334155',
                          borderRadius: '4px',
                          padding: '3px 7px',
                          cursor: idx === preferredCrops.length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Move Later in Feed"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCrop(crop)}
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--accent-red)',
                          padding: '3px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Remove Commodity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add custom commodity input */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            <input
              type="text"
              value={customCropInput}
              onChange={(e) => setCustomCropInput(e.target.value)}
              placeholder="Add another commodity (e.g. Mustard, Castor, Tomato)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomCrop();
                }
              }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                fontSize: '12px',
              }}
            />
            <button
              type="button"
              onClick={() => addCustomCrop()}
              style={{
                padding: '9px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Plus size={13} />
              <span>Add</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Typical Procurement Volume
              </label>
              <input
                type="text"
                value={typicalQty}
                onChange={(e) => setTypicalQty(e.target.value)}
                placeholder="e.g. 50 - 200 quintals per order"
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
                Default Payment Terms
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. 50% advance on weighing, balance on delivery"
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

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--brand-blue)',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 28px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 800,
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving to Database...' : 'Save Buyer Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
