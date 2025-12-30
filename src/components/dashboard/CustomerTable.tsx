'use client';

// ============================================
// LeakStopper AI - Customer Table Component
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MoreHorizontal, ArrowUpDown, Search, Filter,
    Download, RefreshCw, AlertCircle, CheckCircle2,
    Clock, DollarSign, TrendingUp, User, Calendar,
    MessageSquare, Wallet
} from 'lucide-react';
import type { LeakedCustomer } from '@/types';
import { formatCurrency } from '@/hooks/useBucketAnalysis';

interface CustomerTableProps {
    customers: LeakedCustomer[];
    onGenerateMessage: (customer: LeakedCustomer) => void;
    isGenerating?: string | null; // Customer ID that is currently generating
}

type SortKey = 'name' | 'daysSinceLastPurchase' | 'estimatedLostRevenue' | 'leakScore';
type SortDirection = 'asc' | 'desc';

export function CustomerTable({ customers, onGenerateMessage, isGenerating }: CustomerTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('leakScore');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const sortedCustomers = [...customers].sort((a, b) => {
        let aVal: number | string;
        let bVal: number | string;

        switch (sortKey) {
            case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
            case 'daysSinceLastPurchase':
                aVal = a.daysSinceLastPurchase;
                bVal = b.daysSinceLastPurchase;
                break;
            case 'estimatedLostRevenue':
                aVal = a.estimatedLostRevenue;
                bVal = b.estimatedLostRevenue;
                break;
            case 'leakScore':
                aVal = a.leakScore;
                bVal = b.leakScore;
                break;
            default:
                return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const getLeakScoreColor = (score: number) => {
        if (score >= 70) return 'text-red-400 bg-red-500/20';
        if (score >= 40) return 'text-orange-400 bg-orange-500/20';
        return 'text-yellow-400 bg-yellow-500/20';
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const SortButton = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
        <button
            onClick={() => handleSort(sortKeyName)}
            className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
        >
            {label}
            <ArrowUpDown className={`w-3 h-3 ${sortKey === sortKeyName ? 'text-emerald-400' : 'text-slate-600'}`} />
        </button>
    );

    if (customers.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400">
                <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Henüz kaybedilen müşteri bulunamadı</p>
                <p className="text-sm text-slate-500">CSV dosyanızı yükleyin veya eşik değerlerini kontrol edin</p>
            </div>
        );
    }

    return (
        <motion.div
            className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Table Header */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="table-th text-left text-slate-400 font-medium text-sm">
                                <SortButton label="Müşteri" sortKeyName="name" />
                            </th>
                            <th className="table-th text-left text-slate-400 font-medium text-sm">
                                <SortButton label="Son Alışveriş" sortKeyName="daysSinceLastPurchase" />
                            </th>
                            <th className="table-th text-left text-slate-400 font-medium text-sm">
                                <SortButton label="Kayıp Gelir" sortKeyName="estimatedLostRevenue" />
                            </th>
                            <th className="table-th text-left text-slate-400 font-medium text-sm">
                                <SortButton label="Kayıp Riski" sortKeyName="leakScore" />
                            </th>
                            <th className="table-th text-right text-slate-400 font-medium text-sm">
                                Aksiyon
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {sortedCustomers.map((customer, index) => (
                                <motion.tr
                                    key={customer.id}
                                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    {/* Customer Info */}
                                    <td className="table-td">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{customer.name}</div>
                                                <div className="text-xs text-slate-500">{customer.email || customer.companyName || '-'}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Last Purchase */}
                                    <td className="table-td">
                                        <div className="text-sm text-slate-300">
                                            {new Date(customer.lastPurchaseDate).toLocaleDateString('tr-TR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {customer.daysSinceLastPurchase} gün önce
                                        </div>
                                    </td>

                                    {/* Lost Revenue */}
                                    <td className="table-td">
                                        <div className="text-sm font-medium text-red-400">
                                            {formatCurrency(customer.estimatedLostRevenue)}
                                        </div>
                                    </td>

                                    {/* Leak Score */}
                                    <td className="table-td">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${customer.leakScore > 80 ? 'bg-red-500' :
                                                        customer.leakScore > 60 ? 'bg-orange-500' : 'bg-yellow-500'
                                                        }`}
                                                    style={{ width: `${customer.leakScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-slate-400 w-6">
                                                {customer.leakScore}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Action */}
                                    <td className="table-cell table-cell-action text-right">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => onGenerateMessage(customer)}
                                            disabled={isGenerating === customer.id}
                                            className="btn-action inline-flex items-center gap-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 hover:border-emerald-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isGenerating === customer.id ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                                                    <span>Oluşturuluyor...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <MessageSquare className="w-4 h-4" />
                                                    <span>Mesaj Oluştur</span>
                                                </>
                                            )}
                                        </motion.button>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="padd px-6 py-4 border-t border-slate-700/50 bg-slate-900/30">
                <p className="text-sm text-slate-400">
                    Toplam <span className="text-white font-medium">{customers.length}</span> kaybedilen müşteri listeleniyor
                </p>
            </div>
        </motion.div>
    );
}
