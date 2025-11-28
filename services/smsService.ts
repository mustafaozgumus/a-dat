// VatanSMS API Service Implementation

const API_USER_ID = "7494616f645ab7ebe8773894";
const API_USER_PASS = "25c5efd52ab90f311aaeb1c7";
const API_URL = "https://api.vatansms.net/api/v1/1toN"; // Toplu gönderim endpoint'i

export interface SmsRecipient {
  phone: string;
  message: string;
}

export const sendBulkSms = async (recipients: SmsRecipient[], senderTitle: string = "SEMSSITEYON"): Promise<{ success: boolean; message: string }> => {
  if (recipients.length === 0) {
    return { success: false, message: "Gönderilecek numara yok." };
  }

  // Check if all messages are identical (Bulk Mode)
  const firstMessage = recipients[0].message;
  const isAllSame = recipients.every(r => r.message === firstMessage);

  // Helper to safely parse response
  const parseResponse = async (response: Response) => {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return json;
    } catch {
      return { status: 'error', message: text }; // Return raw text if not JSON
    }
  };

  if (isAllSame) {
    // --- BULK SEND MODE (VatanSMS 1toN) ---
    const phones = recipients.map(r => r.phone);
    
    const payload = {
      api_id: API_USER_ID,
      api_key: API_USER_PASS,
      sender: senderTitle,
      message_type: 'normal', // VatanSMS genelde bunu ister
      message: firstMessage,
      phones: phones
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await parseResponse(response);
      
      // VatanSMS başarılı yanıt kontrolü
      // status: 'success' veya code: 200 dönebilir
      if (result.status === 'success' || result.code === 200 || (result.report_id && result.report_id > 0)) {
        return { success: true, message: `İşlem Başarılı. (Rapor ID: ${result.report_id})` };
      } else {
        return { success: false, message: `SMS Hatası: ${result.message || result.error || 'Bilinmeyen API hatası'}` };
      }
    } catch (error: any) {
      console.error("SMS Send Error:", error);
      return { success: false, message: `Ağ hatası: ${error.message}. (CORS veya internet bağlantısını kontrol edin)` };
    }

  } else {
    // --- PERSONALIZED SEND MODE (Loop) ---
    // Herkese farklı mesaj gidecekse tek tek istek atıyoruz.
    // VatanSMS NtoN servisi daha karmaşık JSON istiyor, bu yöntem daha güvenilir.
    
    let successCount = 0;
    let failCount = 0;
    let lastError = "";

    for (const recipient of recipients) {
       const payload = {
        api_id: API_USER_ID,
        api_key: API_USER_PASS,
        sender: senderTitle,
        message_type: 'normal',
        message: recipient.message,
        phones: [recipient.phone]
      };

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await parseResponse(response);
        
        if (result.status === 'success' || result.code === 200 || result.report_id) {
            successCount++;
        } else {
            failCount++;
            lastError = result.message || JSON.stringify(result);
        }
      } catch (e: any) {
        failCount++;
        lastError = e.message;
      }
    }

    if (successCount > 0) {
       return { 
           success: true, 
           message: `${successCount} SMS başarıyla gönderildi.${failCount > 0 ? ` (${failCount} başarısız)` : ''}` 
       };
    } else {
       return { success: false, message: `Gönderim başarısız. Hata Detayı: ${lastError}` };
    }
  }
};