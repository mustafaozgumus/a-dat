import React from 'react';
import { Tenant, AnalysisResponse } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  tenants: Tenant[];
  lastAnalysis: AnalysisResponse | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ tenants, lastAnalysis }) => {
  const totalMonthlyExpected = tenants.reduce((sum, t) => sum + t.expectedAmount, 0);
  
  // Data for charts based on last analysis or defaults
  const collected = lastAnalysis?.summary.totalCollected || 0;
  const pending = Math.max(0, totalMonthlyExpected - collected);
  
  const paymentStatusData = [
    { name: 'Tahsil Edilen', value: collected, color: '#10b981' }, // green-500
    { name: 'Bekleyen', value: pending, color: '#ef4444' }, // red-500
  ];

  const statCards = [
    { 
      title: 'Toplam Beklenen', 
      value: `${totalMonthlyExpected.toLocaleString('tr-TR')} ₺`, 
      icon: Wallet, 
      color: 'bg-blue-100 text-blue-600' 
    },
    { 
      title: 'Kayıtlı Daire', 
      value: tenants.length.toString(), 
      icon: Users, 
      color: 'bg-purple-100 text-purple-600' 
    },
    { 
      title: 'Son Tahsilat Oranı', 
      value: totalMonthlyExpected > 0 ? `%${Math.round((collected / totalMonthlyExpected) * 100)}` : '%0', 
      icon: CheckCircle2, 
      color: 'bg-green-100 text-green-600' 
    },
    { 
      title: 'Ödenmemiş Tutar', 
      value: `${pending.toLocaleString('tr-TR')} ₺`, 
      icon: AlertCircle, 
      color: 'bg-red-100 text-red-600' 
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 md:hidden mb-4">Genel Bakış</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">{stat.title}</p>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Distribution */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Bu Ay Tahsilat Durumu</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString('tr-TR')} ₺`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-start">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Hızlı İpuçları</h3>
          <ul className="space-y-4 text-gray-600 text-sm md:text-base">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
              <span>Daire sakinleri listesini güncel tutun.</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
              <span>Banka ekstrenizi PDF veya resim (JPG/PNG) olarak indirin.</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
              <span>'Ekstre Analizi' sayfasından dosyayı yükleyin ve AI'ın ödemeleri eşleştirmesini bekleyin.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};