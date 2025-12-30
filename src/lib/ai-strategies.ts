// ============================================
// LeakStopper AI - Sector-Specific AI Strategies
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { SectorType, LeakedCustomer, AIMessageResponse } from '@/types';

interface SectorPromptConfig {
    persona: string;
    tone: string;
    keywords: string[];
    offerType: string;
    closingStyle: string;
}

const SECTOR_CONFIGS: Record<SectorType, SectorPromptConfig> = {
    Pharma: {
        persona: 'profesyonel, güvenilir ve sıcak bir sağlık sektörü temsilcisi',
        tone: 'Vefa temalı, profesyonel nezaket içeren, güven odaklı ve çözüm ortağı yaklaşımı. Samimi ama resmi.',
        keywords: ['sağlık', 'güvenilirlik', 'kalite', 'uzun soluklu iş birliği', 'çözüm ortağı', 'tedarik garantisi'],
        offerType: 'Özel fiyat koşulları, öncelikli teslimat veya ek ürün desteği',
        closingStyle: 'Saygılarımızla, sağlıklı günler dileriz.',
    },
    ECommerce: {
        persona: 'Dinamik, müşteri odaklı ve samimi bir e-ticaret markası',
        tone: 'Enerjik, eğlenceli, FOMO yaratan ve indirim odaklı. Emoji kullanımı serbest.',
        keywords: ['fırsat', 'kaçırma', 'özel indirim', 'sınırlı süre', 'ücretsiz kargo', 'hediye'],
        offerType: 'Özel indirim kodu (örn: DONUSVER20), ücretsiz kargo veya hediye ürün',
        closingStyle: 'Seni tekrar görmek için sabırsızlanıyoruz! 🛒✨',
    },
    SaaS: {
        persona: 'Teknik bilgiye sahip, yardımsever bir SaaS müşteri başarı yöneticisi',
        tone: 'Profesyonel ama samimi, değer odaklı, özellik hatırlatıcı. Teknik detaylardan kaçınmadan açıklayıcı.',
        keywords: ['verimlilik', 'yeni özellikler', 'entegrasyon', 'otomasyon', 'zaman tasarrufu', 'ROI'],
        offerType: 'Uzatılmış deneme süresi, premium özelliklere ücretsiz erişim veya birebir teknik destek',
        closingStyle: 'Size yardımcı olmak için buradayız. Başarılarınız bizim başarımızdır.',
    },
};

/**
 * Format date for display in Turkish locale
 */
