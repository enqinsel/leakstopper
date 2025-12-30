'use client';

// ============================================
// LeakStopper AI - Filter Panel Component
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Calendar, TrendingDown, DollarSign, X } from 'lucide-react';

interface FilterOptions {
    thresholdDays: number;
    minSpending: number;
    riskLevel: 'all' | 'critical' | 'high' | 'medium';
}

// Default filter values
const DEFAULT_FILTERS: FilterOptions = {
    thresholdDays: 90,
    minSpending: 0,
    riskLevel: 'all',
};

interface FilterPanelProps {
    filters: FilterOptions;
    onChange: (filters: FilterOptions) => void;
    totalCustomers: number;
    filteredCount: number;
}

const THRESHOLD_OPTIONS = [
    { value: 30, label: '30 gün' },
    { value: 60, label: '60 gün' },
    { value: 90, label: '90 gün' },
    { value: 180, label: '6 ay' },
    { value: 365, label: '1 yıl' },
];

const SPENDING_OPTIONS = [
    { value: 0, label: 'Tümü' },
    { value: 500, label: '₺500+' },
    { value: 1000, label: '₺1.000+' },
    { value: 5000, label: '₺5.000+' },
    { value: 10000, label: '₺10.000+' },
];

const RISK_OPTIONS = [
    { value: 'all' as const, label: 'Tüm Riskler', color: 'text-slate-400' },
    { value: 'critical' as const, label: '🔴 Kritik', color: 'text-red-400' },
    { value: 'high' as const, label: '🟠 Yüksek', color: 'text-orange-400' },
    { value: 'medium' as const, label: '🟡 Orta', color: 'text-yellow-400' },
];

// Check if filters are modified from defaults
function hasActiveFilters(filters: FilterOptions): boolean {
    return (
        filters.thresholdDays !== DEFAULT_FILTERS.thresholdDays ||
        filters.minSpending !== DEFAULT_FILTERS.minSpending ||
        filters.riskLevel !== DEFAULT_FILTERS.riskLevel
    );
}

export function FilterPanel({ filters, onChange, totalCustomers, filteredCount }: FilterPanelProps) {
    const isModified = hasActiveFilters(filters);

    const handleClearFilters = () => {
        onChange(DEFAULT_FILTERS);
    };

    return (
        <motion.div
            className="filter-panel rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="filter-header flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Filter className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Kayıp Riski Filtreleri</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {filteredCount} / {totalCustomers} müşteri listeleniyor
                    </p>
                </div>

                {/* Clear Filters Button */}
                <AnimatePresence>
                    {isModified && (
                        <motion.button
                            onClick={handleClearFilters}
                            className="btn-sm ml-auto flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all text-xs font-medium"
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <X className="w-3.5 h-3.5" />
                            Filtreleri Temizle
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Threshold Days Filter */}
                <div className="filter-group">
                    <label className="filter-label flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        Son Alışveriş Süresi
                    </label>
                    <select
                        value={filters.thresholdDays}
                        onChange={(e) => onChange({ ...filters, thresholdDays: Number(e.target.value) })}
                        className="filter-select w-full rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all cursor-pointer hover:bg-slate-900/80"
                    >
                        {THRESHOLD_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}+ önce
                            </option>
                        ))}
                    </select>
                </div>

                {/* Min Spending Filter */}
                <div className="filter-group">
                    <label className="filter-label flex items-center gap-2 text-xs font-medium text-slate-400">
                        <DollarSign className="w-3.5 h-3.5" />
                        Minimum Harcama
                    </label>
                    <select
                        value={filters.minSpending}
                        onChange={(e) => onChange({ ...filters, minSpending: Number(e.target.value) })}
                        className="filter-select w-full rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all cursor-pointer hover:bg-slate-900/80"
                    >
                        {SPENDING_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Risk Level Filter */}
                <div className="filter-group">
                    <label className="filter-label flex items-center gap-2 text-xs font-medium text-slate-400">
                        <TrendingDown className="w-3.5 h-3.5" />
                        Risk Seviyesi
                    </label>
                    <select
                        value={filters.riskLevel}
                        onChange={(e) => onChange({ ...filters, riskLevel: e.target.value as FilterOptions['riskLevel'] })}
                        className="filter-select w-full rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all cursor-pointer hover:bg-slate-900/80"
                    >
                        {RISK_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Active filters summary */}
            <AnimatePresence>
                {isModified && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-700/30"
                    >
                        <span className="text-xs font-medium text-slate-500 py-1">Aktif Filtreler:</span>
                        {filters.thresholdDays !== 90 && (
                            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {filters.thresholdDays}+ gün
                            </span>
                        )}
                        {filters.minSpending > 0 && (
                            <span className="text-xs px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                                <DollarSign className="w-3 h-3" />
                                ₺{filters.minSpending.toLocaleString('tr-TR')}+
                            </span>
                        )}
                        {filters.riskLevel !== 'all' && (
                            <span className="text-xs px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1.5">
                                <TrendingDown className="w-3 h-3" />
                                {RISK_OPTIONS.find(r => r.value === filters.riskLevel)?.label}
                            </span>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export type { FilterOptions };
