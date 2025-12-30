'use client';

// ============================================
// LeakStopper AI - Sector Selector Component
// ============================================

import { motion } from 'framer-motion';
import type { SectorType } from '@/types';
import { getSectorInfo } from '@/lib/ai-strategies';

interface SectorSelectorProps {
    selectedSector: SectorType;
    onSelect: (sector: SectorType) => void;
}

const SECTORS: SectorType[] = ['Pharma', 'ECommerce', 'SaaS'];

export function SectorSelector({ selectedSector, onSelect }: SectorSelectorProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm font-medium">Sektör Seçimi</span>
                <div className="h-px flex-1 bg-slate-700/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SECTORS.map((sector) => {
                    const info = getSectorInfo(sector);
                    const isSelected = selectedSector === sector;

                    return (
                        <motion.button
                            key={sector}
                            onClick={() => onSelect(sector)}
                            className={`sector-card relative overflow-hidden rounded-xl text-left transition-all cursor-pointer ${isSelected
                                ? 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border-2 border-emerald-500/50'
                                : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                                }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Selected indicator */}
                            {isSelected && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"
                                    layoutId="sectorIndicator"
                                    transition={{ type: 'spring', duration: 0.5 }}
                                />
                            )}

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{info.icon}</span>
                                    <span className={`font-semibold ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                                        {info.label}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                    {info.description}
                                </p>
                            </div>

                            {/* Check mark */}
                            {isSelected && (
                                <motion.div
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.1 }}
                                >
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
