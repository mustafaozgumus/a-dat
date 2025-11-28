import React, { useState } from 'react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, FileSearch, Building2, MessageSquare, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'tenants', label: 'Daire Sakinleri', icon: Users },
    { id: 'analysis', label: 'Ekstre Analizi', icon: FileSearch },
    { id: 'sms', label: 'SMS / Duyuru', icon: MessageSquare },
  ];

  const handleNavClick = (view: ViewState) => {
    setView(view);
    setIsMobileMenuOpen(false); // Close menu on selection in mobile
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      
      {/* Mobile Header & Hamburger */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-30 flex items-center justify-between p-4 shadow-md">
        <div className="flex items-center space-x-2">
           <Building2 className="w-6 h-6 text-blue-400" />
           <span className="font-bold text-lg">AidatMatik</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header (Hidden on Mobile because we have the top bar) */}
        <div className="hidden md:flex p-6 items-center space-x-3 border-b border-slate-700">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AidatMatik</h1>
            <p className="text-xs text-slate-400">Yönetici Paneli</p>
          </div>
        </div>
        
        {/* Mobile Menu Header Padding */}
        <div className="md:hidden h-16"></div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as ViewState)}
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

        <div className="p-4 border-t border-slate-800 space-y-4 mb-safe"> {/* mb-safe for iOS home indicator */}
          <div className="flex items-center justify-between px-2">
             <span className="text-sm text-slate-400">Kullanıcı: <span className="text-white font-medium">{user}</span></span>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-red-600/90 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Güvenli Çıkış</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative w-full">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white shadow-sm sticky top-0 z-10 px-8 py-4 justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {navItems.find(n => n.id === currentView)?.label}
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-gray-500">Sistem Aktif</span>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4 md:p-8 pt-20 md:pt-8 max-w-7xl mx-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};