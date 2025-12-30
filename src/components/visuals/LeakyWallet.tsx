'use client';

// ============================================
// LeakStopper AI - Leaky Wallet Animation
// ============================================

import { motion } from 'framer-motion';
import { useMemo, useEffect, useState } from 'react';

interface LeakyWalletProps {
    leakVelocity: number; // 0-10, higher = faster coin drops
    bucketHealth: number; // 0-100
    lostRevenue: number;
}

export function LeakyWallet({ leakVelocity, bucketHealth }: LeakyWalletProps) {
    const [coins, setCoins] = useState<{ id: number, delay: number, x: number, duration: number, size: number }[]>([]);

    useEffect(() => {
        const count = Math.min(8, Math.max(3, Math.floor(leakVelocity)));
        setCoins(Array.from({ length: count }, (_, i) => ({
            id: i,
            delay: i * 0.5,
            x: 35 + Math.random() * 30, // Random x position (35-65%)
            duration: 2.5 + Math.random() * 1.5,
            size: 18 + Math.random() * 8,
        })));
    }, [leakVelocity]);

    // Health-based colors for wallet
    const walletColor = useMemo(() => {
        if (bucketHealth >= 70) return { leather: '#8B4513', dark: '#5D2E0C', stitch: '#D4A574' };
        if (bucketHealth >= 40) return { leather: '#A0522D', dark: '#6B3A1F', stitch: '#DEB887' };
        return { leather: '#8B0000', dark: '#5C0000', stitch: '#CD5C5C' };
    }, [bucketHealth]);

    return (
        <div className="relative w-64 h-72 mx-auto">
            {/* SVG Container */}
            <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}
            >
                <defs>
                    {/* Leather texture gradient */}
                    <linearGradient id="leatherGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={walletColor.leather} />
                        <stop offset="50%" stopColor={walletColor.dark} />
                        <stop offset="100%" stopColor={walletColor.leather} />
                    </linearGradient>

                    {/* Inner gradient */}
                    <linearGradient id="innerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1a1a2e" />
                        <stop offset="100%" stopColor="#0f0f1a" />
                    </linearGradient>
                </defs>

                {/* Wallet Body - Bifold Style */}
                <g>
                    {/* Back panel */}
                    <motion.rect
                        x="25"
                        y="40"
                        width="150"
                        height="100"
                        rx="8"
                        fill="url(#leatherGradient)"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.01, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Inner dark area (open wallet) */}
                    <rect
                        x="30"
                        y="50"
                        width="140"
                        height="85"
                        rx="4"
                        fill="url(#innerGradient)"
                    />

                    {/* Card slots */}
                    <rect x="35" y="55" width="55" height="35" rx="3" fill="#2a2a4a" stroke="#3a3a5a" strokeWidth="1" />
                    <rect x="35" y="62" width="55" height="35" rx="3" fill="#252545" stroke="#3a3a5a" strokeWidth="1" />

                    {/* Credit card peek */}
                    <rect x="38" y="68" width="50" height="28" rx="2" fill="#4169E1" />
                    <rect x="42" y="72" width="20" height="4" rx="1" fill="#FFD700" opacity="0.8" />

                    {/* Money compartment */}
                    <rect x="100" y="55" width="65" height="75" rx="3" fill="#1f1f35" />

                    {/* Bills peeking out */}
                    <rect x="105" y="60" width="55" height="25" rx="2" fill="#228B22" opacity="0.9" />
                    <text x="132" y="77" textAnchor="middle" fill="#1a5a1a" fontSize="12" fontWeight="bold">₺</text>
                    <rect x="108" y="65" width="50" height="25" rx="2" fill="#32CD32" opacity="0.8" />
                    <text x="133" y="82" textAnchor="middle" fill="#1a6a1a" fontSize="10" fontWeight="bold">100</text>

                    {/* Front flap with fold effect */}
                    <motion.path
                        d="M25 90 L175 90 L175 140 Q175 148 167 148 L33 148 Q25 148 25 140 Z"
                        fill="url(#leatherGradient)"
                        initial={{ rotateX: 0 }}
                        animate={{ rotateX: [0, 2, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Stitching on flap */}
                    <path
                        d="M35 95 L165 95"
                        stroke={walletColor.stitch}
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        fill="none"
                    />
                    <path
                        d="M35 142 L165 142"
                        stroke={walletColor.stitch}
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        fill="none"
                    />

                    {/* Button/Clasp */}
                    <circle cx="100" cy="148" r="8" fill="#C0C0C0" />
                    <circle cx="100" cy="148" r="5" fill="#A0A0A0" />

                    {/* Hole in wallet bottom - where coins fall */}
                    <motion.ellipse
                        cx="100"
                        cy="145"
                        rx={12 + (100 - bucketHealth) / 10}
                        ry={6 + (100 - bucketHealth) / 20}
                        fill="#0a0a14"
                        initial={{ opacity: 0.9 }}
                        animate={{ opacity: [0.9, 1, 0.9] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </g>
            </svg>

            {/* Falling Coins Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {coins.map((coin) => (
                    <motion.div
                        key={coin.id}
                        className="absolute"
                        style={{ left: `${coin.x}%`, top: '68%' }}
                        initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                        animate={{
                            y: [0, 100],
                            opacity: [1, 1, 0.5, 0],
                            rotate: [0, 180, 360],
                            scale: [1, 0.9, 0.8],
                        }}
                        transition={{
                            duration: coin.duration,
                            delay: coin.delay,
                            repeat: Infinity,
                            ease: "easeIn",
                        }}
                    >
                        {/* 3D-ish Coin */}
                        <svg width={coin.size} height={coin.size} viewBox="0 0 24 24">
                            <defs>
                                <linearGradient id={`coin3d${coin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#fef08a" />
                                    <stop offset="30%" stopColor="#fcd34d" />
                                    <stop offset="70%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#b45309" />
                                </linearGradient>
                                <filter id={`coinShadow${coin.id}`}>
                                    <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.3" />
                                </filter>
                            </defs>
                            <ellipse cx="12" cy="13" rx="9" ry="3" fill="#92400e" opacity="0.5" />
                            <circle
                                cx="12"
                                cy="11"
                                r="9"
                                fill={`url(#coin3d${coin.id})`}
                                stroke="#92400e"
                                strokeWidth="1"
                                filter={`url(#coinShadow${coin.id})`}
                            />
                            <circle cx="12" cy="11" r="7" fill="none" stroke="#d97706" strokeWidth="0.5" />
                            <text x="12" y="14" textAnchor="middle" fill="#78350f" fontSize="8" fontWeight="bold">₺</text>
                        </svg>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
