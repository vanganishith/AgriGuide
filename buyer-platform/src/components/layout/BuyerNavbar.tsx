import React from 'react';
import { 
  Building2, 
  Store, 
  FileText, 
  PlusCircle, 
  User, 
  LogOut,
  Layers,
  Handshake
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BuyerNavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const BuyerNavbar: React.FC<BuyerNavbarProps> = ({ currentRoute, onNavigate }) => {
  const { profile, isAuthenticated, logout } = useAuth();

  const navItems = [
    { route: 'dashboard', label: 'Dashboard', icon: Layers },
    { route: 'marketplace', label: 'Available Produce', icon: Store },
    { route: 'requirements', label: 'Procurement Demands', icon: FileText },
    { route: 'offers', label: 'Bids & Deals', icon: Handshake },
  ];

  return (
    <header
      style={{
        backgroundColor: 'var(--brand-navy)',
        color: '#FFFFFF',
        borderBottom: '1px solid #334155',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 20px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--brand-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Building2 size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                AGRIGUIDE
              </span>
              <span
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                MARKET
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, display: 'block', marginTop: '-2px' }}>
              Institutional Buyer Portal
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? '#1E293B' : 'transparent',
                  color: isActive ? '#38BDF8' : '#CBD5E1',
                  border: isActive ? '1px solid #334155' : '1px solid transparent',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action & Profile Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate('requirements/new')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--brand-blue)',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
            }}
          >
            <PlusCircle size={15} />
            <span>Post Requirement</span>
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onNavigate('profile')}
                title="View Buyer Profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  color: '#F1F5F9',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <User size={14} color="#38BDF8" />
                <span>{profile?.business_name || 'Buyer Profile'}</span>
              </button>

              <button
                onClick={logout}
                title="Log Out"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #334155',
                  padding: '7px',
                  borderRadius: 'var(--radius-md)',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              style={{
                backgroundColor: '#1E293B',
                color: '#FFFFFF',
                border: '1px solid #334155',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
