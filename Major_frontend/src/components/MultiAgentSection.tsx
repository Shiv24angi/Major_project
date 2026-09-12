import { useRef, useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Binary,
  BarChart3,
  Compass,
  FileDown,
  Code2,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  ShieldCheck,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Card3D } from './ui/animated-3d-card';

export default function MultiAgentSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  const agents = [
    {
      id: '01',
      agentNum: 'Agent 1',
      title: 'DOCUMENT ANALYSIS',
      role: 'Document Analysis & Structured Extraction',
      description:
        'Extracts and structures key startup information from the provided documents.',
      gradient: 'from-[#2B2644] via-[#221c38] to-[#141122]',
      icon: <FileText className="h-6 w-6 text-white/90" />,
      tag: 'Step 01 • Ingestion',
      isSeparatePath: false,
      downstream: 'Pipes structured data to Agent 2',
      detailsTitle: 'Information Extracted:',
      items: [
        'Startup information & overview',
        'Founder / team profiles',
        'Product & problem-solution fit',
        'Business model & monetization',
        'Revenue / ARR / MRR',
        'Funding & investor history',
        'Customers & traction signals',
        'TAM / SAM / SOM market sizing',
        'Risks & competitor mentions',
        'Key performance metrics',
      ],
      notice: 'Document Analysis & Structured Information Extraction (not a generic research agent).',
    },
    {
      id: '02',
      agentNum: 'Agent 2',
      title: 'DATA NORMALIZATION',
      role: 'Data Extraction & Schema Normalization',
      description:
        'Validates, normalizes, deduplicates, and structures extracted information.',
      gradient: 'from-[#1E2548] via-[#1a1f3c] to-[#111428]',
      icon: <Binary className="h-6 w-6 text-cyan-300" />,
      tag: 'Step 02 • Pipeline',
      isSeparatePath: false,
      downstream: 'Prepares consistent data for Agent 3',
      detailsTitle: 'Core Responsibilities:',
      items: [
        'Normalize extracted data into uniform schemas',
        'Validate data completeness & consistency',
        'Deduplicate conflicting information',
        'Structure data for downstream scoring',
        'Prepare consistent inputs for analysis',
        'Ingests technical findings from Agent 6 (Code Analysis)',
      ],
      notice: 'Takes extracted data and structures it for scoring and downstream analysis.',
    },
    {
      id: '03',
      agentNum: 'Agent 3',
      title: 'SCORING',
      role: 'Analytical Scoring Engine',
      description:
        'Evaluates the startup across market, product, team, financial, traction, and risk dimensions.',
      gradient: 'from-[#2E1F4A] via-[#24173d] to-[#140b24]',
      icon: <BarChart3 className="h-6 w-6 text-purple-300" />,
      tag: 'Step 03 • Scoring',
      isSeparatePath: false,
      downstream: 'Pushes calibrated scores to Agent 4',
      detailsTitle: 'Actual Scoring Dimensions:',
      items: [
        'Market Score',
        'Product Score',
        'Team Score',
        'Financial Score',
        'Traction Score',
        'Risk Score',
      ],
      notice:
        'Handled by the Scoring Engine — these are 6 scoring dimensions, NOT separate AI agents.',
    },
    {
      id: '04',
      agentNum: 'Agent 4',
      title: 'INSIGHTS & RECOMMENDATION',
      role: 'Insight & Recommendation Generator',
      description:
        'Generates the investment thesis, strengths, risks, opportunities, next steps, and recommendation.',
      gradient: 'from-[#173836] via-[#122c2a] to-[#0a1b1a]',
      icon: <Compass className="h-6 w-6 text-emerald-300" />,
      tag: 'Step 04 • Synthesis',
      isSeparatePath: false,
      downstream: 'Sends thesis & synthesis to Agent 5',
      detailsTitle: 'Actual System Outputs:',
      items: [
        'Investment Thesis formulation',
        'Key Validated Strengths',
        'Risks & Governance Concerns',
        'Market & Product Opportunities',
        'Diligence Next Steps',
        'Recommendation: INVEST',
        'Recommendation: MONITOR / CONSIDER',
        'Recommendation: PASS',
      ],
      notice:
        'Generates comprehensive investment insights and concrete recommendations (INVEST / MONITOR / PASS).',
    },
    {
      id: '05',
      agentNum: 'Agent 5',
      title: 'REPORT GENERATION',
      role: 'Report Generator',
      description:
        'Transforms the completed analysis into professional reports and shareable outputs.',
      gradient: 'from-[#162D4A] via-[#12233b] to-[#0a1626]',
      icon: <FileDown className="h-6 w-6 text-blue-300" />,
      tag: 'Step 05 • Outputs',
      isSeparatePath: false,
      downstream: 'Delivers multi-format reports for committee review',
      detailsTitle: 'Supported Output Formats:',
      items: [
        'Institutional PDF Diligence Memo',
        'Presentation Deck (PPT)',
        'Financial & Metric Spreadsheet (Excel)',
        'Shareable Web Report / Live Link',
      ],
      notice: 'Report generation stage converting verified analysis into institutional deliverables.',
    },
    {
      id: '06',
      agentNum: 'Agent 6',
      title: 'PROJECT → STARTUP',
      role: 'Project → Startup Agent (Separate Path)',
      description:
        'Analyzes an existing software project or GitHub repository using code analysis and Code RAG to evaluate its technical and startup potential.',
      gradient: 'from-[#3B2236] via-[#2D1929] to-[#1C0E1A]',
      icon: <Code2 className="h-6 w-6 text-amber-300" />,
      tag: 'Separate Path • Code Diligence',
      isSeparatePath: true,
      downstream: 'Feeds technical findings directly into Agent 2',
      detailsTitle: 'Code Evaluation Capabilities:',
      items: [
        'Code analysis & Code RAG',
        'Repository parsing & README extraction',
        'Architecture extraction & system design',
        'API and database schema understanding',
        'Technology stack analysis',
        'Technical maturity & scalability',
        'Security & code quality assessment',
        'Market potential & monetization possibilities',
      ],
      notice:
        'Specifically for analyzing software projects / codebases as startups. Independent from document workflow.',
    },
  ];

  const isMouseDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRafId = useRef<number | null>(null);
  const scrollRafId = useRef<number | null>(null);

  const updateScrollState = useCallback(() => {
    if (scrollRafId.current !== null) return;
    scrollRafId.current = requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const leftPossible = scrollLeft > 10;
        const rightPossible = scrollLeft < scrollWidth - clientWidth - 10;

        setCanScrollLeft((prev) => (prev !== leftPossible ? leftPossible : prev));
        setCanScrollRight((prev) => (prev !== rightPossible ? rightPossible : prev));

        // Estimate active step
        const stepWidth = 440;
        const currentStep = Math.min(
          Math.max(0, Math.round(scrollLeft / stepWidth)),
          agents.length - 1
        );
        setActiveStep((prev) => (prev !== currentStep ? currentStep : prev));
      }
      scrollRafId.current = null;
    });
  }, [agents.length]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();

    const handleWheel = (e: WheelEvent) => {
      // If user holds Shift, or if horizontal delta is larger than vertical delta, scroll horizontally smoothly
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        const delta = e.shiftKey ? e.deltaY : e.deltaX;
        el.scrollLeft += delta;
      }
      // Pure vertical wheel without shift scrolls page naturally via Lenis without getting locked
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      el.removeEventListener('wheel', handleWheel);
      if (scrollRafId.current !== null) cancelAnimationFrame(scrollRafId.current);
      if (dragRafId.current !== null) cancelAnimationFrame(dragRafId.current);
    };
  }, [updateScrollState]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isMouseDown.current = true;
    startX.current = e.pageX;
    scrollLeftStart.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current || !scrollContainerRef.current) return;
    const deltaX = e.pageX - startX.current;

    if (!isDraggingRef.current && Math.abs(deltaX) > 5) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }

    if (isDraggingRef.current) {
      if (dragRafId.current !== null) cancelAnimationFrame(dragRafId.current);
      dragRafId.current = requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollLeftStart.current - deltaX * 1.3;
        }
        dragRafId.current = null;
      });
    }
  };

  const handleMouseUp = () => {
    isMouseDown.current = false;
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setTimeout(() => setIsDragging(false), 50);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToStep = (index: number) => {
    if (scrollContainerRef.current) {
      const cardEl = scrollContainerRef.current.children[index] as HTMLElement;
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        setActiveStep(index);
      }
    }
  };

  return (
    <section id="multi-agent" className="scroll-mt-24 bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end mb-12">
          <div className="max-w-3xl">
            <p
              className="mb-3 text-xs font-semibold tracking-wider text-black/60 uppercase md:text-sm"
              data-editable
              data-preset-text="agents-eyebrow"
            >
              THE ANALYSIS ENGINE
            </p>
            <h2
              className="mb-6 text-4xl leading-tight font-semibold text-black md:text-5xl"
              style={{ letterSpacing: '-0.03em' }}
              data-editable
              data-preset-text="agents-headline"
            >
              One Workflow. Specialized AI Agents.
            </h2>
            <p
              className="text-xl leading-relaxed text-black/70 md:text-2xl"
              data-editable
              data-preset-text="agents-body"
            >
              VentureLens processes startup information through a structured multi-agent workflow —
              from document analysis and data normalization to scoring, investment insights, and report
              generation.
            </p>
          </div>

          {/* Sidewise Scroll Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-black/10 transition-all ${
                  canScrollLeft
                    ? 'bg-white text-black shadow-sm hover:bg-black hover:text-white cursor-pointer'
                    : 'bg-black/5 text-black/30 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-black/10 transition-all ${
                  canScrollRight
                    ? 'bg-white text-black shadow-sm hover:bg-black hover:text-white cursor-pointer'
                    : 'bg-black/5 text-black/30 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Nav / Step Filter Pills */}
        <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-black/5 pb-4">
          <span className="mr-2 text-xs font-semibold tracking-wider text-black/50 uppercase">
            Workflow Stages:
          </span>
          {agents.map((ag, idx) => (
            <button
              key={ag.id}
              onClick={() => scrollToStep(idx)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                activeStep === idx
                  ? ag.isSeparatePath
                    ? 'bg-[#3B2236] text-white shadow-sm'
                    : 'bg-[#2B2644] text-white shadow-sm'
                  : 'bg-white text-black/70 hover:bg-black/5 hover:text-black'
              }`}
            >
              <span className="font-mono text-[10px] opacity-70">
                {ag.isSeparatePath ? 'CODE' : ag.id}
              </span>
              <span>{ag.title}</span>
            </button>
          ))}
        </div>

        {/* Sidewise Scrolling Cards Track with 3D Card Interactive Effect */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex gap-6 overflow-x-auto pb-8 pt-2 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            isDragging
              ? 'cursor-grabbing select-none scroll-auto'
              : 'cursor-grab scroll-smooth snap-x snap-mandatory'
          }`}
          style={{ overscrollBehaviorX: 'contain' }}
        >
          {agents.map((agent, index) => {
            return (
              <div
                key={agent.id}
                className="w-[340px] sm:w-[380px] md:w-[420px] flex-shrink-0 snap-start transform-gpu will-change-transform"
                style={{ contain: 'layout style paint' }}
              >
                <Card3D
                  title={agent.title}
                  description={agent.description}
                  gradient={agent.gradient}
                  icon={agent.icon}
                  size="xl"
                  variant="premium"
                  className="border border-white/10 shadow-xl"
                >
                  <div className="mt-4 flex flex-col justify-between flex-1">
                    {/* Header meta badges */}
                    <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold font-mono uppercase tracking-wider ${
                            agent.isSeparatePath
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-white/15 text-white/90 border border-white/20'
                          }`}
                        >
                          {agent.agentNum}
                        </span>
                        <span className="text-[11px] text-white/60 font-mono">{agent.tag}</span>
                      </div>
                      {index < 5 && (
                        <div className="flex items-center text-xs text-white/40 font-mono">
                          <span>↓ Step</span>
                        </div>
                      )}
                      {agent.isSeparatePath && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          SEPARATE PATH
                        </span>
                      )}
                    </div>

                    {/* Role descriptor */}
                    <p className="mb-3 text-xs font-semibold text-white/90 tracking-wide">
                      Role: {agent.role}
                    </p>

                    {/* Technical details list */}
                    <div className="rounded-xl bg-black/30 p-3.5 border border-white/10 mb-3">
                      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
                        {agent.detailsTitle}
                      </span>
                      <ul className="space-y-1.5">
                        {agent.items.map((item) => (
                          <li key={item} className="flex items-start text-xs text-white/80">
                            <span className="mr-2 text-white/40">•</span>
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Technical clarification notice */}
                    <p className="text-[11px] leading-relaxed text-white/60 italic mb-4">
                      {agent.notice}
                    </p>

                    {/* Downstream connection badge */}
                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 border border-white/10 text-xs text-white/75">
                      <span className="flex items-center gap-1.5 font-mono text-[11px]">
                        <ArrowRight className="h-3.5 w-3.5 text-white/50" />
                        {agent.downstream}
                      </span>
                    </div>
                  </div>
                </Card3D>
              </div>
            );
          })}
        </div>

        {/* Separate Path Callout & Architecture Transparency Guarantee */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#2B2644] text-white">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-black">
              Sequential Document Workflow (Agents 1–5)
            </h3>
            <p className="text-xs leading-relaxed text-black/70">
              Startup documents undergo structured extraction (Agent 1), data normalization and
              deduplication (Agent 2), multidimensional scoring (Agent 3), thesis & recommendation
              generation (Agent 4), and publication into PDF, PPT, and spreadsheet reports (Agent 5).
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#2B2644] text-white">
              <GitBranch className="h-5 w-5 text-amber-300" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-black">
              Project → Startup Path (Agent 6)
            </h3>
            <p className="text-xs leading-relaxed text-black/70">
              An independent code evaluation pipeline analyzing software projects and GitHub
              repositories using Code RAG and architecture parsing to assess scalability, security,
              maturity, and commercial startup potential—directly feeding technical claims into Agent 2.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#2B2644] text-white">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-black">
              Scoring Dimensions vs. Agents
            </h3>
            <p className="text-xs leading-relaxed text-black/70">
              Market, Product, Team, Financial, Traction, and Risk are analytical scoring dimensions
              evaluated by the Scoring Engine (Agent 3)—not separate AI agents. Recommendations
              (INVEST, MONITOR / CONSIDER, PASS) assist human investment committees.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
