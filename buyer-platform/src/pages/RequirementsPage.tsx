import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  PlusCircle, 
  Calendar, 
  MapPin, 
  Tag, 
  PauseCircle, 
  PlayCircle, 
  CheckCircle2, 
  XCircle,
  Truck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import type { BuyingRequirement } from '../types/marketplace';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';

interface RequirementsPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const RequirementsPage: React.FC<RequirementsPageProps> = ({ onNavigate }) => {
  const [requirements, setRequirements] = useState<BuyingRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadRequirements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getBuyingRequirements();
      setRequirements(res.requirements || []);
    } catch (err) {
      console.error('Failed to load requirements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  const handleStatusChange = async (id: string, newStatus: 'ACTIVE' | 'PAUSED' | 'CANCELLED') => {
    setActionLoadingId(id);
    try {
      const res = await api.updateRequirementStatus(id, newStatus);
      setRequirements(prev => prev.map(r => r.id === id ? res.requirement : r));
    } catch (err: any) {
      alert(err.message || 'Failed to update requirement status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequirements = requirements.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
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
            Procurement Demands & Buying Requirements
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Commodity volume, specifications, and maximum budgets published by your procurement office.
          </p>
        </div>

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
          <span>Post New Requirement</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-default)', paddingBottom: '10px' }}>
        {['ALL', 'ACTIVE', 'PAUSED', 'FULFILLED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: statusFilter === tab ? '1px solid #BAE6FD' : '1px solid transparent',
              backgroundColor: statusFilter === tab ? 'var(--brand-blue-light)' : 'transparent',
              color: statusFilter === tab ? 'var(--brand-blue)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab === 'ALL' ? `All (${requirements.length})` : tab}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner message="Loading procurement requirements..." />
      ) : filteredRequirements.length === 0 ? (
        <EmptyState
          title="No Buying Requirements Found"
          description="You do not have any requirements under this status. Post a new commodity requirement to broadcast your demand."
          actionText="Post New Requirement"
          onAction={() => onNavigate('requirements/new')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredRequirements.map((req) => {
            const isBusy = actionLoadingId === req.id;
            const reqQty = parseFloat(String(req.required_quantity || 0));
            const fulfilledQty = parseFloat(String(req.fulfilled_quantity || 0));
            const remainingQty = Math.max(0, reqQty - fulfilledQty);

            return (
              <div
                key={req.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  padding: '20px 24px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Badge variant={req.status === 'ACTIVE' ? 'green' : (req.status === 'PAUSED' ? 'amber' : 'neutral')}>
                      {req.status}
                    </Badge>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Posted on {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {req.crop_name} {req.variety && `(${req.variety})`}
                  </h3>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span>Target: <strong>{req.required_quantity} {req.unit}</strong></span>
                    <span>·</span>
                    <span>Fulfilled: <strong>{fulfilledQty} {req.unit}</strong> ({remainingQty} remaining)</span>
                    <span>·</span>
                    <span>Budget: <strong>{req.max_price_per_unit ? `₹${req.max_price_per_unit} / ${req.unit} max` : 'Open budget'}</strong></span>
                    <span>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} color="var(--brand-blue)" />
                      Required by: {req.required_by_date}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} />
                      Delivery: {req.delivery_location || req.delivery_district}, {req.delivery_district}
                    </span>
                    <span>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Truck size={13} />
                      {req.transport_preference === 'buyer_pickup' ? 'Buyer Arranges Transport' : 'Farmer Delivery Required'}
                    </span>
                  </div>

                  {req.quality_requirements && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Quality Specs:</strong> {req.quality_requirements}
                    </div>
                  )}
                </div>

                {/* Actions: Matching Produce & Status Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => onNavigate('requirements/detail', req.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--brand-blue)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Find Matching Produce</span>
                    <ArrowRight size={14} />
                  </button>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    {req.status === 'ACTIVE' && (
                      <button
                        disabled={isBusy}
                        onClick={() => handleStatusChange(req.id, 'PAUSED')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-default)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--accent-amber)',
                          cursor: isBusy ? 'wait' : 'pointer',
                        }}
                      >
                        <PauseCircle size={13} />
                        <span>Pause</span>
                      </button>
                    )}

                    {req.status === 'PAUSED' && (
                      <button
                        disabled={isBusy}
                        onClick={() => handleStatusChange(req.id, 'ACTIVE')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-default)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--accent-green)',
                          cursor: isBusy ? 'wait' : 'pointer',
                        }}
                      >
                        <PlayCircle size={13} />
                        <span>Activate</span>
                      </button>
                    )}

                    {req.status !== 'CANCELLED' && (
                      <button
                        disabled={isBusy}
                        onClick={() => handleStatusChange(req.id, 'CANCELLED')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-default)',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          cursor: isBusy ? 'wait' : 'pointer',
                        }}
                      >
                        <XCircle size={13} />
                        <span>Cancel</span>
                      </button>
                    )}
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
