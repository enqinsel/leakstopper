'use client';

// ============================================
// LeakStopper AI - WhatsApp-style Message Modal
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, MessageCircle, Phone, Mail, ExternalLink, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { LeakedCustomer, AIMessageResponse } from '@/types';

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: LeakedCustomer | null;
    message: AIMessageResponse | null;
    isLoading?: boolean;
}

export function MessageModal({ isOpen, onClose, customer, message, isLoading }: MessageModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (message?.message) {
            await navigator.clipboard.writeText(message.message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleWhatsAppOpen = () => {
        if (customer?.phone && message?.message) {
            // Türkiye telefon formatı düzeltmesi
            let phone = customer.phone.replace(/\D/g, '');
            if (phone.startsWith('0')) {
                phone = '90' + phone.substring(1);
            } else if (!phone.startsWith('90') && phone.length === 10) {
                phone = '90' + phone;
            }
            const encodedMessage = encodeURIComponent(message.message);
            window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
        }
    };

    const handleEmailOpen = () => {
        if (customer?.email && message?.message) {
            const subject = encodeURIComponent(message.subject || 'Sizi özledik!');
            const body = encodeURIComponent(message.message);
            window.open(`mailto:${customer.email}?subject=${subject}&body=${body}`, '_blank');
        }
    };

    const hasPhone = !!customer?.phone;
    const hasEmail = !!customer?.email;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-lg bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl my-4"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                            <MessageCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-white truncate">{customer?.name || 'Müşteri'}</h3>
                                            <p className="text-xs text-emerald-100 truncate">
                                                {customer?.email || customer?.phone || 'İletişim bilgisi yok'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="modal-chat-area bg-slate-950/50 max-h-[50vh] overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16 min-h-[180px]">
                                        <div className="bg-slate-800 rounded-2xl rounded-bl-none px-8 py-5 mb-6">
                                            <div className="flex gap-2">
                                                <motion.div
                                                    className="w-3 h-3 rounded-full bg-emerald-400"
                                                    animate={{ y: [0, -10, 0] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                                />
                                                <motion.div
                                                    className="w-3 h-3 rounded-full bg-emerald-400"
                                                    animate={{ y: [0, -10, 0] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                                                />
                                                <motion.div
                                                    className="w-3 h-3 rounded-full bg-emerald-400"
                                                    animate={{ y: [0, -10, 0] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-slate-300 text-base font-medium">AI mesaj oluşturuyor...</p>
                                        <p className="text-slate-500 text-sm mt-1">Lütfen bekleyin</p>
                                    </div>
                                ) : message ? (
                                    <motion.div
                                        className="space-y-5"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Message Bubble */}
                                        <div className="flex justify-end">
                                            <div className="message-bubble max-w-[90%] bg-emerald-600 rounded-2xl rounded-br-none shadow-lg">
                                                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                                    {message.message}
                                                </p>
                                                <p className="text-emerald-200 text-xs mt-3 text-right">
                                                    {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Subject line */}
                                        {message.subject && (
                                            <div className="modal-subject-box bg-slate-800/80 rounded-xl border border-slate-700/50">
                                                <p className="text-slate-400 text-xs mb-3 font-medium">📧 E-posta Konu Satırı</p>
                                                <p className="text-white text-sm">{message.subject}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="flex items-center justify-center py-16 text-slate-500 min-h-[180px]">
                                        <p className="text-base">Mesaj oluşturulamadı</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {message && !isLoading && (
                                <div className="modal-action-buttons border-t border-slate-700/50 bg-slate-900/80">
                                    {/* Missing contact info warning */}
                                    {!hasPhone && !hasEmail && (
                                        <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-amber-300">
                                                CSV dosyanızda telefon veya e-posta bilgisi bulunamadı. Mesajı kopyalayıp manuel gönderebilirsiniz.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <motion.button
                                            onClick={handleCopy}
                                            className="modal-btn flex-1 flex items-center justify-center gap-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors border border-slate-700/50 cursor-pointer"
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-5 h-5 text-emerald-400" />
                                                    <span className="text-emerald-400">Kopyalandı!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-5 h-5" />
                                                    <span>Kopyala</span>
                                                </>
                                            )}
                                        </motion.button>

                                        <motion.button
                                            onClick={handleWhatsAppOpen}
                                            disabled={!hasPhone}
                                            className={`modal-btn flex-1 flex items-center justify-center gap-3 rounded-xl text-white text-sm font-medium transition-colors cursor-pointer ${hasPhone
                                                ? 'bg-green-600 hover:bg-green-500'
                                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                }`}
                                            whileTap={hasPhone ? { scale: 0.95 } : {}}
                                            title={hasPhone ? `WhatsApp: ${customer?.phone}` : 'CSV\'de telefon bilgisi yok'}
                                        >
                                            <Phone className="w-5 h-5" />
                                            <span>WhatsApp</span>
                                            {hasPhone && <ExternalLink className="w-4 h-4" />}
                                        </motion.button>

                                        <motion.button
                                            onClick={handleEmailOpen}
                                            disabled={!hasEmail}
                                            className={`modal-btn flex-1 flex items-center justify-center gap-3 rounded-xl text-white text-sm font-medium transition-colors cursor-pointer ${hasEmail
                                                ? 'bg-blue-600 hover:bg-blue-500'
                                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                }`}
                                            whileTap={hasEmail ? { scale: 0.95 } : {}}
                                            title={hasEmail ? `E-posta: ${customer?.email}` : 'CSV\'de e-posta bilgisi yok'}
                                        >
                                            <Mail className="w-5 h-5" />
                                            <span>E-posta</span>
                                            {hasEmail && <ExternalLink className="w-4 h-4" />}
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
