export interface Tenant {
  id: string;
  name1: string;
  name2?: string;
  unit: string;
  expectedAmount: number;
}

export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  UNKNOWN = 'UNKNOWN'
}

export interface AnalysisResult {
  tenantId: string | null;
  matchedName: string;
  detectedAmount: number;
  status: PaymentStatus;
  confidence: string; // "High", "Medium", "Low"
  transactionDate?: string;
  description?: string;
}

export interface AnalysisResponse {
  results: AnalysisResult[];
  summary: {
    totalExpected: number;
    totalCollected: number;
    matchCount: number;
  };
}

export type ViewState = 'dashboard' | 'tenants' | 'analysis';