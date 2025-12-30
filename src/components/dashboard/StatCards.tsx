'use client';

// ============================================
// LeakStopper AI - Stat Cards Component
// ============================================

import { motion } from 'framer-motion';
import { Users, TrendingDown, Droplets, Activity } from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { getHealthStatus, formatCurrency } from '@/hooks/useBucketAnalysis';

interface StatCardsProps {
    analysis: AnalysisResult;
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    delay?: number;
}

function StatCard({ title, value, subtitle, icon, color, delay = 0 }: StatCardProps) {
    return (
        <motion.div
            className="stat-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ scale: 1.02, borderColor: 'rgba(16, 185, 129, 0.5)' }}
        >
            {/* Glow effect */}
            <div
                className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 ${color}`}
            />

            {/* Icon */}
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-5`}>
                {icon}
            </div>

            {/* Content */}
            <div className="stat-card-content relative">
                <p className="stat-card-title text-slate-400 text-sm font-medium">{title}</p>
                <p className="stat-card-value text-3xl font-bold text-white">{value}</p>
                {subtitle && (
                    <p className="text-slate-500 text-xs mt-2">{subtitle}</p>
                )}
            </div>
        </motion.div>
    );
}

export function StatCards({ analysis }: StatCardsProps) {
    const healthStatus = getHealthStatus(analysis.bucketHealth);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
                title="Toplam Müşteri"
                value={analysis.totalCustomers.toLocaleString('tr-TR')}
                subtitle={`${analysis.activeCustomers} aktif, ${analysis.leakedCustomers} kaybedilen`}
                icon={<Users className="w-6 h-6 text-white" />}
                color="from-blue-500/20 to-cyan-500/20"
                delay={0}
            />

            <StatCard
                title="Kaybedilen Gelir"
                value={formatCurrency(analysis.lostRevenue)}
                subtitle={`Toplam gelirin %${Math.round((analysis.lostRevenue / analysis.totalRevenue) * 100)}'i`}
                icon={<TrendingDown className="w-6 h-6 text-white" />}
                color="from-red-500/20 to-orange-500/20"
                delay={0.1}
            />

            <StatCard
                title="Kayıp Oranı"
                value={`%${analysis.leakRate}`}
                subtitle={`${analysis.leakedCustomers} müşteri kaybedildi`}
                icon={<Droplets className="w-6 h-6 text-white" />}
                color="from-amber-500/20 to-yellow-500/20"
                delay={0.2}
            />

            <StatCard
                title="Müşteri Tutma Oranı"
                value={`${analysis.bucketHealth}/100`}
                subtitle={`${healthStatus.emoji} ${healthStatus.label}`}
                icon={<Activity className="w-6 h-6 text-white" />}
                color="from-emerald-500/20 to-teal-500/20"
                delay={0.3}
            />
        </div>
    );
}
