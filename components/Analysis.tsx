import React, { useState } from 'react';
import { Tenant, AnalysisResponse, PaymentStatus } from '../types';
import { analyzeStatementWithGemini } from '../services/geminiService';
import { UploadCloud, CheckCircle, XCircle, AlertTriangle, Loader2, FileText, RefreshCw, Users } from 'lucide-react';

interface AnalysisProps {
  tenants: Tenant[];
  onAnalysisComplete: (result: AnalysisResponse) => void;
}

export const Analysis: React.FC<AnalysisProps> = ({ tenants, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (tenants.length === 0) {
      setError("Lütfen önce 'Daire Sakinleri' sayfasından kişileri ekleyin veya Excel'den çekin.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!filePreview) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const base64Data = filePreview.split(',')[1];
      const data = await analyzeStatementWithGemini(base64Data, tenants);
      setResult(data);
      onAnalysisComplete(data);
    } catch (err: any) {
      setError('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin. Hata: ' + (err.message || "Bilinmiyor"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1"/> ÖDENDİ</span>;
      case PaymentStatus.UNPAID:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1"/> ÖDENMEDİ</span>;
      case PaymentStatus.PARTIAL:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1"/> EKSİK</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">BİLİNMİYOR</span>;
    }
  };

  const getTenantDisplay = (tenantId: string | null) => {
    if (!tenantId) return 'Bilinmeyen Gönderici';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return 'Silinmiş Kayıt';
    return (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{tenant.unit}</span>
        <span className="text-xs text-gray-500">{tenant.name1} {tenant.name2 ? `/ ${tenant.name2}` : ''}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-dashed border-gray-300 text-center">
        {!filePreview ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Banka Ekstresi Yükle</h3>
              <p className="text-sm text-gray-500 mt-1">Sadece resim dosyaları (JPG, PNG) desteklenir</p>
            </div>
            <div className="flex justify-center">
              <label className="relative cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm">
                <span>Dosya Seç</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <img src={filePreview} alt="Preview" className="max-h-64 rounded-lg shadow-md border border-gray-200" />
              <button 
                onClick={() => { setFilePreview(null); setResult(null); }}
                className="absolute -top-3 -right-3 bg-white text-red-500 rounded-full p-1 shadow-md hover:bg-red-50"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {!isAnalyzing && !result && (
              <button
                onClick={handleAnalyze}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
              >
                <FileText className="w-5 h-5" />
                <span>Analizi Başlat</span>
              </button>
            )}

            {isAnalyzing && (
              <div className="flex items-center space-x-3 text-indigo-600 font-medium animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Yapay zeka ekstreyi inceliyor...</span>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Analiz Sonuçları</h3>
            <div className="flex space-x-4 text-sm">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                <span className="text-gray-500 mr-2">Toplam Tahsilat:</span>
                <span className="font-bold text-green-600">{result.summary.totalCollected} ₺</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                <span className="text-gray-500 mr-2">Eşleşen:</span>
                <span className="font-bold text-blue-600">{result.summary.matchCount} Kişi</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ekstredaki İsim</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Eşleşen Daire</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tutar</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">AI Detayı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.results.map((row, idx) => (
                    <tr key={idx} className={row.status === 'UNPAID' ? 'bg-red-50/50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{row.matchedName}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getTenantDisplay(row.tenantId)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(row.status as PaymentStatus)}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-700">
                        {row.detectedAmount > 0 ? `${row.detectedAmount} ₺` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={row.description}>
                        <div className="flex items-center space-x-1">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{row.confidence}</span>
                            <span className="truncate block ml-2">{row.description}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};