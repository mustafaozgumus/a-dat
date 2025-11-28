import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Tenants } from './components/Tenants';
import { Analysis } from './components/Analysis';
import { SMSPanel } from './components/SMSPanel';
import { Login } from './components/Login';
import { useAuth } from './contexts/AuthContext';
import { Tenant, ViewState, AnalysisResponse } from './types';

// İç component: Auth logic'ten ayrılmış ana uygulama
const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [currentView, setView] = useState<ViewState>('dashboard');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResponse | null>(null);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard tenants={tenants} lastAnalysis={lastAnalysis} />;
      case 'tenants':
        return <Tenants tenants={tenants} setTenants={setTenants} />;
      case 'analysis':
        return <Analysis tenants={tenants} onAnalysisComplete={setLastAnalysis} />;
      case 'sms':
        return <SMSPanel tenants={tenants} />;
      default:
        return <Dashboard tenants={tenants} lastAnalysis={lastAnalysis} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setView}>
      {renderView()}
    </Layout>
  );
};

// Ana App Component artık context provider'ın içinde kullanılacak (index.tsx tarafından sarmalanacak)
export default AppContent;
