import React, { useState } from 'react';
import { Tenant } from '../types';
import { sendBulkSms } from '../services/smsService';
import { MessageSquare, CheckSquare, Square, Users, Send, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SMSPanelProps {
  tenants: Tenant[];
}

export const SMSPanel: React.FC<SMSPanelProps> = ({ tenants }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("SEMSSITEYON"); // Default updated
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.size === tenants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tenants.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + ` ${variable} `);
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) {
      alert("Lütfen en az bir kişi seçin.");
      return;
    }
    if (!message.trim()) {
      alert("Mesaj içeriği boş olamaz.");
      return;
    }

    setIsSending(true);
    
    const recipients = tenants
      .filter(t => selectedIds.has(t.id) && t.phoneNumber && t.phoneNumber.length > 5)
      .map(t => {
        let msg = message;
        msg = msg.replace(/{isim}/g, t.name1);
        msg = msg.replace(/{daire}/g, t.unit);
        msg = msg.replace(/{aidat}/g, t.expectedAmount.toString());
        return {
          phone: t.phoneNumber!,
          message: msg.trim()
        };
      });

    const res = await sendBulkSms(recipients, title);
    setResult(res);
    setIsSending(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 p-3 rounded-full">
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">SMS ve Duyuru Paneli</h2>
          <p className="text-sm text-gray-500">Site sakinlerine toplu veya özel mesaj gönderin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Recipient List */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
            <h3 className="font-semibold text-gray-700 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Kişiler ({tenants.length})
            </h3>
            <button 
              onClick={toggleSelectAll} 
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedIds.size === tenants.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tenants.map(tenant => (
              <div 
                key={tenant.id}
                onClick={() => toggleSelect(tenant.id)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedIds.has(tenant.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {selectedIds.has(tenant.id) ? (
                  <CheckSquare className="w-5 h-5 text-blue-600 mr-3" />
                ) : (
                  <Square className="w-5 h-5 text-gray-300 mr-3" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tenant.name1}</p>
                  <p className="text-xs text-gray-500">Daire: {tenant.unit}</p>
                </div>
              </div>
            ))}
            {tenants.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-10">Kayıtlı kişi yok.</p>
            )}
          </div>
          <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl text-center text-xs text-gray-500">
             {selectedIds.size} kişi seçildi
          </div>
        </div>

        {/* Right: Message Editor */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="font-semibold text-gray-800 mb-4">Mesaj Oluştur</h3>
             
             <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (Sender ID)</label>
                   <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={11}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>

                <div>
                   <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Mesaj İçeriği</label>
                      <div className="flex gap-2">
                        <button onClick={() => insertVariable('{isim}')} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">+ İsim</button>
                        <button onClick={() => insertVariable('{daire}')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">+ Daire</button>
                        <button onClick={() => insertVariable('{aidat}')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">+ Aidat</button>
                      </div>
                   </div>
                   <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={8}
                      placeholder="Mesajınızı buraya yazın..."
                      className="w-full px-4 py-3 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                   />
                   <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                     <strong>Önizleme:</strong> {message.replace('{isim}', 'Ahmet Yılmaz').replace('{daire}', 'A-1').replace('{aidat}', '1500') || '...'}
                   </div>
                </div>

                <div className="pt-2">
                  {!result ? (
                    <button 
                      onClick={handleSend}
                      disabled={isSending || selectedIds.size === 0}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      <span>Seçili Kişilere Gönder ({selectedIds.size})</span>
                    </button>
                  ) : (
                    <div className={`p-4 rounded-lg flex flex-col items-center ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                       {result.success ? <CheckCircle className="w-8 h-8 mb-2"/> : <XCircle className="w-8 h-8 mb-2"/>}
                       <p className="font-medium text-lg">{result.success ? 'Gönderim Başarılı' : 'Gönderim Hatası'}</p>
                       <p className="text-sm mb-3">{result.message}</p>
                       <button 
                         onClick={() => setResult(null)}
                         className="text-sm underline hover:no-underline"
                       >
                         Yeni Mesaj Yaz
                       </button>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};