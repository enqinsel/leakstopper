// ============================================
// LeakStopper AI - Bucket Analysis Hook
// ============================================

import { useMemo } from 'react';
import type { Customer, LeakedCustomer, AnalysisResult } from '@/types';

// Filter options interface
export interface FilterOptions {
    thresholdDays: number;
    minSpending: number;
    riskLevel: 'all' | 'critical' | 'high' | 'medium';
}

// Default filter values
export const DEFAULT_FILTERS: FilterOptions = {
    thresholdDays: 90,
    minSpending: 0,
    riskLevel: 'all',
};

// Weights for leak score calculation
const WEIGHTS = {
    recency: 0.3, // How recently they were active
    revenue: 0.5, // How much they spent
    frequency: 0.2, // How often they purchased
};

/**
 * Calculate days since a given date
 */
function daysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get risk level based on leak score
 */
function getRiskLevel(leakScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (leakScore >= 70) return 'critical';
    if (leakScore >= 50) return 'high';
    if (leakScore >= 30) return 'medium';
    return 'low';
}

/**
 * Calculate leak score for a customer (0-100)
 * Higher score = more valuable lost customer
 */
function calculateLeakScore(
    customer: Customer,
    maxRevenue: number,
    maxPurchaseCount: number
): number {
    const daysSinceLastPurchase = daysSince(customer.lastPurchaseDate);

    // Recency score: higher if they were recently active then dropped
    const recencyScore = daysSinceLastPurchase < 180
        ? Math.min(100, (daysSinceLastPurchase / 180) * 100)
        : 100;

    // Revenue score: based on their spending
    const revenueScore = maxRevenue > 0
        ? (customer.totalRevenue / maxRevenue) * 100
        : 0;

    // Frequency score: based on purchase count
    const frequencyScore = maxPurchaseCount > 0 && customer.purchaseCount
        ? (customer.purchaseCount / maxPurchaseCount) * 100
        : 50; // Default if no data

    return Math.round(
        recencyScore * WEIGHTS.recency +
        revenueScore * WEIGHTS.revenue +
        frequencyScore * WEIGHTS.frequency
    );
}

/**
 * Estimate lost revenue based on customer's past behavior
 */
function estimateLostRevenue(customer: Customer): number {
    const daysSinceLastPurchase = daysSince(customer.lastPurchaseDate);
    const monthsInactive = daysSinceLastPurchase / 30;

    // Estimate monthly average from total revenue and purchase history
    if (customer.purchaseCount && customer.purchaseCount > 1) {
        const avgPerPurchase = customer.totalRevenue / customer.purchaseCount;
        // Assume they would have made at least 1 purchase per 2 months
        const missedPurchases = Math.floor(monthsInactive / 2);
        return avgPerPurchase * missedPurchases;
    }

    // Fallback: assume they would have spent similar amount
    return customer.totalRevenue * (monthsInactive / 12);
}

/**
 * Main hook for bucket analysis with filters
 */
export function useBucketAnalysis(
    customers: Customer[],
    filters: FilterOptions = DEFAULT_FILTERS
): AnalysisResult | null {
    return useMemo(() => {
        if (!customers || customers.length === 0) {
            return null;
        }

        // Separate active and leaked customers
        const leakedCustomers: LeakedCustomer[] = [];
        const activeCustomers: Customer[] = [];

        const maxRevenue = Math.max(...customers.map(c => c.totalRevenue));
        const maxPurchaseCount = Math.max(
            ...customers.map(c => c.purchaseCount || 0)
        );

        for (const customer of customers) {
            const daysSinceLastPurchase = daysSince(customer.lastPurchaseDate);

            // Apply threshold filter
            if (daysSinceLastPurchase > filters.thresholdDays) {
                const leakScore = calculateLeakScore(customer, maxRevenue, maxPurchaseCount);
                const estimatedLoss = estimateLostRevenue(customer);
                const riskLevel = getRiskLevel(leakScore);

                const leakedCustomer: LeakedCustomer = {
                    ...customer,
                    daysSinceLastPurchase,
                    leakScore,
                    estimatedLostRevenue: estimatedLoss,
                    riskLevel,
                };

                // Apply min spending filter
                if (customer.totalRevenue < filters.minSpending) {
                    continue;
                }

                // Apply risk level filter
                if (filters.riskLevel !== 'all') {
                    if (filters.riskLevel === 'critical' && riskLevel !== 'critical') continue;
                    if (filters.riskLevel === 'high' && !['critical', 'high'].includes(riskLevel)) continue;
                    if (filters.riskLevel === 'medium' && !['critical', 'high', 'medium'].includes(riskLevel)) continue;
                }

                leakedCustomers.push(leakedCustomer);
            } else {
                activeCustomers.push(customer);
            }
        }

        // Sort by leak score (most valuable first)
        leakedCustomers.sort((a, b) => b.leakScore - a.leakScore);

        // Calculate totals
        const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
        const lostRevenue = leakedCustomers.reduce(
            (sum, c) => sum + c.estimatedLostRevenue,
            0
        );

        // Calculate leak rate
        const leakRate = (leakedCustomers.length / customers.length) * 100;

        // Calculate bucket health (inverse of leak rate with some adjustments)
        const bucketHealth = Math.max(0, Math.min(100, 100 - leakRate * 1.2));

        // Calculate leak velocity (for animation speed)
        // Higher velocity = more critical situation
        const leakVelocity = Math.min(10, (lostRevenue / totalRevenue) * 20);

        return {
            totalCustomers: customers.length,
            activeCustomers: activeCustomers.length,
            leakedCustomers: leakedCustomers.length,
            leakRate: Math.round(leakRate * 10) / 10,
            totalRevenue,
            lostRevenue: Math.round(lostRevenue),
            bucketHealth: Math.round(bucketHealth),
            topLeakedCustomers: leakedCustomers.slice(0, 50), // Increased limit
            leakVelocity,
        };
    }, [customers, filters]);
}

/**
 * Get health status label and color
 */
export function getHealthStatus(health: number): {
    label: string;
    color: string;
    emoji: string;
} {
    if (health >= 80) {
        return { label: 'Mükemmel', color: 'text-emerald-400', emoji: '🟢' };
    } else if (health >= 60) {
        return { label: 'İyi', color: 'text-green-400', emoji: '🟡' };
    } else if (health >= 40) {
        return { label: 'Dikkat Gerekli', color: 'text-yellow-400', emoji: '🟠' };
    } else if (health >= 20) {
        return { label: 'Kritik Seviye', color: 'text-orange-400', emoji: '🔴' };
    } else {
        return { label: 'Yüksek Öncelikli', color: 'text-red-500', emoji: '🚨' };
    }
}

/**
 * Format currency in Turkish Lira
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
