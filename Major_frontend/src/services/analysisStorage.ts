export type AnalysisMode = 'startup' | 'project';
export type RecommendationVerdict = 'INVEST' | 'MAYBE' | 'MONITOR' | 'PASS';
export type ConfidenceLevel = 'High' | 'Moderate' | 'Low';
export type DocumentStatus = 'uploaded' | 'processing' | 'indexed' | 'failed';

export interface ScoringDimensions {
  market: number;
  product: number;
  team: number;
  financial: number;
  traction: number;
  risk: number;
}

export interface AnalysisDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  status: DocumentStatus;
  chunks: number;
  uploadDate: string;
}

export interface DueDiligenceQuestion {
  id: string;
  question: string;
  category: string;
  whyItMatters: string;
  suggestedValidation: string;
}

export interface FundingOpportunity {
  id: string;
  investorName: string;
  firm: string;
  stage: string;
  focusSectors: string[];
  checkSize: string;
  matchScore: number;
  rationale: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AnalysisRecord {
  id: string;
  title: string;
  mode: AnalysisMode;
  tagline: string;
  industry: string;
  website?: string;
  stage: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
  isDemo: boolean;
  overallScore: number;
  recommendation: RecommendationVerdict;
  confidence: ConfidenceLevel;
  thesis: string;
  scores: ScoringDimensions;
  keyInsights: {
    strengths: string[];
    risks: string[];
    opportunities: string[];
    nextSteps: string[];
  };
  dueDiligenceQuestions: DueDiligenceQuestion[];
  documents: AnalysisDocument[];
  codeDetails?: {
    githubUrl: string;
    techStack: string[];
    features: string[];
    technicalStrengths: string[];
    technicalConcerns: string[];
    filesDiscovered: number;
    filesRead: number;
  };
  fundingMatches: FundingOpportunity[];
  chatHistory: ChatMessage[];
}

const STORAGE_KEY = 'venturelens_analyses_v1';
const ACTIVE_ANALYSIS_KEY = 'venturelens_active_analysis_id';

// Initial verified & illustrative seed analyses matching the VentureLens platform
export const SEED_ANALYSES: AnalysisRecord[] = [
  {
    id: 'eval_airbnb_01',
    title: 'Airbnb',
    mode: 'startup',
    tagline: 'Short-term rental marketplace',
    industry: 'Travel',
    website: 'https://airbnb.com',
    stage: 'Growth / Series B',
    createdAt: '2025-09-06T10:00:00Z',
    status: 'completed',
    isDemo: true,
    overallScore: 82,
    recommendation: 'MAYBE',
    confidence: 'Moderate',
    thesis:
      'Strong market opportunity and founding team, but traction and financial efficiency require further validation.',
    scores: {
      market: 88,
      product: 84,
      team: 90,
      financial: 79,
      traction: 76,
      risk: 68,
    },
    keyInsights: {
      strengths: [
        'Significant and growing demand for alternative accommodations.',
        'Strong execution track record and domain expertise.',
        'Asset-light model with high scalability potential.',
      ],
      risks: [
        'High customer acquisition costs and increasing competition in core markets.',
      ],
      opportunities: [
        'International cross-border travel expansion into European leisure hubs.',
        'Boutique hotel aggregation and long-term remote worker stays.',
      ],
      nextSteps: [
        'Audit customer acquisition cost sensitivity across Google organic vs. paid search.',
        'Review repeat host retention and municipal compliance risks in top 20 cities.',
      ],
    },
    dueDiligenceQuestions: [
      {
        id: 'q1',
        question: 'What explains the recent increase in CAC?',
        category: 'Unit Economics',
        whyItMatters: 'Rising customer acquisition costs directly compress contribution margins.',
        suggestedValidation: 'Examine blended vs. paid acquisition channels and cohort payback periods.',
      },
      {
        id: 'q2',
        question: 'How sustainable is the reported revenue growth?',
        category: 'Market Dynamics',
        whyItMatters: 'Post-expansion growth rates must outpace local municipal regulation friction.',
        suggestedValidation: 'Analyze booking frequency of repeat vs. first-time travelers.',
      },
      {
        id: 'q3',
        question: 'What evidence supports the claimed market size?',
        category: 'Market Sizing',
        whyItMatters: 'TAM projections need validation beyond top-50 urban tourism hubs.',
        suggestedValidation: 'Cross-reference third-party hospitality occupancy benchmarks.',
      },
      {
        id: 'q4',
        question: "How defensible is the company's competitive advantage?",
        category: 'Moat & Network Effects',
        whyItMatters: 'Two-sided host/guest marketplace requires high liquidity switching barriers.',
        suggestedValidation: 'Assess multi-homing rates among professional superhosts.',
      },
      {
        id: 'q5',
        question: 'What are the key assumptions in the financial projections?',
        category: 'Financial Projections',
        whyItMatters: 'Overly aggressive take-rate assumptions can distort long-term DCF valuations.',
        suggestedValidation: 'Review sensitivity analysis around 12% to 15% transaction take-rates.',
      },
    ],
    documents: [
      {
        id: 'doc_1',
        name: 'Airbnb Pitch Deck.pdf',
        type: 'Pitch Deck (PDF)',
        size: '5.2 MB',
        status: 'indexed',
        chunks: 4210,
        uploadDate: '2025-09-06',
      },
      {
        id: 'doc_2',
        name: 'Financials 2024.xlsx',
        type: 'Financial Model (Excel)',
        size: '2.8 MB',
        status: 'indexed',
        chunks: 3890,
        uploadDate: '2025-09-06',
      },
      {
        id: 'doc_3',
        name: 'Founder_Info.pdf',
        type: 'Background Brief (PDF)',
        size: '1.4 MB',
        status: 'indexed',
        chunks: 1842,
        uploadDate: '2025-09-06',
      },
      {
        id: 'doc_4',
        name: 'Market_Research.pdf',
        type: 'Industry Report (PDF)',
        size: '3.6 MB',
        status: 'indexed',
        chunks: 2540,
        uploadDate: '2025-09-06',
      },
    ],
    fundingMatches: [
      {
        id: 'fund_1',
        investorName: 'Roelof Botha',
        firm: 'Sequoia Capital',
        stage: 'Series B • Global',
        focusSectors: ['Marketplaces', 'Consumer Tech', 'Travel'],
        checkSize: '$5M - $20M',
        matchScore: 92,
        rationale: 'Top-tier marketplace thesis with global consumer network effect syndication.',
      },
      {
        id: 'fund_2',
        investorName: 'Marc Andreessen',
        firm: 'Andreessen Horowitz',
        stage: 'Series A • US',
        focusSectors: ['Consumer Internet', 'Digital Platforms'],
        checkSize: '$3M - $15M',
        matchScore: 88,
        rationale: 'Strong alignment on category-defining platforms and global liquidity.',
      },
      {
        id: 'fund_3',
        investorName: 'Jim Breyer',
        firm: 'Accel',
        stage: 'Series B • Global',
        focusSectors: ['Global Networks', 'Consumer Tech'],
        checkSize: '$5M - $18M',
        matchScore: 85,
        rationale: 'Active deployment thesis backing cross-border consumer marketplace scale.',
      },
    ],
    chatHistory: [
      {
        id: 'c1',
        role: 'assistant',
        text: 'I have ingested Airbnb’s pitch deck, financial model, and market research. You can ask me about its 82/100 score, unit economics, or due diligence risks.',
        timestamp: 'Sep 6, 2025',
      },
    ],
  },
  {
    id: 'eval_ecoverse_01',
    title: 'EcoVerse Platform',
    mode: 'project',
    tagline: 'Decentralized ecological asset verification and carbon telemetry engine.',
    industry: 'Climate Tech / Web3 Infrastructure',
    website: 'https://github.com/Shiv24angi/EcoVerse',
    stage: 'Open Source / Alpha',
    createdAt: '2026-09-06T14:30:00Z',
    status: 'completed',
    isDemo: true,
    overallScore: 84,
    recommendation: 'MONITOR',
    confidence: 'Moderate',
    thesis:
      'High technical maturity and innovative smart-contract verification architecture for carbon credits. Significant market potential in ESG compliance, but enterprise B2B sales cycle and regulatory validation require proof of traction.',
    scores: {
      market: 82,
      product: 88,
      team: 78,
      financial: 72,
      traction: 70,
      risk: 86,
    },
    keyInsights: {
      strengths: [
        'Modular Next.js & TypeScript architecture with robust smart-contract state verification',
        'Real-time carbon telemetry streaming pipeline with sub-second recalculation',
        'Clear problem formulation tackling greenwashing with cryptographically verifiable proofs',
      ],
      risks: [
        'Enterprise revenue monetization model relies on voluntary carbon offset markets with pricing volatility',
        'Integration dependencies on third-party IoT sensor feeds without guaranteed cryptographic provenance',
        'Regulatory reporting standards (CSRD / SEC) require certified audit trails not yet implemented',
      ],
      opportunities: [
        'B2B SaaS licensing for Fortune 500 sustainability accounting compliance',
        'Integration with municipal renewable energy credits and ESG bond verification',
      ],
      nextSteps: [
        'Conduct pilot deployment with 2 institutional corporate carbon credit buyers',
        'Formal smart contract security audit and stress-testing on live testnets',
      ],
    },
    dueDiligenceQuestions: [
      {
        id: 'q1',
        question: 'How does the telemetry pipeline handle oracle failure or sensor data manipulation?',
        category: 'Technical Robustness',
        whyItMatters: 'If sensor feeds can be spoofed, the underlying carbon credit verification is compromised.',
        suggestedValidation: 'Inspect multi-signature oracle aggregation tests and data ingestion fallbacks.',
      },
      {
        id: 'q2',
        question: 'What is the projected CAC and sales cycle length for enterprise compliance buyers?',
        category: 'Financial Viability',
        whyItMatters: 'Enterprise ESG procurement cycles often exceed 9-12 months without dedicated channel partnerships.',
        suggestedValidation: 'Request customer pipeline data and letters of intent (LOIs).',
      },
    ],
    documents: [
      {
        id: 'doc_1',
        name: 'EcoVerse_Architecture_Spec.pdf',
        type: 'PDF Specification',
        size: '2.4 MB',
        status: 'indexed',
        chunks: 48,
        uploadDate: '2026-09-06',
      },
      {
        id: 'doc_2',
        name: 'GitHub_Repository_Audit.json',
        type: 'Codebase Audit',
        size: '512 KB',
        status: 'indexed',
        chunks: 24,
        uploadDate: '2026-09-06',
      },
      {
        id: 'doc_3',
        name: 'Carbon_Methodology_Whitepaper.pdf',
        type: 'Whitepaper',
        size: '1.8 MB',
        status: 'indexed',
        chunks: 36,
        uploadDate: '2026-09-06',
      },
    ],
    codeDetails: {
      githubUrl: 'https://github.com/Shiv24angi/EcoVerse',
      techStack: ['Next.js 14', 'TypeScript', 'Prisma', 'Solidity', 'TailwindCSS', 'PostgreSQL'],
      features: [
        'Carbon credit verification smart contracts',
        'Real-time telemetry dashboard',
        'Enterprise organization role management',
        'Cryptographic audit trail exports',
      ],
      technicalStrengths: [
        'Clean modular repository layout separating frontend, contracts, and services',
        'High test coverage on cryptographic signature verification modules',
      ],
      technicalConcerns: [
        'Off-chain database caching must be synchronized strictly with blockchain state events',
      ],
      filesDiscovered: 142,
      filesRead: 18,
    },
    fundingMatches: [
      {
        id: 'fund_1',
        investorName: 'Elena Vance',
        firm: 'Planet Ventures Seed Fund',
        stage: 'Pre-Seed / Seed',
        focusSectors: ['Climate Tech', 'ESG Software', 'Decentralized Tech'],
        checkSize: '$250K - $750K',
        matchScore: 92,
        rationale: 'Active fund thesis backing verified carbon accounting and scalable measurement software.',
      },
      {
        id: 'fund_2',
        investorName: 'Marcus Cole',
        firm: 'Verdant Horizon Capital',
        stage: 'Seed / Series A',
        focusSectors: ['Energy Transition', 'Climate FinTech'],
        checkSize: '$500K - $1.5M',
        matchScore: 86,
        rationale: 'Portfolio synergies with corporate sustainability compliance software.',
      },
    ],
    chatHistory: [
      {
        id: 'c1',
        role: 'assistant',
        text: "I am ready to answer detailed questions about the EcoVerse Platform evaluation. You can ask about its 84/100 score, the smart-contract architecture, or the MONITOR recommendation.",
        timestamp: '14:32',
      },
    ],
  },
  {
    id: 'eval_novaflow_02',
    title: 'NovaFlow AI',
    mode: 'startup',
    tagline: 'Autonomous AI agents for enterprise supply-chain exception handling.',
    industry: 'Enterprise SaaS / AI Automation',
    website: 'https://novaflow.ai',
    stage: 'Seed',
    createdAt: '2026-09-07T10:15:00Z',
    status: 'completed',
    isDemo: true,
    overallScore: 89,
    recommendation: 'INVEST',
    confidence: 'High',
    thesis:
      'Compelling product-market fit demonstrated by $42K MRR growing 24% month-over-month. Repeat founder team from Flexport and Palantir. Technical defense lies in proprietary orchestration graphs and pre-built ERP integrations.',
    scores: {
      market: 91,
      product: 92,
      team: 94,
      financial: 85,
      traction: 88,
      risk: 84,
    },
    keyInsights: {
      strengths: [
        'Proprietary ERP connector mesh reducing enterprise onboarding from 3 months to 48 hours',
        'Gross revenue retention at 104% across 8 enterprise manufacturing pilot accounts',
        'Exceptional founder pedigree with direct domain mastery in logistics orchestration',
      ],
      risks: [
        'Concentration of 48% of current ARR in top two enterprise accounts',
        'Potential pricing pressure if legacy ERP providers release native agent copilots',
      ],
      opportunities: [
        'Expansion into European maritime customs automation ahead of upcoming regulatory deadlines',
        'Tiered usage-based monetization on automated transaction recovery fees',
      ],
      nextSteps: [
        'Deep-dive audit into customer retention cohort data',
        'Review contract terms on the top 2 enterprise pilot renewals',
      ],
    },
    dueDiligenceQuestions: [
      {
        id: 'q1',
        question: 'What is the contractual term and renewal certainty for the two pilot customers representing 48% ARR?',
        category: 'Customer Concentration',
        whyItMatters: 'Loss of either anchor customer would severely depress valuation and runway.',
        suggestedValidation: 'Examine MSAs, SOWs, and pilot conversion milestones.',
      },
      {
        id: 'q2',
        question: 'How easily can SAP or Oracle replicate NovaFlow’s exception-resolution graphs natively?',
        category: 'Defensibility',
        whyItMatters: 'Moat relies on multi-ERP interoperability rather than generic LLM workflows.',
        suggestedValidation: 'Review technical integration patents and customer switching cost dynamics.',
      },
    ],
    documents: [
      {
        id: 'doc_1',
        name: 'NovaFlow_Seed_Deck_Final.pdf',
        type: 'Pitch Deck',
        size: '8.6 MB',
        status: 'indexed',
        chunks: 62,
        uploadDate: '2026-09-07',
      },
      {
        id: 'doc_2',
        name: 'NovaFlow_Q2_Financial_Model.xlsx',
        type: 'Financials',
        size: '1.2 MB',
        status: 'indexed',
        chunks: 38,
        uploadDate: '2026-09-07',
      },
      {
        id: 'doc_3',
        name: 'Founder_Bios_&_CapTable.pdf',
        type: 'Founder Info',
        size: '940 KB',
        status: 'indexed',
        chunks: 19,
        uploadDate: '2026-09-07',
      },
    ],
    fundingMatches: [
      {
        id: 'fund_1',
        investorName: 'Sarah Jenkins',
        firm: 'Apex Frontier Partners',
        stage: 'Seed / Series A',
        focusSectors: ['B2B SaaS', 'Supply Chain', 'Enterprise AI'],
        checkSize: '$1M - $3M',
        matchScore: 96,
        rationale: 'Mandate to lead Seed rounds in enterprise automation with proven recurring revenue traction.',
      },
      {
        id: 'fund_2',
        investorName: 'David Zhang',
        firm: 'NextGen Industrial Ventures',
        stage: 'Seed',
        focusSectors: ['Logistics Tech', 'Manufacturing AI'],
        checkSize: '$500K - $1.5M',
        matchScore: 91,
        rationale: 'Portfolio includes major automotive suppliers eager to deploy automated exception handling.',
      },
    ],
    chatHistory: [
      {
        id: 'c1',
        role: 'assistant',
        text: "I am ready to answer questions about NovaFlow AI's 89/100 score, its 91+ market and product ratings, or the INVEST investment thesis.",
        timestamp: '10:16',
      },
    ],
  },
];

export function getStoredAnalyses(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ANALYSES));
      return SEED_ANALYSES;
    }
    const parsed = JSON.parse(raw) as AnalysisRecord[];
    const hasAirbnb = parsed.some((a) => a.id === 'eval_airbnb_01');
    if (!hasAirbnb) {
      const merged = [SEED_ANALYSES[0], ...parsed];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed.length > 0 ? parsed : SEED_ANALYSES;
  } catch (e) {
    console.warn('Failed to parse analyses from localStorage, using seeds', e);
    return SEED_ANALYSES;
  }
}

