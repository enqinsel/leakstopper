// ============================================
// LeakStopper AI - CSV Parser with Smart Mapping
// ============================================

import Papa from 'papaparse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Customer, ColumnMapping, CSVParseResult } from '@/types';

/**
 * Parse CSV file using PapaParse
 */
export function parseCSVFile(file: File): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn('CSV parsing warnings:', results.errors);
                }
                resolve(results.data);
            },
            error: (error) => {
                reject(new Error(`CSV parsing failed: ${error.message}`));
            },
        });
    });
}

/**
 * AI-powered Smart Column Mapping
 * Sends first 5 rows to Gemini for intelligent column detection
 */
export async function smartColumnMapping(
    apiKey: string,
    sampleRows: Record<string, string>[]
): Promise<ColumnMapping> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const columns = Object.keys(sampleRows[0] || {});
    const sampleData = sampleRows.slice(0, 5);

    const prompt = `Sen bir veri analisti AI'sın. Aşağıdaki CSV sütunlarını analiz et ve müşteri verisi alanlarıyla eşleştir.

CSV Sütunları: ${JSON.stringify(columns)}

Örnek Veriler (ilk 5 satır):
${JSON.stringify(sampleData, null, 2)}

Bu sütunları aşağıdaki alanlara eşleştir:
- name: Müşteri adı/ismi
- email: E-posta adresi
- phone: Telefon numarası
- companyName: Şirket/firma adı
- lastPurchaseDate: Son satın alma tarihi
- totalRevenue: Toplam gelir/ciro
- favoriteProduct: En çok satın alınan ürün
- purchaseCount: Satın alma sayısı

SADECE JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "name": "orijinal_sütun_adı veya null",
  "email": "orijinal_sütun_adı veya null",
  "phone": "orijinal_sütun_adı veya null",
  "companyName": "orijinal_sütun_adı veya null",
  "lastPurchaseDate": "orijinal_sütun_adı veya null",
  "totalRevenue": "orijinal_sütun_adı veya null",
  "favoriteProduct": "orijinal_sütun_adı veya null",
  "purchaseCount": "orijinal_sütun_adı veya null"
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI response did not contain valid JSON');
        }

        const mapping = JSON.parse(jsonMatch[0]);

        // Clean up null strings
        const cleanMapping: ColumnMapping = {};
        for (const [key, value] of Object.entries(mapping)) {
            if (value && value !== 'null' && value !== null) {
                cleanMapping[key as keyof ColumnMapping] = value as string;
            }
        }

        return cleanMapping;
    } catch (error) {
        console.error('Smart mapping failed:', error);
        // Fallback: try to guess based on common column names
        return fallbackColumnMapping(columns);
    }
}

/**
 * Fallback column mapping using common patterns
 */
function fallbackColumnMapping(columns: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};
    const lowerColumns = columns.map(c => c.toLowerCase().replace(/[_\-\s]/g, ''));
    const originalColumns = columns;

    const patterns: Record<keyof ColumnMapping, RegExp[]> = {
        name: [/^(müşteri|musteri|customer|isim|ad|name|adi|müşteriadi|musteriadi)/i],
        email: [/^(email|eposta|mail|epost|emailaddress)/i],
        phone: [/^(phone|tel|telefon|gsm|mobile|telefonno|telefonnumarasi)/i],
        companyName: [/^(company|firma|şirket|sirket|kurum|şirketadi|sirketadi)/i],
        lastPurchaseDate: [/^(son|last|satinalma|purchase|tarih|date|sonalis|sonsatinalma)/i],
        totalRevenue: [/^(revenue|ciro|total|toplam|gelir|tutar|toplamtutar|toplamciro)/i],
        favoriteProduct: [/^(product|ürün|urun|favori|favoriurun)/i],
        purchaseCount: [/^(count|sayı|sayi|adet|sipariş|siparis|satinalmansayisi|satinalmassayisi)/i],
    };

    for (const [field, regexList] of Object.entries(patterns)) {
        for (const regex of regexList) {
            const index = lowerColumns.findIndex(c => regex.test(c));
            if (index !== -1 && !Object.values(mapping).includes(originalColumns[index])) {
                mapping[field as keyof ColumnMapping] = originalColumns[index];
                break;
            }
        }
    }

    return mapping;
}

/**
 * Parse date string to Date object with multiple format support
 */
function parseDate(dateStr: string): Date {
    if (!dateStr) return new Date(0);

    // Try ISO format first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) return isoDate;

    // Try DD/MM/YYYY or DD.MM.YYYY
    const dmyMatch = dateStr.match(/(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/);
    if (dmyMatch) {
        const [, day, month, year] = dmyMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        return new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));
    }

    return new Date(0);
}

/**
 * Parse number from string with Turkish locale support
 */
function parseNumber(numStr: string): number {
    if (!numStr) return 0;
    // Remove currency symbols and spaces
    const cleaned = numStr.replace(/[₺$€\s]/g, '')
        .replace(/\./g, '') // Remove thousand separators
        .replace(',', '.'); // Convert decimal separator
    return parseFloat(cleaned) || 0;
}

/**
 * Convert raw CSV data to typed Customer array using mapping
 */
export function mapToCustomers(
    rawData: Record<string, string>[],
    mapping: ColumnMapping
): Customer[] {
    return rawData.map((row, index) => {
        const customer: Customer = {
            id: `customer-${index + 1}`,
            name: mapping.name ? row[mapping.name] || 'Bilinmiyor' : 'Bilinmiyor',
            email: mapping.email ? row[mapping.email] || '' : '',
            phone: mapping.phone ? row[mapping.phone] : undefined,
            companyName: mapping.companyName ? row[mapping.companyName] : undefined,
            lastPurchaseDate: mapping.lastPurchaseDate
                ? parseDate(row[mapping.lastPurchaseDate])
                : new Date(0),
            totalRevenue: mapping.totalRevenue
                ? parseNumber(row[mapping.totalRevenue])
                : 0,
            favoriteProduct: mapping.favoriteProduct ? row[mapping.favoriteProduct] : undefined,
            purchaseCount: mapping.purchaseCount
                ? parseInt(row[mapping.purchaseCount]) || 0
                : undefined,
        };
        return customer;
    }).filter(c => c.name !== 'Bilinmiyor' || c.email !== '');
}

/**
 * Main function to parse CSV and map columns
 */
export async function parseCustomerCSV(
    file: File,
    apiKey?: string
): Promise<CSVParseResult> {
    const rawData = await parseCSVFile(file);

    if (rawData.length === 0) {
        throw new Error('CSV dosyası boş veya geçersiz');
    }

    let mapping: ColumnMapping;

    if (apiKey) {
        mapping = await smartColumnMapping(apiKey, rawData);
    } else {
        mapping = fallbackColumnMapping(Object.keys(rawData[0]));
    }

    const customers = mapToCustomers(rawData, mapping);

    return {
        customers,
        mapping,
        rawData,
    };
}
