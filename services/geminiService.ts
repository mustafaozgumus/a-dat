import { GoogleGenAI, Type } from "@google/genai";
import { Tenant, AnalysisResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeStatementWithGemini = async (
  base64Image: string,
  tenants: Tenant[],
  periodName: string,
  monthCount: number
): Promise<AnalysisResponse> => {
  
  // Format the tenant list to include both names for the AI context
  // Calculate total expected based on selected month count
  const tenantContext = tenants.map(t => {
    const names = t.name2 ? `${t.name1} veya ${t.name2}` : t.name1;
    const totalExpected = t.expectedAmount * monthCount;
    return `ID: ${t.id}, Unit: ${t.unit}, Names: [${names}], Monthly: ${t.expectedAmount}, TOTAL_EXPECTED_FOR_PERIOD: ${totalExpected}`;
  }).join('\n');

  const prompt = `
    Sen uzman bir site yöneticisi asistanısın. Görevin, yüklenen banka ekstresi görüntüsünü analiz etmek ve listedeki kiracılarla ödemeleri eşleştirmektir.

    SEÇİLEN DÖNEM: ${periodName}
    KAPSANAN AY SAYISI: ${monthCount}
    
    (Not: Listede belirtilen 'TOTAL_EXPECTED_FOR_PERIOD' değeri, aylık aidatın ${monthCount} ile çarpılmış halidir. Kontrolü buna göre yap.)

    İŞTE KİRACI LİSTESİ (DAİRE VE İSİMLER):
    ${tenantContext}

    ÖNEMLİ KURAL: Bir daire için tanımlı birden fazla isim olabilir (Örn: Karı-koca). Ekstredeki açıklama veya gönderici ismi, listedeki İSİM-1 veya İSİM-2 ile eşleşiyorsa bu ödemeyi kabul et.

    GÖREVLER:
    1. Görüntüdeki tüm para girişi işlemlerini oku (Tarih, İsim, Tutar, Açıklama).
    2. Her işlemi yukarıdaki Kiracı Listesi ile eşleştirmeye çalış. İsim benzerliklerini (fuzzy match) dikkate al.
    3. Eğer bir kiracı listede varsa ancak ekstrenin içinde ödemesi bulunamıyorsa, onu da sonuçlara ekle ve durumunu 'UNPAID' olarak işaretle.
    4. Ödeme varsa ancak tutar 'TOTAL_EXPECTED_FOR_PERIOD' değerinden azsa 'PARTIAL', tam veya fazlaysa 'PAID' olarak işaretle.
    5. Listede olmayan bir isimden ödeme geldiyse, tenantId: null olarak işaretle.

    JSON ŞEMASINA UYGUN ÇIKTI VER.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tenantId: { type: Type.STRING, nullable: true, description: "ID of the matched tenant from provided list. Null if unknown payer." },
                  matchedName: { type: Type.STRING, description: "The specific name found in the bank statement." },
                  detectedAmount: { type: Type.NUMBER, description: "The amount found in the bank statement. 0 if unpaid." },
                  status: { type: Type.STRING, enum: ["PAID", "UNPAID", "PARTIAL", "UNKNOWN"] },
                  confidence: { type: Type.STRING, description: "Reasoning for the match confidence." },
                  transactionDate: { type: Type.STRING, description: "Date of transaction found in statement." },
                  description: { type: Type.STRING, description: "Raw description from the bank statement line." }
                },
                required: ["matchedName", "detectedAmount", "status", "confidence"]
              }
            },
            summary: {
              type: Type.OBJECT,
              properties: {
                totalExpected: { type: Type.NUMBER },
                totalCollected: { type: Type.NUMBER },
                matchCount: { type: Type.INTEGER }
              },
              required: ["totalExpected", "totalCollected", "matchCount"]
            }
          },
          required: ["results", "summary"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResponse;
    }
    throw new Error("Boş yanıt döndü.");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const improveTextWithGemini = async (text: string): Promise<string> => {
  if (!text || text.trim().length === 0) return text;

  const prompt = `
    Sen profesyonel, kibar ve çözüm odaklı bir apartman/site yöneticisisin. 
    Aşağıdaki SMS metnini al ve şu kurallara göre yeniden yaz:
    
    1. Üslubu daha kurumsal, nazik ve profesyonel hale getir.
    2. Türkçe dil bilgisi ve imla hatalarını düzelt.
    3. Metnin içindeki süslü parantezli değişkenleri (Örn: {isim}, {daire}, {aidat}, {tutar}, {donem} vb.) ASLA değiştirme, silme veya bozma. Bunlar aynen kalmalı.
    4. Mesajın ana fikrini koru.
    5. Mümkün olduğunca kısa ve öz tut (SMS olduğu için).
    6. Sadece düzeltilmiş metni döndür, başına sonuna açıklama ekleme.

    MEVCUT METİN:
    "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Text Improvement Error:", error);
    throw error; // UI should handle this
  }
};