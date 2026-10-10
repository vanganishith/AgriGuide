import React, { useState } from 'react';
import { Building2, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [selectedBuyerId, setSelectedBuyerId] = useState('8de5c2e3-9052-462a-9e92-39b33983e8f1');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      id: '8de5c2e3-9052-462a-9e92-39b33983e8f1',
      name: 'Joshua Hotels',
      type: 'Restaurant & Bulk Catering Business',
      location: 'Adilabad / Hyderabad',
    },
    {
      id: '8e88b099-bbe0-4c41-81be-05a9caeee625',
      name: 'Shanthan Retailers',
      type: 'Retail Commodity Chain',
      location: 'Uppal, Hyderabad, Medchal',
    },
  ];

  const handleLogin = async (id: string) => {
    setLoading(true);
    try {
      await login(id);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '60px auto',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--brand-blue)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
          }}
        >
          <Building2 size={24} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
          AgriGuide Market Portal
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
          Sign in to your verified procurement account
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Select Verified Enterprise Account:
        </span>

        {demoAccounts.map((acc) => {
          const isSelected = selectedBuyerId === acc.id;
          return (
            <div
              key={acc.id}
              onClick={() => setSelectedBuyerId(acc.id)}
              style={{
                border: isSelected ? '2px solid var(--brand-blue)' : '1px solid var(--border-default)',
                backgroundColor: isSelected ? 'var(--brand-blue-light)' : '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {acc.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {acc.type} · {acc.location}
                </div>
              </div>

              {isSelected && <UserCheck size={18} color="var(--brand-blue)" />}
            </div>
          );
        })}
      </div>

      <button
        disabled={loading}
        onClick={() => handleLogin(selectedBuyerId)}
        style={{
          backgroundColor: 'var(--brand-blue)',
          color: '#FFFFFF',
          border: 'none',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          fontWeight: 800,
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span>{loading ? 'Authenticating...' : 'Enter Marketplace'}</span>
        <ArrowRight size={16} />
      </button>

      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          justifyContent: 'center',
        }}
      >
        <ShieldCheck size={14} color="var(--accent-green)" />
        <span>Connected to Shared Supabase Auth Infrastructure</span>
      </div>
    </div>
  );
};
