import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string; size?: number }> = ({
  message = 'Loading marketplace data...',
  size = 28,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: '14px',
        color: 'var(--text-secondary)',
      }}
    >
      <Loader2
        size={size}
        color="var(--brand-blue)"
        style={{ animation: 'spin 1s linear infinite' }}
      />
      <span style={{ fontSize: '14px', fontWeight: 600 }}>{message}</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