export function saveAnalyses(analyses: AnalysisRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
  } catch (e) {
    console.error('Failed to save analyses to localStorage', e);
  }
}

export function getAnalysisById(id: string): AnalysisRecord | undefined {
  const analyses = getStoredAnalyses();
  return analyses.find((a) => a.id === id);
}

export function getActiveAnalysis(): AnalysisRecord {
  const analyses = getStoredAnalyses();
  const activeId = localStorage.getItem(ACTIVE_ANALYSIS_KEY);
  if (activeId) {
    const found = analyses.find((a) => a.id === activeId);
    if (found) return found;
  }
  return analyses[0];
}

export function setActiveAnalysisId(id: string): void {
  localStorage.setItem(ACTIVE_ANALYSIS_KEY, id);
}

export function addAnalysis(record: AnalysisRecord): void {
  const analyses = getStoredAnalyses();
  const existingIndex = analyses.findIndex((a) => a.id === record.id);
  let updated: AnalysisRecord[];
  if (existingIndex >= 0) {
    updated = [...analyses];
    updated[existingIndex] = record;
  } else {
    updated = [record, ...analyses];
  }
  saveAnalyses(updated);
  setActiveAnalysisId(record.id);
}

export function updateAnalysisChat(analysisId: string, message: ChatMessage): void {
  const analyses = getStoredAnalyses();
  const target = analyses.find((a) => a.id === analysisId);
  if (target) {
    target.chatHistory = [...target.chatHistory, message];
    saveAnalyses(analyses);
  }
}
