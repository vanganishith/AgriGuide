import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { BuyerNavbar } from './components/layout/BuyerNavbar';
import { BuyerFooter } from './components/layout/BuyerFooter';
import { DashboardPage } from './pages/DashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { LotDetailPage } from './pages/LotDetailPage';
import { RequirementsPage } from './pages/RequirementsPage';
import { NewRequirementPage } from './pages/NewRequirementPage';
import { RequirementDetailPage } from './pages/RequirementDetailPage';
import { OffersPage } from './pages/OffersPage';
import { OfferDetailPage } from './pages/OfferDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';

const AppContent: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [routeParam, setRouteParam] = useState<string | null>(null);

  const handleNavigate = (route: string, param?: string) => {
    if (param) {
      setRouteParam(param);
      setCurrentRoute(route);
    } else {
      if (!route.includes('/detail')) {
        setRouteParam(null);
      }
      setCurrentRoute(route);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;

      case 'marketplace':
        return <MarketplacePage onNavigate={handleNavigate} />;

      case 'marketplace/detail':
        return routeParam ? (
          <LotDetailPage
            lotId={routeParam}
            onBack={() => handleNavigate('marketplace')}
            onNavigate={handleNavigate}
          />
        ) : (
          <MarketplacePage onNavigate={handleNavigate} />
        );

      case 'requirements':
        return <RequirementsPage onNavigate={handleNavigate} />;

      case 'requirements/new':
        return (
          <NewRequirementPage
            onBack={() => handleNavigate('requirements')}
            onNavigate={handleNavigate}
          />
        );

      case 'requirements/detail':
        return routeParam ? (
          <RequirementDetailPage
            requirementId={routeParam}
            onBack={() => handleNavigate('requirements')}
            onNavigate={handleNavigate}
          />
        ) : (
          <RequirementsPage onNavigate={handleNavigate} />
        );

      case 'offers':
        return <OffersPage onNavigate={handleNavigate} />;

      case 'offers/detail':
        return routeParam ? (
          <OfferDetailPage
            offerId={routeParam}
            onBack={() => handleNavigate('offers')}
            onNavigate={handleNavigate}
          />
        ) : (
          <OffersPage onNavigate={handleNavigate} />
        );

      case 'profile':
        return <ProfilePage />;

      case 'auth':
        return <AuthPage onSuccess={() => handleNavigate('dashboard')} />;

      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      <BuyerNavbar currentRoute={currentRoute} onNavigate={handleNavigate} />

      <main style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        {renderCurrentPage()}
      </main>

      <BuyerFooter />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
