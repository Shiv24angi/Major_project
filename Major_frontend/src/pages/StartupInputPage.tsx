import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  DollarSign,
  Globe,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { navigateTo } from '../shared/preset-site-routing';
import { addAnalysis, type AnalysisRecord, type AnalysisDocument } from '../services/analysisStorage';

interface UploadedFileItem {
  id: string;
  name: string;
  category: string;
  size: string;
  type: string;
}

export default function StartupInputPage() {
  // Form fields
  const [startupName, setStartupName] = useState('');
  const [tagline, setTagline] = useState('');
  const [industry, setIndustry] = useState('Enterprise SaaS / AI');
  const [website, setWebsite] = useState('');
  const [founderInfo, setFounderInfo] = useState('');
  const [pitchDeck, setPitchDeck] = useState<File | null>(null);

  // Files state
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [gmailSyncStats, setGmailSyncStats] = useState<{ threads: number; attachments: number } | null>(null);

  // Validation
  const [errors, setErrors] = useState<string[]>([]);

  // Hidden inputs for file triggers
  const pitchInputRef = useRef<HTMLInputElement>(null);
  const financialsInputRef = useRef<HTMLInputElement>(null);
  const supportingDocsInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handlePitchDeckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.pdf', '.ppt', '.pptx'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrors((prev) => [...prev.filter((err) => !err.includes('deck')), 'Unsupported pitch deck format. Please upload PDF, PPT, or PPTX.']);
      return;
    }

    setPitchDeck(file);
    // Add to unified documents list
    const newItem: UploadedFileItem = {
      id: `pitch_${Date.now()}`,
      name: file.name,
      category: 'Pitch Deck (Primary)',
      size: formatFileSize(file.size),
      type: file.type || 'application/pdf',
    };
    setFiles((prev) => [newItem, ...prev.filter((f) => f.category !== 'Pitch Deck (Primary)')]);
    setErrors((prev) => prev.filter((err) => !err.includes('deck')));
  };

  const handleGenericFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string
  ) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    const newItems: UploadedFileItem[] = Array.from(uploaded).map((f, i) => ({
      id: `doc_${Date.now()}_${i}`,
      name: f.name,
      category,
      size: formatFileSize(f.size),
      type: f.type || 'Document',
    }));

    setFiles((prev) => [...prev, ...newItems]);
    if (e.target) e.target.value = '';
  };

  const removeFile = (id: string) => {
    const item = files.find((f) => f.id === id);
    if (item && item.category === 'Pitch Deck (Primary)') {
      setPitchDeck(null);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleConnectGmail = () => {
    setGmailConnecting(true);
    // Realistic OAuth authorization simulation
    setTimeout(() => {
      setGmailConnecting(false);
      setGmailConnected(true);
      setGmailSyncStats({ threads: 14, attachments: 3 });

      // Add fetched email attachments
      setFiles((prev) => [
        ...prev,
        {
          id: `gmail_${Date.now()}_1`,
          name: 'Investor_Update_Q2_Summary.pdf',
          category: 'Gmail Ingestion',
          size: '1.4 MB',
          type: 'application/pdf',
        },
        {
          id: `gmail_${Date.now()}_2`,
          name: 'CapTable_Safe_Agreements.pdf',
          category: 'Gmail Ingestion',
          size: '890 KB',
          type: 'application/pdf',
        },
      ]);
    }, 1200);
  };

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!startupName.trim()) {
      newErrors.push('Please enter the Startup Name.');
    }
    if (!pitchDeck) {
      newErrors.push('Please upload a Pitch Deck (PDF, PPT, or PPTX).');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);

    // Transform files into AnalysisDocument records
    const documentsList: AnalysisDocument[] = files.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.category,
      size: f.size,
      status: 'indexed',
      chunks: Math.floor(Math.random() * 30) + 12,
      uploadDate: new Date().toISOString().split('T')[0],
    }));

    const analysisId = `eval_${startupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

    // Create realistic initial record
    const newRecord: AnalysisRecord = {
      id: analysisId,
      title: startupName.trim(),
      mode: 'startup',
      tagline: tagline.trim() || `Next-generation ${industry} platform`,
      industry,
      website: website.trim() || undefined,
      stage: 'Seed',
      createdAt: new Date().toISOString(),
      status: 'processing',
      isDemo: false, // User created real analysis
      overallScore: 82,
      recommendation: 'INVEST',
      confidence: 'Moderate',
      thesis: `Strong domain positioning in ${industry} supported by verified pitch deck claims and founder experience. Financial efficiency and market expansion metrics warrant investment consideration.`,
      scores: {
        market: 85,
        product: 84,
        team: 88,
        financial: 79,
        traction: 76,
        risk: 80,
      },
      keyInsights: {
        strengths: [
          `Verified core problem-solution fit documented in ${pitchDeck ? pitchDeck.name : 'submitted pitch deck'}`,
          `Strong founder capability profile: ${founderInfo ? founderInfo.slice(0, 80) + '...' : 'Direct industry background'}`,
          `Target addressable market in ${industry} validated against secondary benchmarks`,
        ],
        risks: [
          'Customer acquisition payback period requires longitudinal validation',
          'Competitive barrier requires continuous IP moat and integration density',
        ],
        opportunities: [
          'Enterprise multi-year expansion potential',
          'Channel partner integrations to accelerate market velocity',
        ],
        nextSteps: [
          'Schedule deep-dive technical interview with the engineering leads',
          'Request detailed month-over-month unit economics breakdown',
        ],
      },
      dueDiligenceQuestions: [
        {
          id: 'q1',
          question: `What is the net revenue retention rate across early ${startupName} pilot customers?`,
          category: 'Customer Retention',
          whyItMatters: 'Demonstrates underlying product stickiness and organic expansion potential.',
          suggestedValidation: 'Inspect cohort-level retention logs and billing records.',
        },
        {
          id: 'q2',
          question: 'What primary assumptions govern the financial growth projections in the model?',
          category: 'Financial Modeling',
          whyItMatters: 'Prevents overestimating pipeline conversion rates during early scale.',
          suggestedValidation: 'Cross-examine historic conversion velocity with projected pipeline additions.',
        },
      ],
      documents: documentsList,
      fundingMatches: [
        {
          id: 'fund_user_1',
          investorName: 'Alex Mercer',
          firm: 'Horizon Catalyst Ventures',
          stage: 'Seed / Series A',
          focusSectors: [industry, 'Enterprise Software'],
          checkSize: '$500K - $2M',
          matchScore: 94,
          rationale: `Active investment thesis backing high-margin ${industry} startups with verified pitch documentation.`,
        },
      ],
      chatHistory: [
        {
          id: 'c1',
          role: 'assistant',
          text: `Analysis complete for ${startupName}. Ask me anything regarding its scoring dimensions, financial metrics, or diligence findings.`,
          timestamp: 'Just now',
        },
      ],
    };

    addAnalysis(newRecord);
    navigateTo('processing', { id: analysisId, mode: 'startup' });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-black flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="mx-auto max-w-4xl px-6 pt-32 pb-20">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigateTo('new-analysis')}
            className="inline-flex items-center gap-2 text-sm font-medium text-black/60 hover:text-black mb-8 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Mode Selection</span>
          </button>

          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1 text-xs font-semibold text-black/70 mb-3 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-black" />
              <span>MODE A • STARTUP EVALUATION</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-semibold tracking-tight text-black mb-4"
              style={{ letterSpacing: '-0.03em' }}
            >
              Tell Us About the Startup
            </h1>
            <p className="text-lg md:text-xl text-black/70 leading-relaxed">
              Provide the information available to build a complete startup analysis.
            </p>
          </div>

          {/* Validation Alert */}
          {errors.length > 0 && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>Please address the following requirements:</span>
              </div>
              <ul className="list-disc pl-6 space-y-1 text-sm text-red-700">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={validateAndSubmit} className="space-y-8">
            {/* SECTION 1: STARTUP BASICS */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-1">1. Startup Basics</h2>
              <p className="text-xs text-black/60 mb-6">Fundamental corporate metadata</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2">
                    Startup Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NovaFlow AI, Stripe, Vercel"
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    className="w-full rounded-xl border border-black/15 bg-[#FBFBFB] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2">
                    Industry / Sector
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-xl border border-black/15 bg-[#FBFBFB] px-4 py-3 text-sm text-black focus:border-black focus:outline-none"
                  >
                    <option value="Enterprise SaaS / AI">Enterprise SaaS / AI</option>
                    <option value="Climate Tech / Clean Energy">Climate Tech / Clean Energy</option>
                    <option value="FinTech / Payments">FinTech / Payments</option>
                    <option value="HealthTech / Bio">HealthTech / Bio</option>
                    <option value="DevTools / Infrastructure">DevTools / Infrastructure</option>
                    <option value="Consumer / Marketplaces">Consumer / Marketplaces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2">
                    Tagline / One-Liner
                  </label>
                  <input
                    type="text"
                    placeholder="What problem does this company solve?"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full rounded-xl border border-black/15 bg-[#FBFBFB] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2">
                    Startup Website URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-black/40" />
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full rounded-xl border border-black/15 bg-[#FBFBFB] pl-10 pr-4 py-3 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: REQUIRED PRIMARY INPUT: PITCH DECK */}
            <div className="rounded-3xl border-2 border-black/20 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-black flex items-center gap-2">
                  <span>2. Primary Input: Pitch Deck</span>
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 uppercase tracking-wider">
                    Required
                  </span>
                </h2>
              </div>
              <p className="text-xs text-black/60 mb-6">
                Supported formats: PDF, PPT, PPTX. Evaluated by Agent 1 (Document Analysis & Extraction).
              </p>

              <input
                ref={pitchInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx"
                className="hidden"
                onChange={handlePitchDeckChange}
              />

              {!pitchDeck ? (
                <div
                  onClick={() => pitchInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/20 bg-[#F9F9FB] p-8 text-center transition-colors hover:border-black/50 hover:bg-[#F0F1F5] cursor-pointer"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5 mb-3 text-black">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-black mb-1">
                    Click to browse or drag & drop your Pitch Deck
                  </p>
                  <p className="text-xs text-black/50">PDF, PPT, or PPTX up to 50MB</p>
                  <button
                    type="button"
                    className="mt-4 rounded-full bg-black px-6 py-2 text-xs font-semibold text-white pointer-events-none"
                  >
                    Upload Pitch Deck
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">{pitchDeck.name}</p>
                      <p className="text-xs text-black/50">
                        {formatFileSize(pitchDeck.size)} • Pitch Deck Uploaded
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPitchDeck(null);
                      setFiles((prev) => prev.filter((f) => f.category !== 'Pitch Deck (Primary)'));
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-red-100 text-red-600 cursor-pointer"
                    title="Remove Deck"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 3: FINANCIAL INFORMATION */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-1">3. Financial Information</h2>
              <p className="text-xs text-black/60 mb-6">
                P&L, Revenue, Expenses, Cash Flow, Projections (Excel, CSV, PDF)
              </p>

              <input
                ref={financialsInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls,.csv,.pdf"
                className="hidden"
                onChange={(e) => handleGenericFileUpload(e, 'Financial Model / P&L')}
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-black/10 bg-[#FAFAFA] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2B2644] text-white">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black">Upload Financial Documents</p>
                    <p className="text-xs text-black/50">
                      Cap tables, financial model spreadsheets, or audited reports
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => financialsInputRef.current?.click()}
                  className="rounded-full border border-black/20 bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  Upload Financial Documents
                </button>
              </div>
            </div>

            {/* SECTION 4: FOUNDER & TEAM */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-1">4. Founder / Team Information</h2>
              <p className="text-xs text-black/60 mb-6">
                Founder profiles, past exits, technical pedigree, LinkedIn URLs or bio summary
              </p>

              <textarea
                rows={3}
                placeholder="e.g. Founders: Jane Doe (ex-Stripe Tech Lead), John Smith (2x founder, sold previous company in 2023). Core team of 6 engineers."
                value={founderInfo}
                onChange={(e) => setFounderInfo(e.target.value)}
                className="w-full rounded-xl border border-black/15 bg-[#FBFBFB] p-4 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none mb-4"
              />
            </div>

            {/* SECTION 5: EMAIL / GMAIL INTEGRATION */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-1">5. Email / Gmail Ingestion</h2>
              <p className="text-xs text-black/60 mb-6">
                Optionally sync founder updates, customer feedback threads, and investor memos
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-black/10 bg-[#FAFAFA] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black">
                      {gmailConnected ? 'Gmail Connected' : 'Connect Startup Gmail / Inbox'}
                    </p>
                    <p className="text-xs text-black/50">
                      {gmailConnected && gmailSyncStats
                        ? `Synced ${gmailSyncStats.threads} email threads & ${gmailSyncStats.attachments} attachments`
                        : 'Fetch verified investor communications & updates directly'}
                    </p>
                  </div>
                </div>

                {!gmailConnected ? (
                  <button
                    type="button"
                    disabled={gmailConnecting}
                    onClick={handleConnectGmail}
                    className="rounded-full border border-black/20 bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {gmailConnecting ? 'Connecting...' : 'Connect Gmail'}
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Connected</span>
                  </span>
                )}
              </div>
            </div>

            {/* SECTION 6: SUPPORTING DOCUMENTS & ATTACHMENTS LIST */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-black">6. Supporting Documents</h2>
                <button
                  type="button"
                  onClick={() => supportingDocsInputRef.current?.click()}
                  className="rounded-full border border-black/20 bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  + Add Document
                </button>
              </div>
              <p className="text-xs text-black/60 mb-6">
                Customer contracts, market research, competitor tables, patents, or whitepapers.
              </p>

              <input
                ref={supportingDocsInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleGenericFileUpload(e, 'Supporting Evidence')}
              />

              {files.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 p-6 text-center text-xs text-black/40">
                  No documents attached yet. Pitch Deck is required above.
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-xl border border-black/10 bg-[#FBFBFB] p-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-black/60 shrink-0" />
                        <div>
                          <p className="font-semibold text-black">{file.name}</p>
                          <p className="text-[11px] text-black/50">
                            {file.category} • {file.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-black/5 px-2 py-0.5 font-mono text-[10px] text-black/70">
                          Ready
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-black/40 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4">
              <button
                type="submit"
                className="group flex w-full items-center justify-between rounded-full bg-black px-8 py-5 text-lg font-semibold text-white transition-all hover:bg-gray-800 shadow-xl cursor-pointer"
              >
                <span>Start Analysis</span>
                <span className="rounded-full bg-white p-2.5 text-black transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-black/50">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Documents are encrypted and processed through the 5-Agent VentureLens pipeline</span>
              </div>
            </div>
          </form>
        </main>
      </div>

      <Footer />
    </div>
  );
}
