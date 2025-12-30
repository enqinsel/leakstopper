'use client';

// ============================================
// LeakStopper AI - Main Dashboard Page
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Key, AlertCircle, Sparkles,
  FileSpreadsheet, Settings, Github, Zap, Bot
} from 'lucide-react';
import { LeakyWallet } from '@/components/visuals/LeakyWallet';
import { StatCards } from '@/components/dashboard/StatCards';
import { CustomerTable } from '@/components/dashboard/CustomerTable';
import { SectorSelector } from '@/components/dashboard/SectorSelector';
import { MessageModal } from '@/components/dashboard/MessageModal';
import { FilterPanel, type FilterOptions } from '@/components/dashboard/FilterPanel';
import { useBucketAnalysis, DEFAULT_FILTERS } from '@/hooks/useBucketAnalysis';
import { parseCustomerCSV } from '@/lib/csv-parser';
import { generateReclamationMessage, type AIProvider } from '@/lib/ai-strategies';
import type { Customer, SectorType, LeakedCustomer, AIMessageResponse } from '@/types';

export default function Dashboard() {
  // State - start with empty string to avoid hydration mismatch
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [provider, setProvider] = useState<AIProvider>('google');
  const [modelName, setModelName] = useState<string>('gemini-2.5-flash');

  const [showApiInput, setShowApiInput] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedSector, setSelectedSector] = useState<SectorType>('Pharma');
  const [companyName, setCompanyName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  // Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<LeakedCustomer | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<AIMessageResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Load all persisted data from localStorage on client-side
  useEffect(() => {
    // API Keys
    const storedGoogleKey = localStorage.getItem('leakstopper_api_key');
    if (storedGoogleKey) setGoogleApiKey(storedGoogleKey);

    const storedOpenaiKey = localStorage.getItem('leakstopper_openai_api_key');
    if (storedOpenaiKey) setOpenaiApiKey(storedOpenaiKey);

    // Provider & Model
    const storedProvider = localStorage.getItem('leakstopper_provider') as AIProvider;
    if (storedProvider) setProvider(storedProvider);

    const storedModel = localStorage.getItem('leakstopper_model');
    if (storedModel) setModelName(storedModel);

    // Company Name
    const storedCompany = localStorage.getItem('leakstopper_company_name');
    if (storedCompany) setCompanyName(storedCompany);

    // Selected Sector
    const storedSector = localStorage.getItem('leakstopper_sector');
    if (storedSector) setSelectedSector(storedSector as SectorType);

    // Filters
    const storedFilters = localStorage.getItem('leakstopper_filters');
    if (storedFilters) {
      try {
        setFilters(JSON.parse(storedFilters));
      } catch {
        // Invalid JSON, use defaults
      }
    }

    // Customer Data
    const storedCustomers = localStorage.getItem('leakstopper_customers');
    if (storedCustomers) {
      try {
        const parsed = JSON.parse(storedCustomers);
        // Convert date strings back to Date objects
        const customersWithDates = parsed.map((c: Customer) => ({
          ...c,
          lastPurchaseDate: new Date(c.lastPurchaseDate),
        }));
        setCustomers(customersWithDates);
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Persist company name
  useEffect(() => {
    if (companyName) {
      localStorage.setItem('leakstopper_company_name', companyName);
    }
  }, [companyName]);

  // Persist selected sector
  useEffect(() => {
    localStorage.setItem('leakstopper_sector', selectedSector);
  }, [selectedSector]);

  // Persist filters
  useEffect(() => {
    localStorage.setItem('leakstopper_filters', JSON.stringify(filters));
  }, [filters]);

  // Persist customer data
  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem('leakstopper_customers', JSON.stringify(customers));
    }
  }, [customers]);

  // Analysis hook with filters
  const analysis = useBucketAnalysis(customers, filters);

  // Save API keys to localStorage
  const handleApiKeySave = () => {
    localStorage.setItem('leakstopper_api_key', googleApiKey);
    localStorage.setItem('leakstopper_openai_api_key', openaiApiKey);
    localStorage.setItem('leakstopper_provider', provider);
    localStorage.setItem('leakstopper_model', modelName);
    setShowApiInput(false);
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    // Set default model when switching provider
    if (newProvider === 'google') {
      setModelName('gemini-2.5-flash');
    } else {
      setModelName('gpt-4o');
    }
  };

  // File drop handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // For CSV parsing we just use whatever key is available or pass undefined
      // Ideally CSV parsing shouldn't need an API key unless it's doing enrichment
      const result = await parseCustomerCSV(file, googleApiKey || undefined);
      setCustomers(result.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV işlenirken bir hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  }, [googleApiKey]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: false,
  });

  // Generate message handler
  const handleGenerateMessage = async (customer: LeakedCustomer) => {
    const currentApiKey = provider === 'google' ? googleApiKey : openaiApiKey;

    if (!currentApiKey) {
      setShowApiInput(true);
      setError(`${provider === 'google' ? 'Google Gemini' : 'OpenAI'} API anahtarı eksik! Lütfen ayarlardan giriniz.`);
      return;
    }

    setSelectedCustomer(customer);
    setGeneratedMessage(null);
    setIsModalOpen(true);
    setIsGenerating(customer.id);

    try {
      const message = await generateReclamationMessage(
        currentApiKey,
        customer,
        selectedSector,
        companyName || undefined,
        provider,
        modelName
      );
      setGeneratedMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mesaj oluşturulurken hata oluştu');
    } finally {
      setIsGenerating(null);
    }
  };

  const currentApiKey = provider === 'google' ? googleApiKey : openaiApiKey;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="header relative z-10 border-b border-slate-800/50 backdrop-blur-xl">
        <div className="page-container mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                {/* Custom Wallet + Shield Logo */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 5V11C4 16.5 7.5 21.5 12 23C16.5 21.5 20 16.5 20 11V5L12 2Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="7" y="8" width="10" height="7" rx="1.5" fill="white" opacity="0.9" />
                  <rect x="8" y="10" width="4" height="2" rx="0.5" fill="#10b981" />
                  <circle cx="14" cy="11" r="1.5" fill="#fcd34d" stroke="#d97706" strokeWidth="0.5" />
                </svg>
              </motion.div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  LeakStopper
                </h1>
                <p className="text-xs text-slate-500">Müşteri Geri Kazanım Motoru</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Company Name Input with Tooltip */}
              <div className="relative group flex-1 sm:flex-initial">
                <input
                  type="text"
                  placeholder="Firma Adınız"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="header-input w-full sm:w-40 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  💡 Mesajlarda &quot;{companyName || 'Firmamız'}&quot; olarak kullanılır
                </div>
              </div>

              {/* API Key Button */}
              <motion.button
                onClick={() => setShowApiInput(!showApiInput)}
                className={`header-btn flex items-center gap-2 rounded-lg border transition-all text-sm font-medium ${currentApiKey
                  ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-emerald-500/50'
                  }`}
                whileTap={{ scale: 0.95 }}
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">{currentApiKey ? 'API Bağlı' : 'API Key'}</span>
              </motion.button>
            </div>
          </div>

          {/* API Key Input Dropdown */}
          <AnimatePresence>
            {showApiInput && (
              <motion.div
                className="api-panel rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {/* Provider Selection */}
                {/* Provider Selection */}
                <div className="flex gap-4 mb-6 pb-4 border-b border-slate-700/50">
                  <button
                    onClick={() => handleProviderChange('google')}
                    className={`padd flex items-center gap-2 px-8 py-3 rounded-lg transition-all font-medium ${provider === 'google'
                      ? 'padd bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'padd text-slate-400 hover:bg-slate-800 border border-transparent'
                      }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Google Gemini
                  </button>
                  <button
                    onClick={() => handleProviderChange('openai')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-lg transition-all font-medium ${provider === 'openai'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:bg-slate-800 border border-transparent'
                      }`}
                  >
                    <Bot className="w-4 h-4" />
                    ChatGPT (OpenAI)
                  </button>
                </div>

                <div className="api-panel-info rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <div className="api-panel-row flex items-center gap-3">
                    <span className="text-xs text-slate-400 whitespace-nowrap">🔑 {provider === 'google' ? 'Google Gemini' : 'OpenAI'} API Key:</span>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="password"
                        placeholder={provider === 'google' ? "AIza..." : "sk-..."}
                        value={provider === 'google' ? googleApiKey : openaiApiKey}
                        onChange={(e) => provider === 'google' ? setGoogleApiKey(e.target.value) : setOpenaiApiKey(e.target.value)}
                        className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                      />
                      <motion.button
                        onClick={handleApiKeySave}
                        className="padd px-8 py-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                        whileTap={{ scale: 0.95 }}
                      >
                        Kaydet
                      </motion.button>
                    </div>
                  </div>

                  <div className="api-panel-row border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-3 block">🤖 <strong>Model Seçimi:</strong></p>
                    <div className="flex flex-wrap gap-2">
                      {provider === 'google' ? (
                        <>
                          {['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'].map(m => (
                            <button
                              key={m}
                              onClick={() => setModelName(m)}
                              className={`api-panel-tag text-xs rounded border transition-all ${modelName === m
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium'
                                : 'bg-slate-700/30 text-slate-400 border-transparent hover:bg-slate-700/50'
                                }`}
                            >
                              {m} {modelName === m && '✓'}
                            </button>
                          ))}
                        </>
                      ) : (
                        <>
                          {['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'].map(m => (
                            <button
                              key={m}
                              onClick={() => setModelName(m)}
                              className={`api-panel-tag text-xs rounded border transition-all ${modelName === m
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 font-medium'
                                : 'bg-slate-700/30 text-slate-400 border-transparent hover:bg-slate-700/50'
                                }`}
                            >
                              {m} {modelName === m && '✓'}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="api-panel-row border-t border-slate-700/50">
                    <p className="text-xs text-slate-500">
                      {provider === 'google' ? (
                        <>📌 API anahtarınızı <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Google AI Studio</a>'dan alabilirsiniz.</>
                      ) : (
                        <>📌 API anahtarınızı <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenAI Platform</a>'dan alabilirsiniz.</>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container relative z-10 mx-auto py-8">
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Data State */}
        {!analysis && (
          <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[60vh]">
            {/* Left: Wallet Visualization */}
            <div className="flex flex-col items-center">
              <LeakyWallet
                leakVelocity={5}
                bucketHealth={60}
                lostRevenue={0}
              />
              <motion.p
                className="text-slate-400 mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Her kaybedilen müşteri, cebinizden düşen paradır.<br />
                <span className="text-emerald-400">CSV yükleyin, kayıpları tespit edin!</span>
              </motion.p>
            </div>

            {/* Right: Upload Zone */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Müşteri Kaybı
                  </span>
                  {' '}Analizi
                </h2>
                <p className="text-slate-400">
                  Yeni müşteri peşinde koşarken kaybettiğiniz eski müşterilerinizi tespit edin
                </p>
              </div>

              {/* Dropzone */}
              <div {...getRootProps()} role="presentation">
                <motion.div
                  className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all my-6 ${isDragActive
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/30'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input {...getInputProps()} />

                  <motion.div
                    animate={isDragActive ? { y: [-5, 5, -5] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {isDragActive ? (
                      <Upload className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
                    ) : (
                      <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                    )}
                  </motion.div>

                  <p className="text-lg font-medium text-white mb-2">
                    {isDragActive ? 'Dosyayı bırakın!' : 'CSV dosyanızı sürükleyin'}
                  </p>
                  <p className="text-sm text-slate-500">
                    veya <span className="text-emerald-400">tıklayarak seçin</span>
                  </p>

                  {/* AI hint */}
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 text-xs text-slate-400">
                    <Settings className="w-4 h-4" />
                    Otomatik sütun eşlemesi aktif
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Data Loaded State */}
        {analysis && (
          <div className="space-y-12 pb-12">
            {/* Top Row: Bucket + Stats */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Wallet */}
              <div className="lg:col-span-1 flex items-center justify-center p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 min-h-[400px]">
                <LeakyWallet
                  leakVelocity={analysis.leakVelocity}
                  bucketHealth={analysis.bucketHealth}
                  lostRevenue={analysis.lostRevenue}
                />
              </div>

              {/* Stats */}
              <div className="lg:col-span-2">
                <StatCards analysis={analysis} />
              </div>
            </div>

            {/* Sector Selector */}
            <div className="sector-selector">
              <SectorSelector
                selectedSector={selectedSector}
                onSelect={setSelectedSector}
              />
            </div>

            {/* Filter Panel */}
            <div className="filter-panel-wrapper">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                totalCustomers={customers.length}
                filteredCount={analysis.topLeakedCustomers.length}
              />
            </div>

            {/* Customer Table */}
            <div className="table-section table-container">
              <div className="table-header flex items-center justify-between text-white">
                <h3 className="text-xl font-semibold flex items-center gap-3">
                  <span className="text-2xl">🚨</span>
                  Kaybedilen Değerli Müşteriler
                  <span className="badge text-sm font-normal text-slate-400 bg-slate-800/50 rounded-full border border-slate-700/50">
                    {analysis.topLeakedCustomers.length} müşteri
                  </span>
                </h3>
              </div>

              {analysis.topLeakedCustomers.length > 0 ? (
                <CustomerTable
                  customers={analysis.topLeakedCustomers}
                  onGenerateMessage={handleGenerateMessage}
                  isGenerating={isGenerating}
                />
              ) : (
                <div className="p-12 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                    <Sparkles className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-lg font-medium text-slate-300">
                    Bu kriterlere uyan kaybolan müşteri bulunamadı!
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Filtreleri genişleterek daha fazla sonuç görebilirsiniz.
                  </p>
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors border border-slate-600"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="nav-buttons flex justify-center border-t border-slate-800/50">
              <motion.button
                onClick={() => setCustomers([])}
                className="nav-btn btn flex items-center gap-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>🏠</span>
                <span>Ana Sayfaya Dön</span>
              </motion.button>

              <label className="nav-btn btn flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 cursor-pointer transition-all font-medium">
                <input {...getInputProps()} />
                <Upload className="w-5 h-5" />
                <span>Yeni CSV Yükle</span>
              </label>
            </div>
          </div>
        )}
      </main>

      {/* Message Modal */}
      <MessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        message={generatedMessage}
        isLoading={isGenerating !== null}
      />

      {/* Footer */}
      <footer className="footer relative z-10 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="footer-text text-slate-400 font-medium">
            LeakStopper – Müşterilerinizi geri kazanın, gelirinizi koruyun 💚
          </p>
          <p className="text-slate-600 text-sm mt-2">
            © 2024 LeakStopper. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
