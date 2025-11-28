import React, { useState } from 'react';
import { Tenant } from '../types';
import { Plus, Trash2, FileSpreadsheet, Download, Loader2, User, Users } from 'lucide-react';

interface TenantsProps {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
}

export const Tenants: React.FC<TenantsProps> = ({ tenants, setTenants }) => {
  const [newTenant, setNewTenant] = useState<Partial<Tenant>>({ name1: '', name2: '', unit: '', expectedAmount: 0 });
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  
  const handleAdd = () => {
    if (!newTenant.name1 || !newTenant.unit || !newTenant.expectedAmount) return;
    
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      name1: newTenant.name1,
      name2: newTenant.name2 || undefined,
      unit: newTenant.unit,
      expectedAmount: Number(newTenant.expectedAmount)
    };
    
    setTenants([...tenants, tenant]);
    setNewTenant({ name1: '', name2: '', unit: '', expectedAmount: 0 });
  };

  const handleDelete = (id: string) => {
    setTenants(tenants.filter(t => t.id !== id));
  };

  const handleFetchFromGoogleSheets = async () => {
    setIsLoadingCsv(true);
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmu-8jLW2UnIRa9U7XiKTVOg3kHMMgnVb0x-oBeff9fseIstsdbIk2soelo2Q1ZMc28aAj1ZM4nNTu/pub?output=csv';

    try {
      const response = await fetch(CSV_URL);
      const csvText = await response.text();
      
      // Parse CSV
      const rows = csvText.split('\n').map(row => row.split(','));
      
      // Skip header row (index 0) and filter empty rows
      const newTenants: Tenant[] = rows.slice(1)
        .filter(row => row.length >= 4 && row[0].trim() !== '') // Ensure row has data
        .map(row => ({
          id: crypto.randomUUID(),
          unit: row[0]?.trim(),        // Column A: DAIRE
          name1: row[1]?.trim(),       // Column B: ISIM-1
          name2: row[2]?.trim() || undefined, // Column C: ISIM-2 (Optional)
          expectedAmount: Number(row[3]?.trim().replace(/[^0-9.-]+/g,"")) || 0 // Column D: AIDAT TUTARI
        }));

      if (newTenants.length > 0) {
        setTenants(prev => [...prev, ...newTenants]); // Append to existing or replace? User asked to keep manual entry, so append feels safer, but usually sync replaces. Let's append but warn if duplicates? Let's just replace for clean sync or append. 
        // For better UX on "Sync", usually we want to see the new list.
        // Let's replace the list entirely if it's a "Pull from Sheet" action to avoid duplicates, 
        // but since user said "manual adding part stay", maybe they want hybrid.
        // I will replace for now to ensure the sheet is the source of truth when clicked.
        if(confirm(`Google Sheets'ten ${newTenants.length} kayıt bulundu. Mevcut liste silinip bu kayıtlar eklensin mi?`)) {
             setTenants(newTenants);
        }
      } else {
        alert("Tabloda uygun veri bulunamadı.");
      }

    } catch (error) {
      console.error("CSV Fetch Error:", error);
      alert("Google Sheets verisi çekilemedi. Linkin 'Publish to web' olduğundan emin olun.");
    } finally {
      setIsLoadingCsv(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="text-xl font-bold text-gray-800">Daire Sakinleri Listesi</h3>
           <p className="text-sm text-gray-500">Listeyi manuel düzenleyebilir veya Excel'den çekebilirsiniz.</p>
        </div>
        
        <button 
          onClick={handleFetchFromGoogleSheets}
          disabled={isLoadingCsv}
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          {isLoadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          <span>Google Sheets'ten Çek</span>
        </button>
      </div>

      {/* Add Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Manuel Kişi Ekle</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daire No</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="A-1"
              value={newTenant.unit}
              onChange={e => setNewTenant({...newTenant, unit: e.target.value})}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">İsim 1 (Asıl)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ahmet Yılmaz"
              value={newTenant.name1}
              onChange={e => setNewTenant({...newTenant, name1: e.target.value})}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">İsim 2 (Opsiyonel)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Fatma Yılmaz"
              value={newTenant.name2 || ''}
              onChange={e => setNewTenant({...newTenant, name2: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aidat (₺)</label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="1500"
              value={newTenant.expectedAmount || ''}
              onChange={e => setNewTenant({...newTenant, expectedAmount: Number(e.target.value)})}
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Ekle</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Daire</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Kayıtlı İsimler</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Aidat Tutarı</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    Henüz kayıtlı daire sakini yok. Manuel ekleyin veya Google Sheets'ten çekin.
                  </td>
                </tr>
              ) : (
                tenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tenant.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{tenant.name1}</span>
                        {tenant.name2 && (
                          <span className="text-gray-500 text-xs flex items-center mt-1">
                            <Users className="w-3 h-3 mr-1" /> {tenant.name2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{tenant.expectedAmount} ₺</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(tenant.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};