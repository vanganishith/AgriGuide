import React from 'react';

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'neutral' | 'yellow';
  size?: 'sm' | 'md';
}> = ({ children, variant = 'gray', size = 'sm' }) => {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    green: {
      bg: 'var(--accent-green-light)',
      text: 'var(--accent-green)',
      border: '#86EFAC',
    },
    blue: {
      bg: 'var(--brand-blue-light)',
      text: 'var(--brand-blue)',
      border: '#BAE6FD',
    },
    amber: {
      bg: 'var(--accent-amber-light)',
      text: 'var(--accent-amber)',
      border: '#FDE68A',
    },
    yellow: {
      bg: 'var(--accent-amber-light)',
      text: 'var(--accent-amber)',
      border: '#FDE68A',
    },
    red: {
      bg: 'var(--accent-red-light)',
      text: 'var(--accent-red)',
      border: '#FECACA',
    },
    gray: {
      bg: 'var(--bg-subtle)',
      text: 'var(--text-secondary)',
      border: 'var(--border-default)',
    },
    neutral: {
      bg: 'var(--bg-subtle)',
      text: 'var(--text-secondary)',
      border: 'var(--border-default)',
    },
  };

  const current = styles[variant] || styles.gray;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: current.bg,
        color: current.text,
        border: `1px solid ${current.border}`,
        borderRadius: 'var(--radius-full)',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
};
