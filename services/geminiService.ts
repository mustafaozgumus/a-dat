import { GoogleGenAI, Type } from "@google/genai";
import { Tenant, AnalysisResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeStatementWithGemini = async (
  base64Image: string,
  tenants: Tenant[]
): Promise<AnalysisResponse> => {
  
  // Format the tenant list to include both names for the AI context
  const tenantContext = tenants.map(t => {
    const names = t.name2 ? `${t.name1} veya ${t.name2}` : t.name1;
    return `ID: ${t.id}, Unit: ${t.unit}, Names: [${names}], Expected: ${t.expectedAmount}`;
  }).join('\n');

  const prompt = `
    Sen uzman bir site yöneticisi asistanısın. Görevin, yüklenen banka ekstresi görüntüsünü analiz etmek ve listedeki kiracılarla ödemeleri eşleştirmektir.

    İŞTE KİRACI LİSTESİ (DAİRE VE İSİMLER):
    ${tenantContext}

    ÖNEMLİ KURAL: Bir daire için tanımlı birden fazla isim olabilir (Örn: Karı-koca). Ekstredeki açıklama veya gönderici ismi, listedeki İSİM-1 veya İSİM-2 ile eşleşiyorsa bu ödemeyi kabul et.

    GÖREVLER:
    1. Görüntüdeki tüm para girişi işlemlerini oku (Tarih, İsim, Tutar, Açıklama).
    2. Her işlemi yukarıdaki Kiracı Listesi ile eşleştirmeye çalış. İsim benzerliklerini (fuzzy match) dikkate al.
    3. Eğer bir kiracı listede varsa ancak ekstrenin içinde ödemesi bulunamıyorsa, onu da sonuçlara ekle ve durumunu 'UNPAID' olarak işaretle.
    4. Ödeme varsa ancak tutar beklenen tutardan azsa 'PARTIAL', tam veya fazlaysa 'PAID' olarak işaretle.
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