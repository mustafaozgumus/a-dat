import React, { useState } from 'react';
import { Tenant } from '../types';
import { Plus, Trash2, FileSpreadsheet, Download, Loader2, User, Users, Phone, AlertCircle } from 'lucide-react';

interface TenantsProps {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
}

export const Tenants: React.FC<TenantsProps> = ({ tenants, setTenants }) => {
  const [newTenant, setNewTenant] = useState<Partial<Tenant>>({ name1: '', name2: '', unit: '', expectedAmount: 0, phoneNumber: '' });
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  const handleAdd = () => {
    if (!newTenant.name1 || !newTenant.unit || !newTenant.expectedAmount) return;
    
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      name1: newTenant.name1,
      name2: newTenant.name2 || undefined,
      unit: newTenant.unit,
      expectedAmount: Number(newTenant.expectedAmount),
      phoneNumber: newTenant.phoneNumber ? cleanPhoneNumber(newTenant.phoneNumber) : undefined
    };
    
    setTenants([...tenants, tenant]);
    setNewTenant({ name1: '', name2: '', unit: '', expectedAmount: 0, phoneNumber: '' });
  };

  const handleDelete = (id: string) => {
    setTenants(tenants.filter(t => t.id !== id));
  };

  // Helper to clean phone numbers to 5xxxxxxxxx format
  const cleanPhoneNumber = (phone: string): string => {
    if (!phone) return "";
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    // If starts with 90, remove 90 (90535 -> 535)
    if (cleaned.startsWith('90') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    // If starts with 0, remove 0 (0535 -> 535)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return cleaned;
  };

  // Robust CSV Parser with Auto-Detect Delimiter (Comma or Semicolon)
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // Detect delimiter from first line (Header)
    // Count commas and semicolons to decide which one is the separator
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';

    console.log(`CSV Detected Delimiter: '${delimiter}'`);

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentCell += char;
      }
    }
    // Push the last cell/row if exists
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }
    return rows;
  };

  const parseTurkishAmount = (val: string): number => {
    if (!val) return 0;
    // Remove currency symbols and spaces
    let clean = val.replace(/[₺TL\s]/g, '');
    
    // Check format: 1.500,50 (TR) vs 1,500.50 (US)
    // If it contains only commas, it's likely decimal separator in TR (150,50)
    // If it contains dots and commas, dot is thousand, comma is decimal in TR (1.500,50)
    
    if (clean.includes('.') && clean.includes(',')) {
      // 1.500,50 -> Remove dots, replace comma with dot -> 1500.50
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      // 1500,50 -> 1500.50
      clean = clean.replace(',', '.');
    } else if (clean.includes('.')) {
      // 1.500 -> If it looks like thousand separator (3 digits after dot), remove it.
      // 1.5 -> If it looks like small decimal, keep it? 
      // Aidat context: usually integer or simple decimal. 
      // Safe bet for TR locale inputs: Remove dots (thousand sep).
      // Example: 1.250 -> 1250
      clean = clean.replace(/\./g, '');
    }
    
    return parseFloat(clean) || 0;
  };

  const handleFetchFromGoogleSheets = async () => {
    setIsLoadingCsv(true);
    setImportError(null);
    // Use cache busting to ensure fresh data
    const CSV_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSmu-8jLW2UnIRa9U7XiKTVOg3kHMMgnVb0x-oBeff9fseIstsdbIk2soelo2Q1ZMc28aAj1ZM4nNTu/pub?output=csv&t=${Date.now()}`;

    try {
      console.log("Fetching CSV from:", CSV_URL);
      const response = await fetch(CSV_URL);
      if (!response.ok) throw new Error(`Google Sheets'e erişilemedi. Status: ${response.status}`);
      
      const csvText = await response.text();
      console.log("Raw CSV Preview (first 100 chars):", csvText.substring(0, 100));
      
      const rows = parseCSV(csvText);
      console.log("Parsed Rows Count:", rows.length);

      // Validate Header or Data
      // Expected Headers (Order might match, but let's rely on index): 
      // A:DAIRE, B:ISIM-1, C:ISIM-2, D:AIDAT, E:NUMARA
      
      if (rows.length < 2) {
        throw new Error("CSV dosyası boş veya anlaşılamadı. (Satır sayısı yetersiz)");
      }
      
      const newTenants: Tenant[] = rows.slice(1) // Skip header
        .filter(row => {
            // Filter out empty rows or rows that don't have at least a Unit and Name
            if (!row || row.length < 2) return false;
            // Check if DAIRE (0) or NAME (1) is empty
            return row[0].trim() !== '' && row[1].trim() !== '';
        })
        .map((row, index) => {
          // Safe access to columns with fallbacks
          const unit = row[0] ? row[0].trim() : `Daire ${index}`;
          const name1 = row[1] ? row[1].trim() : 'İsimsiz';
          const name2 = row[2] ? row[2].trim() : undefined;
          const rawAmount = row[3] ? row[3].trim() : '0';
          const rawPhone = row[4] ? row[4].trim() : '';

          return {
            id: crypto.randomUUID(),
            unit: unit,
            name1: name1,
            name2: name2,
            expectedAmount: parseTurkishAmount(rawAmount),
            phoneNumber: cleanPhoneNumber(rawPhone)
          };
        });

      console.log("Mapped Tenants:", newTenants);

      if (newTenants.length > 0) {
        if(confirm(`Google Sheets'ten ${newTenants.length} kişi bulundu. Mevcut liste silinip bunlar eklensin mi?`)) {
             setTenants(newTenants);
             alert(`${newTenants.length} kişi başarıyla eklendi.`);
        }
      } else {
        throw new Error("Listede geçerli veri bulunamadı. Lütfen A (Daire) ve B (İsim) sütunlarının dolu olduğundan emin olun.");
      }

    } catch (error: any) {
      console.error("CSV Fetch Error:", error);
      setImportError(error.message || "Veri çekilirken bir hata oluştu.");
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
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
        >
          {isLoadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          <span>Google Sheets'ten Çek</span>
        </button>
      </div>

      {importError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{importError}</span>
        </div>
      )}

      {/* Add Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Manuel Kişi Ekle</h4>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">İsim 1</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ahmet Yılmaz"
              value={newTenant.name1}
              onChange={e => setNewTenant({...newTenant, name1: e.target.value})}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">İsim 2</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Opsiyonel"
              value={newTenant.name2 || ''}
              onChange={e => setNewTenant({...newTenant, name2: e.target.value})}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="535..."
              value={newTenant.phoneNumber || ''}
              onChange={e => setNewTenant({...newTenant, phoneNumber: e.target.value})}
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
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Kişi Bilgileri</th>
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
                        {tenant.phoneNumber && (
                          <span className="text-blue-500 text-xs flex items-center mt-1">
                            <Phone className="w-3 h-3 mr-1" /> {tenant.phoneNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{tenant.expectedAmount.toLocaleString('tr-TR')} ₺</td>
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