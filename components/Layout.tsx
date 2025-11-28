import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Users, FileSearch, Building2, MessageSquare } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'tenants', label: 'Daire Sakinleri', icon: Users },
    { id: 'analysis', label: 'Ekstre Analizi', icon: FileSearch },
    { id: 'sms', label: 'SMS / Duyuru', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-700">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AidatMatik</h1>
            <p className="text-xs text-slate-400">Yönetici Paneli</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewState)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Gemini AI Destekli</p>
            <p>Banka ekstrenizi yükleyin, yapay zeka ödemeleri eşleştirsin.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="bg-white shadow-sm sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {navItems.find(n => n.id === currentView)?.label}
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-500">Sistem Aktif</span>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};