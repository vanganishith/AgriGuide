import React from 'react';
import { ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

export const BuyerFooter: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border-default)',
        padding: '32px 20px',
        marginTop: '60px',
        color: 'var(--text-secondary)',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>AgriGuide Market</span>
            <span>·</span>
            <span style={{ color: 'var(--text-muted)' }}>Dedicated Agricultural Buyer Ecosystem</span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>
            Direct procurement connecting wholesale buyers with verified farmer listings via shared Supabase architecture.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-green)' }}>
            <ShieldCheck size={16} />
            Verified Listings Only
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--brand-blue)' }}>
            <Database size={16} />
            Real Database Sync
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={16} />
            No Mock Inventories
          </span>
        </div>
      </div>
    </footer>
  );
};
