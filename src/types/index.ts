// ============================================
// LeakStopper AI - Type Definitions
// ============================================

export type SectorType = 'Pharma' | 'ECommerce' | 'SaaS';

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    lastPurchaseDate: Date;
    totalRevenue: number;
    favoriteProduct?: string;
    purchaseCount?: number;
}

export interface LeakedCustomer extends Customer {
    daysSinceLastPurchase: number;
    leakScore: number; // 0-100, higher = more valuable lost customer
    estimatedLostRevenue: number;
    riskLevel?: 'critical' | 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
    totalCustomers: number;
    activeCustomers: number;
    leakedCustomers: number;
    leakRate: number; // percentage
    totalRevenue: number;
    lostRevenue: number;
    bucketHealth: number; // 0-100
    topLeakedCustomers: LeakedCustomer[];
    leakVelocity: number; // how fast customers are leaking (for animation)
}

export interface ColumnMapping {
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    lastPurchaseDate?: string;
    totalRevenue?: string;
    favoriteProduct?: string;
    purchaseCount?: string;
}

export interface AIMessageRequest {
    customer: LeakedCustomer;
    sector: SectorType;
    companyName?: string;
}

export interface AIMessageResponse {
    message: string;
    subject?: string;
    callToAction?: string;
}

export interface CSVParseResult {
    customers: Customer[];
    mapping: ColumnMapping;
    rawData: Record<string, string>[];
}