function formatDateTurkish(date: Date): string {
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Generate the main prompt for AI message generation
 */
function buildPrompt(
    customer: LeakedCustomer,
    sector: SectorType,
    companyName: string = 'Firmamız'
): string {
    const config = SECTOR_CONFIGS[sector];
    const lastPurchaseStr = formatDateTurkish(new Date(customer.lastPurchaseDate));

    return `Sen ${companyName} firmasının ${config.persona}sısın. ${companyName} adına müşteri geri kazanım mesajı yazıyorsun.

## GÖREV
${customer.name} isimli müşterimiz ${lastPurchaseStr} tarihinden bu yana alışveriş yapmadı. 
${customer.daysSinceLastPurchase} gündür bizimle iletişimde değil.
${customer.favoriteProduct ? `En son "${customer.favoriteProduct}" ürünü/hizmeti ile ilgileniyordu.` : ''}
${customer.totalRevenue ? `Geçmişte toplamda ${customer.totalRevenue.toLocaleString('tr-TR')} TL değerinde alışveriş yaptı.` : ''}

## TON VE YAKLAŞIM
${config.tone}

Kullanabileceğin anahtar kelimeler: ${config.keywords.join(', ')}

## TEKLİF TİPİ
Mesajın sonuna şu tarz bir özel teklif ekle: ${config.offerType}

## KAPANIŞ TARZI
${config.closingStyle}

## KURALLAR
1. Mesaj WhatsApp'ta gönderilecek, bu yüzden çok uzun olmasın (max 400 karakter).
2. Müşterinin adını kullan, samimi ol.
3. Agresif satış yapma, değer sun.
4. Türkçe yaz, imla kurallarına dikkat et.
5. ${sector === 'ECommerce' ? 'Emoji kullanabilirsin.' : 'Profesyonel kal, çok fazla emoji kullanma.'}

SADECE mesaj metnini yaz, başka açıklama ekleme.`;
}

export type AIProvider = 'google' | 'openai';

/**
 * Generate a reclamation message for a leaked customer
 */
export async function generateReclamationMessage(
    apiKey: string,
    customer: LeakedCustomer,
    sector: SectorType,
    companyName?: string,
    provider: AIProvider = 'google',
    modelName: string = 'gemini-2.5-flash'
): Promise<AIMessageResponse> {
    const prompt = buildPrompt(customer, sector, companyName);

    try {
        let message = '';
        let subject = '';

        if (provider === 'openai') {
            const openai = new OpenAI({
                apiKey: apiKey,
                dangerouslyAllowBrowser: true // Enable client-side usage
            });

            const completion = await openai.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: modelName,
            });

            message = completion.choices[0]?.message?.content?.trim() || '';

            // Generate subject line
            const subjectPrompt = `Bu mesaj için kısa bir e-posta konu satırı yaz (max 50 karakter): "${message.substring(0, 100)}..."`;

            const subjectCompletion = await openai.chat.completions.create({
                messages: [{ role: 'user', content: subjectPrompt }],
                model: modelName,
            });

            subject = subjectCompletion.choices[0]?.message?.content?.trim() || '';

        } else {
            // Google Gemini Logic
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent(prompt);
            message = result.response.text().trim();

            // Generate subject line
            const subjectPrompt = `Bu mesaj için kısa bir e-posta konu satırı yaz (max 50 karakter): "${message.substring(0, 100)}..."`;
            const subjectResult = await model.generateContent(subjectPrompt);
            subject = subjectResult.response.text().trim();
        }

        return {
            message,
            subject,
            callToAction: getCallToAction(sector),
        };
    } catch (error: unknown) {
        console.error('Message generation failed:', error);

        // Check for specific error types
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate')) {
            throw new Error('API kota limiti aşıldı! Lütfen birkaç dakika bekleyin veya yeni bir API key oluşturun.');
        }

        if (errorMessage.includes('API key') || errorMessage.includes('invalid') || errorMessage.includes('expired') || errorMessage.includes('401')) {
            throw new Error('Geçersiz veya süresi dolmuş API anahtarı. Lütfen yeni bir key oluşturun.');
        }

        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            throw new Error('Model bulunamadı. API ayarlarınızı kontrol edin.');
        }

        throw new Error(`Mesaj oluşturulurken bir hata oluştu: ${errorMessage}`);
    }
}

/**
 * Get sector-specific call to action
 */
function getCallToAction(sector: SectorType): string {
    switch (sector) {
        case 'Pharma':
            return 'Sizinle görüşmek için bizi arayın';
        case 'ECommerce':
            return 'Hemen alışverişe başla →';
        case 'SaaS':
            return 'Ücretsiz demo talep et';
    }
}

/**
 * Get sector display info
 */
export function getSectorInfo(sector: SectorType): {
    label: string;
    description: string;
    icon: string;
    color: string;
} {
    switch (sector) {
        case 'Pharma':
            return {
                label: 'İlaç / Sağlık',
                description: 'Profesyonel nezaket, güven odaklı',
                icon: '💊',
                color: 'from-blue-500 to-cyan-500',
            };
        case 'ECommerce':
            return {
                label: 'E-Ticaret',
                description: 'Enerjik, indirim ve FOMO odaklı',
                icon: '🛒',
                color: 'from-orange-500 to-pink-500',
            };
        case 'SaaS':
            return {
                label: 'SaaS / Yazılım',
                description: 'Özellik ve değer hatırlatıcı',
                icon: '💻',
                color: 'from-purple-500 to-indigo-500',
            };
    }
}

/**
 * Generate a bulk preview of messages (for batch operations)
 */
export async function generateBulkPreviews(
    apiKey: string,
    customers: LeakedCustomer[],
    sector: SectorType,
    companyName?: string,
    limit: number = 3
): Promise<Map<string, AIMessageResponse>> {
    const previews = new Map<string, AIMessageResponse>();
    const topCustomers = customers.slice(0, limit);

    for (const customer of topCustomers) {
        try {
            const response = await generateReclamationMessage(apiKey, customer, sector, companyName);
            previews.set(customer.id, response);
        } catch (error) {
            console.error(`Failed to generate preview for ${customer.name}:`, error);
        }
    }

    return previews;
}
