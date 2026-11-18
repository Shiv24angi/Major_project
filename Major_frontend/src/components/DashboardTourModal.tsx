import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  TrendingUp,
  Code2,
  Users,
  DollarSign,
  Activity,
  ShieldAlert,
  FileDown,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Layers,
  MessageSquare,
} from 'lucide-react';

interface TourStep {
  id: string;
  badge: string;
  title: string;
  headline: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  laymanExplanation: string;
  howWeCalculate: string[];
  laymanTip: string;
  targetTab?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    badge: 'Step 1 of 9 • Overview',
    title: 'Welcome to VentureLens',
    headline: 'Your Autonomous AI Investment Diligence Partner',
    icon: Compass,
    iconBg: 'bg-[#EEECFC]',
    iconColor: 'text-[#5028E0]',
    laymanExplanation:
      'Think of VentureLens as your personal venture capital analyst. When someone pitches you a startup idea or shows you a software project, our AI reads their slides, checks their actual code line-by-line, tests their numbers, and gives you an honest, easy-to-understand verdict.',
    howWeCalculate: [
      'Reads pitch decks, financial PDFs, and documents (Agent 1)',
      'Inspects actual GitHub code, libraries, and tests (Agent 6)',
      'Checks for lies or contradictions between pitch and code (Agent 2)',
      'Calculates 6 fair, mathematical scores and gives an INVEST / PASS verdict (Agent 3)',
    ],
    laymanTip:
      '💡 You do not need to be a finance expert or a software engineer — VentureLens translates complex code and finance terms into plain English.',
    targetTab: 'dashboard',
  },
  {
    id: 'overall',
    badge: 'Step 2 of 9 • The Big Picture',
    title: 'Overall Score & The 4 Verdicts',
    headline: 'How to know immediately if a project is worth your money',
    icon: Sparkles,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    laymanExplanation:
      'The big Overall Score (from 0 to 100) is the weighted average of 6 key dimensions. It answers one simple question: "Is this a real business with high odds of success?"',
    howWeCalculate: [
      'INVEST (85–100): High conviction. Strong product, real code, sound finances, and great founders.',
      'MONITOR (75–84): Promising startup. Good progress, but worth watching for a few months before investing.',
      'MAYBE (65–74): Conditional prospect. Has notable risks, unproven claims, or missing financial data.',
      'PASS (Below 65): High risk. Missing code, unsustainable spending, or zero customer demand. Avoid.',
    ],
    laymanTip:
      '💡 Look at the Confidence indicator next to the score. "High" confidence means we verified both the pitch deck AND real code commits.',
    targetTab: 'dashboard',
  },
  {
    id: 'market',
    badge: 'Step 3 of 9 • 20% Weight',
    title: 'Market Score — "Is this a massive opportunity?"',
    headline: 'Checks if enough customers exist who will actually pay for this',
    icon: TrendingUp,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    laymanExplanation:
      'Even the best product will fail if nobody wants it. The Market Score checks if the startup is selling into a growing, hungry market or trying to sell ice to penguins.',
    howWeCalculate: [
      'TAM (Total Addressable Market): How many billions of dollars are spent globally in this sector. Bigger is better.',
      'CAGR (Annual Growth Rate): How fast the market is expanding every year. 20%+ means a booming market.',
      'Market Tailwinds: Positive trends (like AI adoption or government regulations) that push the company forward.',
      'Competition: Are there 50 existing giants already doing this, or is there room for a new winner?',
    ],
    laymanTip:
      '💡 A high market score means the pond has plenty of fish. Even average execution can make money in a rapidly booming market.',
    targetTab: 'dashboard',
  },
  {
    id: 'product',
    badge: 'Step 4 of 9 • 20% Weight',
    title: 'Product Score — "Is the software actually built?"',
    headline: 'Inspects real GitHub code to make sure it is not just empty talk',
    icon: Code2,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    laymanExplanation:
      'Startups love to claim they have "groundbreaking proprietary AI" in their pitch decks. Our Agent 6 actually opens their GitHub repository and audits every file to verify if the software is real, secure, and ready for customers.',
    howWeCalculate: [
      'Code Maturity: Is the code properly structured into clean services, or is it a messy prototype held together by duct tape?',
      'Feature Verification: Did they build the features they claimed on their slides, or did they just write a README?',
      'Production Tech Stack: Are they using modern, enterprise-ready tools like TypeScript, Docker, and PostgreSQL?',
      'Test Coverage: Did the developers write automated tests to make sure the app won’t crash when users log in?',
    ],
    laymanTip:
      '💡 If a repository is completely empty or has zero lines of real code, VentureLens drops this score to 20/100 to protect you from empty promises.',
    targetTab: 'agent6',
  },
  {
    id: 'team',
    badge: 'Step 5 of 9 • 20% Weight',
    title: 'Team Score — "Can these founders actually pull it off?"',
    headline: 'Evaluates the people steering the ship',
    icon: Users,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    laymanExplanation:
      'A great idea with a weak team will fail, but a strong team can turn an average idea into a billion-dollar company. The Team Score looks at the founders’ background, balance, and technical ability.',
    howWeCalculate: [
      'Technical Co-Founder Present: Is there an in-house engineer or CTO? If they have to outsource their coding to external agencies, they burn through cash rapidly.',
      'CEO + CTO Pairing: The gold standard in venture capital is one person who can build the product and one person who can sell it.',
      'Past Experience & Pedigree: Have the founders worked at top tech companies, built startups before, or earned advanced degrees in this field?',
      'Team Bandwidth: Do they have enough hands on deck (3–15 members) to move quickly without burning out?',
    ],
    laymanTip:
      '💡 Solo founders without a technical lead receive a lower score because all the pressure rests on one person.',
    targetTab: 'dashboard',
  },
  {
    id: 'financial',
    badge: 'Step 6 of 9 • 15% Weight',
    title: 'Financial Score — "Will they run out of money?"',
    headline: 'Checks cash in the bank, burn rate, and unit economics',
    icon: DollarSign,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    laymanExplanation:
      'Startups die when they run out of cash. The Financial Score inspects whether the company makes more money than it costs to acquire customers and how long they can survive without needing an emergency loan.',
    howWeCalculate: [
      'Cash Runway (Months Left): How many months can they pay salaries before their bank account hits $0. 18+ months is safe; under 6 months is dangerous.',
      'LTV / CAC Ratio: For every $1 they spend on marketing and sales (CAC), how many dollars of profit do they make back over time (LTV)? A 3x or 4x ratio is world-class.',
      'Gross Profit Margins: Software companies should have 70% to 85% gross margins because software is cheap to replicate.',
      'Annual Recurring Revenue (ARR): Reliable, predictable subscription income from real paying clients.',
    ],
    laymanTip:
      '💡 A company can have a great product, but if they spend $500 to get a customer that only pays $100, they will quickly go bankrupt.',
    targetTab: 'dashboard',
  },
  {
    id: 'traction',
    badge: 'Step 7 of 9 • 15% Weight',
    title: 'Traction Score — "Are customers actually using it?"',
    headline: 'Measures real-world user adoption and growth speed',
    icon: Activity,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    laymanExplanation:
      'Traction is the ultimate proof of Product-Market Fit. It tells you whether real customers are signing up, coming back, and telling their friends.',
    howWeCalculate: [
      'Month-over-Month Growth: Are sales and active users growing 15% to 30%+ every month?',
      'Active Paying Customers: Do they have 10, 50, or 1,000+ active users using the tool every day?',
      'Community & Developer Pull: For open-source code, we count GitHub stars, forks, and external contributors.',
      'Signed Pilots & Contracts: Signed Letters of Intent (LOIs) and enterprise pilot contracts prove commercial demand.',
    ],
    laymanTip:
      '💡 High traction forgives many flaws. If customers are banging on the door to buy, the company has found a real solution to an urgent problem.',
    targetTab: 'dashboard',
  },
  {
    id: 'risk',
    badge: 'Step 8 of 9 • 10% Weight',
    title: 'Risk Resilience — "The AI Lie Detector"',
    headline: 'Catches red flags and contradictions between pitch claims and code',
    icon: ShieldAlert,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    laymanExplanation:
      'This is VentureLens’s secret weapon. Our Agent 2 reconciles the pitch deck claims against the actual GitHub code repository and financial balance sheets.',
    howWeCalculate: [
      'Contradiction Penalties: If a pitch claims "We built custom AI algorithms" but the code only uses a simple third-party wrapper, points are deducted.',
      'Metric Sanity Checks: Flags impossible claims like "0% churn rate" or claiming a market size that is mathematically illogical.',
      'Refinancing Risk: Heavily penalizes companies with less than 6 months of cash remaining.',
      'AST Code Verification Bonus: Startups with verifiable, tested code repositories earn an immediate bonus.',
    ],
    laymanTip:
      '💡 A high Risk score (85+) means clean data, zero contradictions, and safe financial buffers.',
    targetTab: 'dashboard',
  },
  {
    id: 'features',
    badge: 'Step 9 of 9 • Superpowers',
    title: 'AI Chatbot & One-Click Exports (Agent 5)',
    headline: 'Ask any question and export professional investment memos in seconds',
    icon: FileDown,
    iconBg: 'bg-purple-50',
    iconColor: 'text-[#5028E0]',
    laymanExplanation:
      'You never have to read through hundreds of pages of documentation again. VentureLens gives you an on-demand AI Diligence Copilot and one-click institutional deliverables.',
    howWeCalculate: [
      'AI Diligence Copilot (Chatbot): Ask questions in plain English: "What are the top 3 risks?", "Who are their main rivals?", or "Are their numbers realistic?"',
      'Download Investment Memo (PDF): A complete, beautiful multi-page diligence report ready to share with partners or angel syndicates.',
      'Download Presentation (PPT): A 4-slide executive briefing deck formatted for partner meetings.',
      'Export Financial Model (Excel): Normalized spreadsheets with sensitivity tables and due diligence interview questions.',
      'Shareable Link: One-click private link to share this evaluation with co-investors.',
    ],
    laymanTip:
      '💡 Try asking the AI Chatbot: "If I invest $50,000 in this startup, what should I ask the founder in our first call?"',
    targetTab: 'reports',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function DashboardTourModal({ isOpen, onClose, onNavigateTab }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const Icon = step.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      if (onNavigateTab && TOUR_STEPS[nextIdx].targetTab) {
        onNavigateTab(TOUR_STEPS[nextIdx].targetTab!);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      if (onNavigateTab && TOUR_STEPS[prevIdx].targetTab) {
        onNavigateTab(TOUR_STEPS[prevIdx].targetTab!);
      }
    }
  };

  const handleSelectStep = (idx: number) => {
    setCurrentStepIndex(idx);
    if (onNavigateTab && TOUR_STEPS[idx].targetTab) {
      onNavigateTab(TOUR_STEPS[idx].targetTab!);
    }
  };

  return (
    <div
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        data-lenis-prevent
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#EAEBF2] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#F1F2F6] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEECFC] text-[#5028E0] flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5028E0]">
                VentureLens Interactive Tour
              </span>
              <h3 className="text-sm font-bold text-[#1E1B2E]">Beginner's Diligence Guide</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#1E1B2E] hover:bg-[#F8F9FE] transition-colors cursor-pointer"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar & Dots */}
        <div className="px-6 py-2.5 bg-[#F8F9FE] border-b border-[#EAEBF2] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 flex-1">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-8 bg-[#5028E0]'
                    : idx < currentStepIndex
                    ? 'w-3 bg-[#A594F9]'
                    : 'w-2 bg-[#E2E8F0] hover:bg-[#CBD5E1]'
                }`}
                title={`Jump to ${s.title}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-[#64748B] shrink-0 font-mono">
            {currentStepIndex + 1} / {TOUR_STEPS.length}
          </span>
        </div>

        {/* Content Body (Smoothly Scrollable with Mouse Wheel & Trackpad) */}
        <div
          data-lenis-prevent
          className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0 overscroll-contain select-text"
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Main Card Headline */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl ${step.iconBg} ${step.iconColor} flex items-center justify-center shrink-0 shadow-xs`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F1F2F6] text-[#64748B]">
                {step.badge}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#1E1B2E] leading-snug">
                {step.title}
              </h2>
              <p className="text-xs font-semibold text-[#5028E0]">{step.headline}</p>
            </div>
          </div>

          {/* Simple Layman Explanation Box */}
          <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#EAEBF2] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E1B2E]">
              <HelpCircle className="w-3.5 h-3.5 text-[#5028E0]" />
              <span>In Plain English:</span>
            </div>
            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
              {step.laymanExplanation}
            </p>
          </div>

          {/* How We Check / Calculate This */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] block">
              What VentureLens AI Checks Under The Hood:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {step.howWeCalculate.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#EAEBF2] text-xs text-[#1E1B2E]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Pro Tip */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed font-medium">
            {step.laymanTip}
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-4 bg-white border-t border-[#EAEBF2] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#1E1B2E] hover:bg-[#F8F9FE] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#64748B] transition-colors cursor-pointer"
            >
              Skip Tour
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-[#5028E0] hover:bg-[#4320BD] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <span>{isLast ? 'Finish Tour 🎉' : 'Next Step'}</span>
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
