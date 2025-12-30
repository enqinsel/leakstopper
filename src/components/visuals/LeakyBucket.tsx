'use client';

// ============================================
// LeakStopper AI - Leaky Bucket Animation
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LeakyBucketProps {
    leakVelocity: number; // 0-10, controls animation speed
    bucketHealth: number; // 0-100
    lostRevenue: number;
    isAnalyzing?: boolean;
}

interface Droplet {
    id: number;
    x: number;
    delay: number;
}

export function LeakyBucket({
    leakVelocity,
    bucketHealth,
    lostRevenue,
    isAnalyzing = false
}: LeakyBucketProps) {
    const [droplets, setDroplets] = useState<Droplet[]>([]);

    // Water level based on bucket health (with safe default)
    const waterLevel = bucketHealth ?? 50;

    // Generate droplets based on leak velocity
    useEffect(() => {
        if (isAnalyzing) return;

        const interval = setInterval(() => {
            const newDroplet: Droplet = {
                id: Date.now(),
                x: 30 + Math.random() * 40, // Random x position for holes
                delay: Math.random() * 0.5,
            };

            setDroplets(prev => [...prev.slice(-10), newDroplet]);
        }, Math.max(200, 1000 - leakVelocity * 80));

        return () => clearInterval(interval);
    }, [leakVelocity, isAnalyzing]);

    // Calculate water gradient based on health
    const getWaterGradient = () => {
        if (bucketHealth >= 70) return 'from-emerald-500 via-emerald-600 to-teal-600';
        if (bucketHealth >= 40) return 'from-yellow-500 via-orange-500 to-orange-600';
        return 'from-red-500 via-red-600 to-rose-700';
    };

    return (
        <div className="relative w-full max-w-md mx-auto h-80 flex items-center justify-center">
            {/* Glow effect behind bucket - static to avoid color animation issues */}
            <div
                className="absolute inset-0 blur-3xl opacity-25 transition-all duration-1000"
                style={{
                    background: `radial-gradient(circle, ${bucketHealth >= 70 ? '#10b981' : bucketHealth >= 40 ? '#f59e0b' : '#ef4444'} 0%, transparent 70%)`,
                }}
            />

            <svg
                viewBox="0 0 200 250"
                className="w-64 h-80 relative z-10"
                style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))' }}
            >
                {/* Definitions */}
                <defs>
                    {/* Water gradient */}
                    <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={bucketHealth >= 70 ? '#10b981' : bucketHealth >= 40 ? '#f59e0b' : '#ef4444'} />
                        <stop offset="100%" stopColor={bucketHealth >= 70 ? '#059669' : bucketHealth >= 40 ? '#d97706' : '#dc2626'} />
                    </linearGradient>

                    {/* Bucket metal gradient */}
                    <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#374151" />
                        <stop offset="50%" stopColor="#6b7280" />
                        <stop offset="100%" stopColor="#374151" />
                    </linearGradient>

                    {/* Clip path for water */}
                    <clipPath id="bucketClip">
                        <path d="M35 60 L45 200 L155 200 L165 60 Z" />
                    </clipPath>

                    {/* Wave filter */}
                    <filter id="wave">
                        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>

                {/* Bucket body */}
                <motion.path
                    d="M30 55 L25 50 L175 50 L170 55 L165 205 C165 210 155 215 100 215 C45 215 35 210 35 205 Z"
                    fill="url(#metalGradient)"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Bucket rim */}
                <ellipse cx="100" cy="52" rx="75" ry="8" fill="#4b5563" stroke="#9ca3af" strokeWidth="1" />

                {/* Water with animated level */}
                <g clipPath="url(#bucketClip)">
                    <motion.rect
                        x="35"
                        width="130"
                        fill="url(#waterGradient)"
                        filter="url(#wave)"
                        initial={{ y: 200, height: 0 }}
                        animate={{
                            y: isAnalyzing ? 100 : 200 - (waterLevel * 1.4),
                            height: isAnalyzing ? 100 : waterLevel * 1.4,
                        }}
                        transition={{
                            duration: isAnalyzing ? 0.5 : 1.5,
                            ease: 'easeOut'
                        }}
                    />

                    {/* Wave effect on water surface - only render when waterLevel is valid */}
                    {waterLevel > 0 && (
                        <motion.path
                            d={`M35 ${200 - waterLevel * 1.4} Q70 ${195 - waterLevel * 1.4} 100 ${200 - waterLevel * 1.4} T165 ${200 - waterLevel * 1.4}`}
                            fill="none"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="3"
                            animate={{
                                d: [
                                    `M35 ${200 - waterLevel * 1.4} Q70 ${195 - waterLevel * 1.4} 100 ${200 - waterLevel * 1.4} T165 ${200 - waterLevel * 1.4}`,
                                    `M35 ${200 - waterLevel * 1.4} Q70 ${205 - waterLevel * 1.4} 100 ${200 - waterLevel * 1.4} T165 ${200 - waterLevel * 1.4}`,
                                ],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: 'reverse',
                                ease: 'easeInOut',
                            }}
                        />
                    )}
                </g>

                {/* Holes in bucket */}
                {[
                    { cx: 55, cy: 160 },
                    { cx: 85, cy: 175 },
                    { cx: 115, cy: 165 },
                    { cx: 145, cy: 180 },
                ].map((hole, i) => {
                    const safeWaterLevel = waterLevel ?? 50;
                    const showDrip = safeWaterLevel > (200 - hole.cy) / 1.4 && !isAnalyzing;

                    return (
                        <g key={i}>
                            <ellipse
                                cx={hole.cx}
                                cy={hole.cy}
                                rx={6}
                                ry={4}
                                fill="#1e293b"
                                stroke="#374151"
                                strokeWidth={1}
                            />
                            {/* Drip coming out of hole */}
                            {showDrip && (
                                <motion.ellipse
                                    cx={hole.cx}
                                    cy={hole.cy + 5}
                                    rx={3}
                                    ry={5}
                                    fill="url(#waterGradient)"
                                    animate={{
                                        cy: [hole.cy + 5, hole.cy + 40],
                                        opacity: [1, 0],
                                        ry: [5, 8],
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                        ease: 'easeIn',
                                    }}
                                />
                            )}
                        </g>
                    );
                })}

                {/* Bucket handle */}
                <motion.path
                    d="M25 50 Q25 20 100 10 Q175 20 175 50"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                />

                {/* Handle attachment rings */}
                <circle cx="25" cy="50" r="5" fill="#4b5563" stroke="#9ca3af" strokeWidth="1" />
                <circle cx="175" cy="50" r="5" fill="#4b5563" stroke="#9ca3af" strokeWidth="1" />
            </svg>

            {/* Falling droplets */}
            <AnimatePresence>
                {droplets.map((droplet) => (
                    <motion.div
                        key={droplet.id}
                        className="absolute w-3 h-4 rounded-full"
                        style={{
                            left: `${droplet.x}%`,
                            top: '65%',
                            background: `linear-gradient(180deg, ${bucketHealth >= 70 ? '#10b981' : bucketHealth >= 40 ? '#f59e0b' : '#ef4444'} 0%, ${bucketHealth >= 70 ? '#059669' : bucketHealth >= 40 ? '#d97706' : '#dc2626'} 100%)`,
                        }}
                        initial={{ y: 0, opacity: 1, scale: 1 }}
                        animate={{ y: 150, opacity: 0, scale: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, delay: droplet.delay }}
                    />
                ))}
            </AnimatePresence>

            {/* Analyzing overlay */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm rounded-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="text-center"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <div className="text-2xl mb-2">🔍</div>
                            <div className="text-emerald-400 font-semibold">Analyzing Leaks...</div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lost revenue indicator */}
            {!isAnalyzing && lostRevenue > 0 && (
                <motion.div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    <div className="text-xs text-slate-400 mb-1">Kayıp Potansiyel Gelir</div>
                    <div className="text-red-400 font-bold text-lg">
                        {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                            minimumFractionDigits: 0,
                        }).format(lostRevenue)}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
