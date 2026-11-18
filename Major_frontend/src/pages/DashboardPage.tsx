import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Folder,
  FileText,
  Mail,
  Database,
  CircleDollarSign,
  MessageSquare,
  HelpCircle,
  FileSpreadsheet,
  TrendingUp,
  Code2,
  Settings,
  LifeBuoy,
  Crown,
  Search,
  Bell,
  ChevronDown,
  UploadCloud,
  MoreHorizontal,
  CheckCircle2,
  Building2,
  Clock,
  ArrowRight,
  Send,
  ShieldAlert,
  Layers,
  ExternalLink,
  X,
  Menu,
  Sparkles,
  Download,
  GitBranch,
  Zap,
  Globe,
  Target,
  DollarSign,
  Newspaper,
  Radio,
  BarChart3,
  Check,
  Calendar,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Share2,
  LogOut,
  User,
  FileDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getStoredAnalyses,
  getActiveAnalysis,
  getActiveAnalysisId,
  setActiveAnalysisId,
  updateAnalysisChat,
  updateAnalysisRelatedProjects,
  saveAnalyses,
  addAnalysis,
  getOrGenerateResearchData,
  type AnalysisRecord,
  type ExternalResearchData,
} from '../services/analysisStorage';
import { checkResearchHealth, runFullDiligenceResearch } from '../services/researchService';
import {
  fetchRelatedEcosystemProjects,
  type RelatedProjectItem,
} from '../services/tavilyService';
import { toast } from 'sonner';
import { getRouteParams, navigateTo } from '../shared/preset-site-routing';
import Agent6DiligenceView from '../components/Agent6DiligenceView';
import { checkAgent6Health } from '../services/agent6Service';
import Agent1DiligenceView from '../components/Agent1DiligenceView';
import { checkAgent1Health } from '../services/agent1Service';
import { checkAgent2Health } from '../services/agent2Service';
import { checkAgent3Health } from '../services/agent3Service';
import { checkAgent4Health, getAgent4Recommendations } from '../services/agent4Service';
import {
  uploadDocumentToSupabaseStorage,
  getAgent1EvaluationByAnalysisId,
  getDocumentsByAnalysisId,
  fetchAnalysesFromSupabase,
  saveChatMessageToSupabase,
  fetchChatMessagesFromSupabase,
  supabase,
  type Agent1EvaluationRecord,
} from '../services/supabaseService';
import { queryVentureAiChat, getSessionPitchDeck, getSessionRepositoryInfo } from '../services/aiChatService';
import {
  exportAnalysisToPDF,
  exportAnalysisToPPT,
  exportAnalysisToExcel,
  generateShareLink,
} from '../services/exportReportService';

// VentureLens Aperture Facet Logo
function VentureLensLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="14" stroke="#5028E0" strokeWidth="2.5" />
      <path
        d="M16 6L23 16L16 26L9 16L16 6Z"
        fill="#5028E0"
        fillOpacity="0.15"
        stroke="#5028E0"
        strokeWidth="2"
      />
      <circle cx="16" cy="16" r="3.5" fill="#5028E0" />
      <path d="M16 6V12.5M16 19.5V26M9 16H12.5M19.5 16H23" stroke="#5028E0" strokeWidth="1.5" />
    </svg>
  );
}

// Airbnb Brand Icon in Red Square
function AirbnbIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M12 2C7.58 2 4 5.58 4 10C4 13.9 6.74 18.6 11.23 21.72C11.69 22.04 12.31 22.04 12.77 21.72C17.26 18.6 20 13.9 20 10C20 5.58 16.42 2 12 2ZM12 14.5C10.62 14.5 9.5 13.38 9.5 12C9.5 10.62 10.62 9.5 12 9.5C13.38 9.5 14.5 10.62 14.5 12C14.5 13.38 13.38 14.5 12 14.5Z" />
    </svg>
  );
}

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisRecord | null>(null);
  const [currentTab, setCurrentTab] = useState<
    | 'dashboard'
    | 'agent1'
    | 'agent6'
    | 'my-analyses'
    | 'documents'
    | 'gmail'
    | 'knowledge-base'
    | 'funding'
    | 'chatbot'
    | 'questions'
    | 'reports'
  >('dashboard');

  // Agent backend connectivity status
  const [agent1Online, setAgent1Online] = useState(false);
  const [agent6Online, setAgent6Online] = useState(false);
  const [agent3Online, setAgent3Online] = useState(false);
  const [agent4Online, setAgent4Online] = useState(false);
  const [researchOnline, setResearchOnline] = useState(false);
  const [isRefreshingResearch, setIsRefreshingResearch] = useState(false);

  // Key Insights Tab state (Tasks 5–9: Overview, Market, Competitors, Financials, News)
  const [insightsTab, setInsightsTab] = useState<'overview' | 'market' | 'competitors' | 'financials' | 'news'>('overview');

  // Agent 1 evaluation result from Supabase
  const [agent1Eval, setAgent1Eval] = useState<Agent1EvaluationRecord | null>(null);

  // Interactive AI chat input & auto-scroll ref
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // User Authentication & Profile Dropdown
  const { user, profile, signOut } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName =
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.user_name ||
    user?.email?.split('@')[0] ||
    'Vansh Aggarwal';

  const userEmail = user?.email || profile?.email || 'vansh27102005@gmail.com';
  const userRole = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : 'Investor';

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ').filter(Boolean);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'VA';
  };

  const userInitials = getInitials(displayName, userEmail);

  // Auto-scroll chat window when new message arrives or model starts thinking
  useEffect(() => {
    if (currentTab === 'chatbot') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeAnalysis?.chatHistory, isChatThinking, currentTab]);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tavily AI Research & Ecosystem State (GitHub, LinkedIn, Web)
  const [tavilyProjects, setTavilyProjects] = useState<RelatedProjectItem[]>([]);
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [researchFilter, setResearchFilter] = useState<'all' | 'github' | 'linkedin' | 'web'>('all');
  const [researchSearchText, setResearchSearchText] = useState<string>('');

  // Auto-fetch Tavily research on funding discovery tab or load cached
  useEffect(() => {
    if (!activeAnalysis) return;

    if (activeAnalysis.relatedProjects && activeAnalysis.relatedProjects.length > 0) {
      setTavilyProjects(activeAnalysis.relatedProjects);
      return;
    }

    if (currentTab === 'funding') {
      setIsResearching(true);
      fetchRelatedEcosystemProjects(
        activeAnalysis.title,
        activeAnalysis.thesis || activeAnalysis.tagline,
        activeAnalysis.codeDetails?.techStack
      )
        .then((items) => {
          setTavilyProjects(items);
          updateAnalysisRelatedProjects(activeAnalysis.id, items);
        })
        .finally(() => {
          setIsResearching(false);
        });
    }
  }, [activeAnalysis?.id, currentTab]);

  const handleManualResearch = async (customQuery?: string) => {
    if (!activeAnalysis) return;
    setIsResearching(true);
    const query = customQuery?.trim() || activeAnalysis.title;
    try {
      const items = await fetchRelatedEcosystemProjects(
        query,
        activeAnalysis.thesis || activeAnalysis.tagline,
        activeAnalysis.codeDetails?.techStack
      );
      setTavilyProjects(items);
      updateAnalysisRelatedProjects(activeAnalysis.id, items);
      toast.success(`Discovered ${items.length} related projects via Tavily AI`);
    } catch (e) {
      toast.error('Tavily research failed');
    } finally {
      setIsResearching(false);
    }
  };

  // Load analyses on mount and respond to route
  useEffect(() => {
    const loaded = getStoredAnalyses();
    setAnalyses(loaded);

    const initialParams = getRouteParams();
    const targetParamId = initialParams.id;

    if (targetParamId) {
      const found = loaded.find((a) => a.id === targetParamId);
      if (found) {
        setActiveAnalysis(found);
        setActiveAnalysisId(found.id);
      } else {
        const active = getActiveAnalysis();
        setActiveAnalysis(active);
        // Also attempt direct query for this specific ID from Supabase
        supabase
          .from('analyses')
          .select('*')
          .eq('id', targetParamId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              const formatted: AnalysisRecord = {
                id: data.id,
                title: data.title || 'Startup Evaluation',
                mode: data.mode || 'startup',
                tagline: data.tagline || '',
                industry: data.industry || 'Technology',
                website: data.website || '',
                stage: data.stage || 'Seed',
                createdAt: data.created_at || new Date().toISOString(),
                status: data.status || 'completed',
                isDemo: false,
                overallScore: data.overall_score || 80,
                recommendation: data.recommendation || 'MONITOR',
                confidence: data.confidence || 'Moderate',
                thesis: data.thesis || '',
                scores: data.scores || { market: 80, product: 80, team: 80, financial: 75, traction: 70, risk: 75 },
                keyInsights: data.key_insights || { strengths: [], risks: [], opportunities: [], nextSteps: [] },
                dueDiligenceQuestions: data.due_diligence_questions || [],
                documents: data.documents || [],
                codeDetails: data.code_details,
                fundingMatches: data.funding_matches || [],
                chatHistory: data.chat_history || [],
              };
              addAnalysis(formatted);
              setActiveAnalysis(formatted);
              setActiveAnalysisId(formatted.id);
              setAnalyses((prev) => [formatted, ...prev.filter((p) => p.id !== formatted.id)]);
            }
          })
          .catch((err) => console.warn('[DashboardPage] Direct Supabase lookup error:', err));
      }
    } else {
      const active = getActiveAnalysis();
      setActiveAnalysis(active);
    }

    // Fetch live analyses directly from Supabase database
    fetchAnalysesFromSupabase().then((dbAnalyses) => {
      if (dbAnalyses && dbAnalyses.length > 0) {
        setAnalyses((prev) => {
          const idMap = new Map(prev.map((a) => [a.id, a]));
          dbAnalyses.forEach((a) => idMap.set(a.id, a));
          const merged = Array.from(idMap.values());
          saveAnalyses(merged);
          return merged;
        });

        // Priority 1: Match route param id if passed in URL
        const currentRouteParams = getRouteParams();
        const preferredId = currentRouteParams.id || getActiveAnalysisId();
        const matchedTarget = dbAnalyses.find((a) => a.id === preferredId);

        if (matchedTarget) {
          setActiveAnalysis(matchedTarget);
          setActiveAnalysisId(matchedTarget.id);
        } else {
          // Priority 2: Auto-select latest real non-demo startup (e.g. Grow / ArangoDB) if current is demo or unset
          const nonDemo = dbAnalyses.filter((a) => !a.isDemo);
          if (nonDemo.length > 0) {
            const currentActiveId = getActiveAnalysisId();
            const matchingReal = nonDemo.find((a) => a.id === currentActiveId);
            if (matchingReal) {
              setActiveAnalysis(matchingReal);
            } else if (
              !currentActiveId ||
              currentActiveId === 'eval_airbnb_01' ||
              currentActiveId === 'eval_ecoverse_01'
            ) {
              const latestReal = nonDemo[nonDemo.length - 1];
              setActiveAnalysis(latestReal);
              setActiveAnalysisId(latestReal.id);
            }
          }
        }
      }
    }).catch((err) => console.warn('[DashboardPage] Supabase fetch warning:', err));

    // Listen for hash parameter changes (e.g. user clicks another startup link or navigates with ?id=...)
    const handleHashParamChange = () => {
      const routeParams = getRouteParams();
      if (routeParams.id) {
        const stored = getStoredAnalyses();
        const found = stored.find((a) => a.id === routeParams.id);
        if (found) {
          setActiveAnalysis(found);
          setActiveAnalysisId(found.id);
        }
      }
    };
    window.addEventListener('hashchange', handleHashParamChange);

    // Initial check and periodic polling of Agent 1 (8001), Agent 6 (8000), Agent 3 (8004), Agent 4 (8005), Agent-Research (8002)
    checkAgent1Health().then((res) => setAgent1Online(res.online));
    checkAgent6Health().then((res) => setAgent6Online(res.online));
    checkAgent3Health().then((res) => setAgent3Online(res.online));
    checkAgent4Health().then((res) => setAgent4Online(res.online));
    checkResearchHealth().then((res) => setResearchOnline(res.online));
    const healthInterval = setInterval(() => {
      checkAgent1Health().then((res) => setAgent1Online(res.online));
      checkAgent6Health().then((res) => setAgent6Online(res.online));
      checkAgent3Health().then((res) => setAgent3Online(res.online));
      checkAgent4Health().then((res) => setAgent4Online(res.online));
      checkResearchHealth().then((res) => setResearchOnline(res.online));
    }, 8000);

    return () => {
      window.removeEventListener('hashchange', handleHashParamChange);
      clearInterval(healthInterval);
    };
  }, []);

  // Sync Agent 1 evaluation from Supabase whenever active venture changes
  useEffect(() => {
    if (!activeAnalysis?.id) {
      setAgent1Eval(null);
      return;
    }
    getAgent1EvaluationByAnalysisId(activeAnalysis.id).then((res) => {
      setAgent1Eval(res);
    });
  }, [activeAnalysis?.id]);

  // Sync Agent 4 recommendations and due diligence questions whenever active venture changes
  useEffect(() => {
    if (!activeAnalysis?.id) return;
    let isMounted = true;
    getAgent4Recommendations(activeAnalysis.id).then((rec) => {
      if (!isMounted || !rec) return;
      setActiveAnalysis((prev) => {
        if (!prev || prev.id !== activeAnalysis.id) return prev;
        return {
          ...prev,
          thesis: rec.investment_thesis || prev.thesis,
          recommendation: (rec.recommendation as any) || prev.recommendation,
          confidence: (rec.confidence as any) || prev.confidence,
          overallScore: rec.overall_score || prev.overallScore,
          scores: rec.dimension_scores ? { ...prev.scores, ...rec.dimension_scores } : prev.scores,
          dueDiligenceQuestions:
            rec.due_diligence_questions && rec.due_diligence_questions.length > 0
              ? rec.due_diligence_questions
              : prev.dueDiligenceQuestions,
          keyInsights: rec.key_insights || prev.keyInsights,
        };
      });
    });
    return () => {
      isMounted = false;
    };
  }, [activeAnalysis?.id]);

  // Sync documents from Supabase documents table whenever active venture changes
  useEffect(() => {
    if (!activeAnalysis?.id) return;
    let isMounted = true;
    getDocumentsByAnalysisId(activeAnalysis.id).then((docs) => {
      if (!isMounted || !docs || docs.length === 0) return;
      setActiveAnalysis((prev) => {
        if (!prev || prev.id !== activeAnalysis.id) return prev;
        return {
          ...prev,
          documents: docs,
        };
      });
    });
    return () => {
      isMounted = false;
    };
  }, [activeAnalysis?.id]);

  // Load chat history from Supabase whenever active venture changes
  useEffect(() => {
    if (!activeAnalysis?.id) return;
    let isMounted = true;
    fetchChatMessagesFromSupabase(activeAnalysis.id).then((savedMsgs) => {
      if (!isMounted || !savedMsgs || savedMsgs.length === 0) return;
      setActiveAnalysis((prev) => {
        if (!prev || prev.id !== activeAnalysis.id) return prev;
        const existingIds = new Set(prev.chatHistory.map((m) => m.id));
        const merged = [...prev.chatHistory];
        for (const sm of savedMsgs) {
          if (!existingIds.has(sm.id)) {
            merged.push(sm);
          }
        }
        return {
          ...prev,
          chatHistory: merged,
        };
      });
    });
    return () => {
      isMounted = false;
    };
  }, [activeAnalysis?.id]);

  const selectAnalysis = (item: AnalysisRecord) => {
    setActiveAnalysis(item);
    setActiveAnalysisId(item.id);
  };

  // Real-time AI Chat query submission powered by AI Diligence Copilot & Agent 1
  const handleSendChat = async (textToSend?: string) => {
    const q = (textToSend || chatInput).trim();
    if (!q || !activeAnalysis || isChatThinking) return;

    setChatInput('');
    const userMsg = {
      id: `chat_u_${Date.now()}`,
      role: 'user' as const,
      text: q,
      timestamp: 'Just now',
    };

    updateAnalysisChat(activeAnalysis.id, userMsg);
    saveChatMessageToSupabase(activeAnalysis.id, userMsg);
    setActiveAnalysis((prev) =>
      prev ? { ...prev, chatHistory: [...prev.chatHistory, userMsg] } : prev
    );

    setIsChatThinking(true);

    try {
      const replyText = await queryVentureAiChat({
        userMessage: q,
        activeAnalysis,
        agent1Eval,
        chatHistory: activeAnalysis.chatHistory,
      });

      const botMsg = {
        id: `chat_b_${Date.now()}`,
        role: 'assistant' as const,
        text: replyText,
        timestamp: 'Just now',
      };

      updateAnalysisChat(activeAnalysis.id, botMsg);
      saveChatMessageToSupabase(activeAnalysis.id, botMsg);
      setActiveAnalysis((prev) =>
        prev ? { ...prev, chatHistory: [...prev.chatHistory, botMsg] } : prev
      );
    } catch (err: any) {
      console.error('[AI Chat] Error querying AI engine:', err);
      const errorMsg = {
        id: `chat_err_${Date.now()}`,
        role: 'assistant' as const,
        text: `Sorry, I encountered an issue querying the AI engine: ${err.message || 'Network error'}. Please try again.`,
        timestamp: 'Just now',
      };
      updateAnalysisChat(activeAnalysis.id, errorMsg);
      setActiveAnalysis((prev) =>
        prev ? { ...prev, chatHistory: [...prev.chatHistory, errorMsg] } : prev
      );
    } finally {
      setIsChatThinking(false);
    }
  };

  const handleRefreshResearch = async () => {
    if (!activeAnalysis) return;
    setIsRefreshingResearch(true);
    try {
      toast.info('Querying Agent-Research Engine (Tasks 5–9)...');
      const fresh = await runFullDiligenceResearch({
        startupName: activeAnalysis.title,
        industry: activeAnalysis.industry,
        projectDescription: activeAnalysis.thesis || activeAnalysis.tagline,
        website: activeAnalysis.website,
        currentStage: activeAnalysis.stage,
        analysisId: activeAnalysis.id,
      });
      if (fresh) {
        const updated = { ...activeAnalysis, researchData: fresh };
        setActiveAnalysis(updated);
        addAnalysis(updated);
        toast.success('External research successfully refreshed from live sources!');
      } else {
        toast.info('Agent-Research engine running with verified benchmarks.');
      }
    } catch (err) {
      toast.error('Unable to reach research engine. Using verified benchmarks.');
    } finally {
      setIsRefreshingResearch(false);
    }
  };

  if (!activeAnalysis) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FE]">
        <div className="text-center font-medium text-sm text-[#64748B] flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#5028E0] border-t-transparent animate-spin" />
          <span>Loading VentureLens Intelligence Engine...</span>
        </div>
      </div>
    );
  }

  // Active pitch deck document attached to this venture session
  const activeSessionDoc = activeAnalysis ? getSessionPitchDeck(activeAnalysis, agent1Eval) : null;
  // Active repository intelligence attached to this session (Agent 6)
  const activeRepoInfo = activeAnalysis ? getSessionRepositoryInfo(activeAnalysis) : null;
  // Active external research data (Tasks 5–9: Market, Competitors, Financials, News)
  const currentResearchData: ExternalResearchData | null = activeAnalysis ? getOrGenerateResearchData(activeAnalysis) : null;

  // Safeguarded dimension scores mapping for the 6 cards under the hero
  const mScore = activeAnalysis.scores?.market ?? 75;
  const pScore = activeAnalysis.scores?.product ?? 75;
  const tScore = activeAnalysis.scores?.team ?? 75;
  const fScore = activeAnalysis.scores?.financial ?? 70;
  const trScore = activeAnalysis.scores?.traction ?? 70;
  const rScore = activeAnalysis.scores?.risk ?? 75;

  const scoreDimensions = [
    { label: 'Market Score', val: mScore, color: 'bg-[#10B981]' },
    { label: 'Product Score', val: pScore, color: 'bg-[#10B981]' },
    { label: 'Team Score', val: tScore, color: 'bg-[#10B981]' },
    {
      label: 'Financial Score',
      val: fScore,
      color: fScore >= 80 ? 'bg-[#10B981]' : 'bg-[#F59E0B]',
    },
    {
      label: 'Traction Score',
      val: trScore,
      color: trScore >= 80 ? 'bg-[#10B981]' : 'bg-[#F59E0B]',
    },
    {
      label: 'Risk Score',
      val: rScore,
      color: rScore >= 80 ? 'bg-[#10B981]' : 'bg-[#F59E0B]',
    },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F9FE] text-[#1E1B2E] antialiased">
      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION - FIXED & COMPACT (NO SCROLLING) */}
      <aside
        data-lenis-prevent
        className={`fixed inset-y-0 left-0 z-50 w-64 xl:w-72 bg-white border-r border-[#EAEBF2] px-3.5 py-3.5 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 h-screen shrink-0 overflow-y-auto lg:overflow-hidden select-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-3">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between pb-1.5 px-1 border-b border-[#F1F2F6]">
            <div className="flex items-center gap-2.5">
              <VentureLensLogo className="w-7 h-7 shrink-0" />
              <div>
                <span className="text-sm font-bold text-[#1E1B2E] tracking-tight block leading-tight">
                  VentureLens
                </span>
                <span className="text-[10px] text-[#64748B] block leading-tight font-normal">
                  From Ideas to Informed Investments
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[#64748B] hover:text-[#1E1B2E] p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation Items */}
          <nav className="space-y-0.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'agent1', label: 'Document Diligence', icon: FileText, badge: agent1Online ? 'Active' : 'Ready' },
              { id: 'agent6', label: 'Code Diligence', icon: Code2, badge: agent6Online ? 'Active' : 'Ready' },
              { id: 'new-analysis', label: 'New Analysis', icon: PlusCircle, isAction: true },
              { id: 'my-analyses', label: 'My Analyses', icon: Folder },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'funding', label: 'Funding Discovery', icon: CircleDollarSign },
              { id: 'chatbot', label: 'AI Chatbot', icon: MessageSquare },
              { id: 'questions', label: 'Due-Diligence Questions', icon: HelpCircle },
              { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.isAction) {
                      navigateTo('new-analysis');
                    } else {
                      setCurrentTab(item.id as any);
                    }
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#EEECFC] text-[#5028E0] font-semibold'
                      : 'text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#5028E0]' : 'text-[#64748B]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        item.badge === 'Online'
                          ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                          : 'bg-[#F1F2F6] text-[#64748B]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Analysis Tools Section */}
          <div className="pt-1 border-t border-[#F1F2F6]">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Analysis Tools
            </p>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => navigateTo('analyze-startup')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 shrink-0 text-[#64748B]" />
                <span>Startup Analysis</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('analyze-project')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors cursor-pointer"
              >
                <Code2 className="w-4 h-4 shrink-0 text-[#64748B]" />
                <span>Project → Startup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Settings & Upgrade to Pro (Compact & Clean) */}
        <div className="space-y-2 pt-2.5 border-t border-[#EAEBF2]">
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => alert('Settings configuration modal')}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 shrink-0 text-[#64748B]" />
              <span>Settings</span>
            </button>
            <button
              type="button"
              onClick={() => alert('VentureLens Support: support@venturelens.ai')}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 shrink-0 text-[#64748B]" />
              <span>Help & Support</span>
            </button>
          </div>

          {/* Compact Upgrade to Pro Card */}
          <div className="rounded-xl bg-gradient-to-br from-[#F4F1FD] to-[#EDE9FE] border border-[#DDD6FE] p-2.5 relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-[#5028E0] text-white flex items-center justify-center shadow-xs">
                  <Crown className="w-3 h-3" />
                </div>
                <span className="font-bold text-xs text-[#1E1B2E]">Upgrade to Pro</span>
              </div>
              <button
                type="button"
                onClick={() => alert('Pro Plan: Unlimited agent evaluations and team exports.')}
                className="py-0.5 px-2 rounded-md bg-white border border-[#DDD6FE] text-[#5028E0] hover:bg-[#F8F7FD] font-semibold text-[10px] transition-colors shadow-2xs cursor-pointer"
              >
                View Plans
              </button>
            </div>
            <p className="text-[10px] text-[#64748B] leading-tight">
              Unlock higher limits & deeper evaluations.
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA - INDEPENDENT SCROLL */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOP APP BAR - PINNED HEADER */}
        <header className="shrink-0 z-30 bg-white/95 backdrop-blur border-b border-[#EAEBF2] px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-[#64748B] hover:bg-[#F8F9FE]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search startups, analyses, documents, or ask a question..."
                className="w-full pl-9 pr-14 py-2 bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#1E1B2E] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#5028E0] transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] text-[10px] font-mono text-[#94A3B8] shadow-2xs hidden sm:inline-block">
                Ctrl K
              </span>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-xl text-[#64748B] hover:text-[#1E1B2E] hover:bg-[#F8F9FE] transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#5028E0] ring-2 ring-white" />
            </button>

            {/* User Profile Badge & Interactive Dropdown */}
            <div className="relative pl-2 border-l border-[#EAEBF2]" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-[#F8F9FE] transition-colors cursor-pointer text-left group"
                aria-label="User account menu"
                aria-expanded={userDropdownOpen}
              >
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="w-9 h-9 rounded-full object-cover border border-[#EAEBF2] shadow-xs"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#1E1B4B] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-[#5028E0] transition-colors">
                    {userInitials}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-bold text-[#1E1B2E] leading-tight">
                    {displayName}
                  </span>
                  <span className="block text-[11px] text-[#64748B] leading-tight">{userRole}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#94A3B8] hidden sm:block transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180 text-[#1E1B2E]' : ''
                  }`}
                />
              </button>

              {/* USER PROFILE DROPDOWN */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#EAEBF2] bg-white p-2 shadow-2xl z-50 animate-fadeIn">
                  {/* User Profile Header */}
                  <div className="px-3.5 py-3 border-b border-[#F1F2F6] bg-[#FAFBFD] rounded-xl mb-1.5">
                    <div className="flex items-center gap-2.5">
                      {profile?.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover border border-[#EAEBF2]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1E1B4B] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {userInitials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#1E1B2E] truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#5028E0] bg-[#EEECFB] px-2 py-0.5 rounded-full border border-[#DCD6FA]">
                        <Crown className="w-3 h-3" />
                        {userRole}
                      </span>
                      <span className="text-[10px] font-medium text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                        Active Session
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1 space-y-0.5 text-xs font-medium text-[#334155]">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCurrentTab('dashboard');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors text-left cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#64748B]" />
                      <span>Investment Overview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCurrentTab('my-analyses');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors text-left cursor-pointer"
                    >
                      <Folder className="w-4 h-4 text-[#64748B]" />
                      <span>My Diligence Records</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigateTo('new-analysis');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors text-left cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-[#5028E0]" />
                      <span className="text-[#5028E0] font-semibold">Start New Analysis</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigateTo('');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors text-left cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-[#64748B]" />
                      <span>Back to Landing Page</span>
                    </button>
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-1.5 mt-1 border-t border-[#F1F2F6]">
                    <button
                      type="button"
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        try {
                          await signOut();
                          toast.success('Signed out successfully');
                        } catch (err: any) {
                          toast.error(err?.message || 'Error signing out');
                        }
                        navigateTo('login');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-[#DC2626]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT - SCROLLS INDEPENDENTLY */}
        <main
          data-lenis-prevent
          className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-[90rem] w-full mx-auto space-y-6"
        >
          {/* TAB 1: DASHBOARD OVERVIEW (EXACT SCREENSHOT LAYOUT) */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* WELCOME BANNER & STATS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1E1B2E]">
                    Welcome back!
                  </h1>
                  <p className="text-sm text-[#64748B] mt-0.5">
                    Turn startup data into investment intelligence.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigateTo('new-analysis')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#5028E0] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#4320BD] transition-colors shadow-xs cursor-pointer"
                  >
                    <span>+ New Analysis</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('documents')}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-semibold text-[#1E1B2E] hover:bg-[#F8F9FE] transition-colors shadow-2xs cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-[#64748B]" />
                    <span>Upload Documents</span>
                  </button>
                </div>
              </div>

              {/* 4 SUMMARY METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Analyses Completed */}
                <div className="rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#64748B] block">
                      Analyses Completed
                    </span>
                    <span className="text-2xl font-bold text-[#1E1B2E] block leading-tight">
                      12
                    </span>
                    <span className="text-[11px] font-medium text-[#10B981] flex items-center gap-0.5 mt-0.5">
                      ↑ +3 this month
                    </span>
                  </div>
                </div>

                {/* Startups Evaluated */}
                <div className="rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#64748B] block">
                      Startups Evaluated
                    </span>
                    <span className="text-2xl font-bold text-[#1E1B2E] block leading-tight">
                      12
                    </span>
                    <span className="text-[11px] font-medium text-[#10B981] flex items-center gap-0.5 mt-0.5">
                      ↑ +3 this month
                    </span>
                  </div>
                </div>

                {/* Reports Generated */}
                <div className="rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#64748B] block">
                      Reports Generated
                    </span>
                    <span className="text-2xl font-bold text-[#1E1B2E] block leading-tight">
                      10
                    </span>
                    <span className="text-[11px] font-medium text-[#10B981] flex items-center gap-0.5 mt-0.5">
                      ↑ +2 this month
                    </span>
                  </div>
                </div>

                {/* Documents Analyzed */}
                <div className="rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#64748B] block">
                      Documents Analyzed
                    </span>
                    <span className="text-2xl font-bold text-[#1E1B2E] block leading-tight">
                      48
                    </span>
                    <span className="text-[11px] font-medium text-[#10B981] flex items-center gap-0.5 mt-0.5">
                      ↑ +12 this month
                    </span>
                  </div>
                </div>
              </div>

              {/* RECENT ANALYSIS HERO SHOWCASE (AIRBNB CARD) */}
              <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-6">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#1E1B2E] font-bold text-sm">
                    <FileText className="w-4.5 h-4.5 text-[#5028E0]" />
                    <span>Recent Analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentTab('reports')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#5028E0] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4320BD] transition-colors shadow-xs cursor-pointer"
                    >
                      <span>View Full Analysis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-[#94A3B8] hover:text-[#1E1B2E] transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Company Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-3.5">
                    {/* Brand Icon */}
                    {activeAnalysis.mode === 'project' || activeAnalysis.codeDetails ? (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5028E0] to-[#7C3AED] flex items-center justify-center text-white shadow-2xs shrink-0">
                        <Code2 className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#FF5A5F] flex items-center justify-center text-white shadow-2xs shrink-0">
                        <AirbnbIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-[#1E1B2E] leading-tight">
                          {activeAnalysis.title}
                        </h2>
                        {activeAnalysis.mode === 'project' ? (
                          <>
                            <span className="rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-2.5 py-0.5 text-[11px] font-semibold">
                              Mode B • Project → Startup
                            </span>
                            <span className="rounded-full bg-[#EEECFC] text-[#5028E0] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                              <Zap className="w-3 h-3 text-[#5028E0]" />
                              <span>Codebase Verified</span>
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="rounded-full bg-[#EEF4FF] text-[#3538CD] border border-[#D1E0FF] px-2.5 py-0.5 text-[11px] font-semibold">
                              Startup Evaluation
                            </span>
                            <span className="rounded-full bg-[#F4F3FF] text-[#5925DC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold">
                              Illustrative Analysis
                            </span>
                          </>
                        )}
                        {agent1Eval && (
                          <span className="rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                            <span>Document Intelligence Verified</span>
                          </span>
                        )}
                        {activeAnalysis.codeDetails?.githubUrl && (
                          <a
                            href={activeAnalysis.codeDetails.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#5028E0] hover:underline bg-[#F8F9FE] px-2 py-0.5 rounded border border-[#E2E8F0]"
                          >
                            <GitBranch className="w-3 h-3" />
                            <span>{activeAnalysis.codeDetails.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">{activeAnalysis.tagline}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#94A3B8] font-normal shrink-0">
                    Analyzed on{' '}
                    {activeAnalysis.createdAt
                      ? new Date(activeAnalysis.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Sep 6, 2025'}
                  </span>
                </div>

                {/* Scores & Recommendation 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-[#F1F2F6]">
                  {/* Left Column: Overall Circular Score + 6 Dimension Score Bars (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col md:flex-row items-center gap-8 py-2">
                    {/* Circular Score Gauge */}
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-xs font-semibold text-[#64748B] mb-2">Overall Score</span>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 88 88">
                          {/* Background Ring */}
                          <circle
                            cx="44"
                            cy="44"
                            r="36"
                            stroke="#E2E8F0"
                            strokeWidth="7"
                            fill="none"
                          />
                          {/* Green Progress Ring */}
                          <circle
                            cx="44"
                            cy="44"
                            r="36"
                            stroke="#10B981"
                            strokeWidth="7"
                            strokeDasharray={226.2}
                            strokeDashoffset={226.2 - (226.2 * activeAnalysis.overallScore) / 100}
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-bold text-[#1E1B2E] leading-none">
                            {activeAnalysis.overallScore}
                          </span>
                          <span className="text-[10px] font-medium text-[#94A3B8] mt-0.5">/ 100</span>
                        </div>
                      </div>
                    </div>

                    {/* 6 Dimension Columns */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 w-full">
                      {scoreDimensions.map((dim) => (
                        <div key={dim.label} className="text-center">
                          <span className="text-[11px] font-semibold text-[#64748B] block h-8 leading-tight">
                            {dim.label}
                          </span>
                          <span className="text-xl font-bold text-[#1E1B2E] block mt-1">
                            {dim.val}
                          </span>
                          {/* Colored Underline Indicator */}
                          <div className="w-full h-1.5 bg-[#F1F2F6] rounded-full mt-2 overflow-hidden">
                            <div className={`h-full ${dim.color} rounded-full w-full`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: AI Recommendation Box (4 cols) */}
                  <div className="lg:col-span-4 rounded-xl border border-[#F1F2F6] bg-[#FAFAFC] p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#1E1B2E] mb-2">
                        <span className="flex items-center gap-1">
                          AI Recommendation
                          <span className="text-[10px] text-[#94A3B8]">ⓘ</span>
                        </span>
                      </div>

                      {/* Pill Badge: MAYBE */}
                      <div className="w-full py-1.5 rounded-md bg-[#FEF6E7] border border-[#FDE68A] text-center mb-2.5">
                        <span className="font-bold text-xs tracking-wider text-[#D97706]">
                          {activeAnalysis.recommendation}
                        </span>
                      </div>

                      {/* Confidence Meter */}
                      <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
                        <span>Confidence:</span>
                        <strong className="text-[#1E1B2E] font-semibold">
                          {activeAnalysis.confidence}
                        </strong>
                        <div className="flex items-center gap-1 ml-auto">
                          <div className="w-3 h-1.5 rounded-xs bg-[#F59E0B]" />
                          <div className="w-3 h-1.5 rounded-xs bg-[#F59E0B]" />
                          <div className="w-3 h-1.5 rounded-xs bg-[#E2E8F0]" />
                        </div>
                      </div>

                      {/* Why Section */}
                      <div className="text-xs space-y-0.5">
                        <span className="font-bold text-[#1E1B2E] block">Why?</span>
                        <p className="text-[#64748B] text-[11px] leading-relaxed">
                          {activeAnalysis.thesis}
                        </p>
                      </div>
                    </div>

                    {/* View Detailed Reasoning Link */}
                    <button
                      type="button"
                      onClick={() => setCurrentTab('questions')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#5028E0] hover:underline mt-3 cursor-pointer"
                    >
                      <span>View detailed reasoning</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Document Intelligence Live Banner (When evaluation exists in Supabase) */}
                {agent1Eval && (
                  <div className="rounded-xl border border-[#DDD6FE] bg-gradient-to-r from-[#F8F9FE] to-[#F4F1FD] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#5028E0] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        DOC
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[#1E1B2E]">
                            Document Intelligence
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            Live Synthesized ({agent1Eval.uploaded_files?.length || 1} doc)
                          </span>
                          {agent1Eval.contradictions?.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
                              {agent1Eval.contradictions.length} Contradiction(s)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EEECFC] text-[#5028E0]">
                              0 Contradictions
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#64748B] line-clamp-1">
                          {agent1Eval.merged_analysis?.description ||
                            'Multi-document findings and claims verified by diligence engine.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentTab('agent1')}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#5028E0] text-white hover:bg-[#4320BD] shrink-0 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Inspect Document Diligence</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* MIDDLE ROW: ANALYSIS PIPELINE & KNOWLEDGE BASE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Card: Analysis Pipeline (7 cols) */}
                <div className="lg:col-span-7 rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#1E1B2E]">
                      <Sparkles className="w-4 h-4 text-[#5028E0]" />
                      <span>
                        {activeAnalysis.mode === 'project'
                          ? 'Analysis Pipeline (Code Diligence → Normalization)'
                          : 'Comprehensive Venture Diligence Pipeline'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 text-[11px] font-medium text-[#059669]">
                      <Clock className="w-3 h-3" />
                      <span>Completed in {activeAnalysis.mode === 'project' ? '4.2 min' : '6.5 min'}</span>
                    </span>
                  </div>

                  {/* 5 Sequential Agent Steps with Arrows */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    {(activeAnalysis.mode === 'project'
                      ? [
                          { step: 'Repo AST Parsing', agent: 'Stage 1 • Code' },
                          { step: 'Codebase Analysis', agent: 'Stage 2 • Quality' },
                          { step: 'Technical Claims', agent: 'Stage 3 • Architecture' },
                          { step: 'Data Normalization', agent: 'Stage 4 • Normalization' },
                          { step: 'Venture Diligence', agent: 'Stage 5 • Synthesis' },
                        ]
                      : [
                          { step: 'Document Analysis', agent: 'Stage 1 • Extraction' },
                          { step: 'Data Normalization', agent: 'Stage 2 • Normalization' },
                          { step: 'Scoring Engine', agent: 'Stage 3 • Scoring' },
                          { step: 'Insights & Thesis', agent: 'Stage 4 • Thesis' },
                          { step: 'Report Generation', agent: 'Stage 5 • Deliverables' },
                        ]
                    ).map((item, idx, arr) => (
                      <React.Fragment key={item.step}>
                        <div className="flex flex-col items-center text-center">
                          <div className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                            <CheckCircle2 className="w-4.5 h-4.5" />
                          </div>
                          <span className="text-[11px] font-semibold text-[#1E1B2E] max-w-[85px] leading-tight block">
                            {item.step}
                          </span>
                          <span className="text-[10px] text-[#94A3B8] block mt-0.5">
                            {item.agent}
                          </span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div className="hidden sm:block text-[#CBD5E1] text-xs font-bold pb-4">
                            →
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Right Card: Knowledge Base (5 cols) */}
                <div className="lg:col-span-5 rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 font-bold text-sm text-[#1E1B2E]">
                        <Database className="w-4 h-4 text-[#5028E0]" />
                        <span>Knowledge Base</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('knowledge-base')}
                        className="text-xs font-semibold text-[#5028E0] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View all</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Document List */}
                    <div className="space-y-2">
                      {[
                        { name: 'Airbnb Pitch Deck.pdf', type: 'pdf' },
                        { name: 'Financials 2024.xlsx', type: 'excel' },
                        { name: 'Founder_Info.pdf', type: 'pdf' },
                        { name: 'Market_Research.pdf', type: 'pdf' },
                      ].map((doc) => (
                        <div
                          key={doc.name}
                          className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-[#F8F9FE] transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            {doc.type === 'excel' ? (
                              <div className="w-5 h-5 rounded bg-[#ECFDF5] text-[#10B981] flex items-center justify-center font-bold text-[10px]">
                                X
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center font-bold text-[10px]">
                                P
                              </div>
                            )}
                            <span className="font-medium text-[#1E1B2E]">{doc.name}</span>
                          </div>
                          <span className="rounded bg-[#ECFDF5] text-[#059669] px-2 py-0.5 text-[10px] font-semibold">
                            ✓ Indexed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Knowledge Base Ready Footer */}
                  <div className="pt-2 border-t border-[#F1F2F6] flex items-center gap-2 text-[11px] text-[#64748B]">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span>4 documents • 12,482 chunks • Knowledge base ready</span>
                  </div>
                </div>
              </div>

              {/* CODE DILIGENCE HIGHLIGHT BANNER (PROJECT MODE) */}
              {(activeAnalysis.mode === 'project' || activeAnalysis.codeDetails) && (
                <div className="rounded-2xl border border-[#DDD6FE] bg-gradient-to-r from-[#F4F1FD] via-white to-[#F8F9FE] p-6 shadow-2xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5028E0] text-white flex items-center gap-1.5 shadow-2xs">
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Code Intelligence Active</span>
                        </span>
                        <span className="text-xs text-[#64748B] font-mono">
                          {activeAnalysis.codeDetails?.filesDiscovered || 58} Files Discovered • {activeAnalysis.codeDetails?.filesRead || 15} Files Audited
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#1E1B2E]">
                        Codebase Verified: {activeAnalysis.title}
                      </h3>
                      <p className="text-xs text-[#64748B] max-w-3xl">
                        The system audited the repository AST and extracted verified architectural claims, evidence-backed capabilities, and security posture for venture due diligence.
                      </p>
                      {/* Tech Stack Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {(activeAnalysis.codeDetails?.techStack || ['TypeScript', 'Node.js', 'Docker']).map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded-md bg-white border border-[#CBD5E1] text-[11px] font-semibold text-[#1E1B2E]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentTab('agent6')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5028E0] hover:bg-[#4320BD] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Open Code Inspector</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* KEY INSIGHTS & EXTERNAL DILIGENCE (TASKS 5–9) */}
              <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                {/* Header & Research Engine Status */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#F1F2F6] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-base text-[#1E1B2E]">Key Insights & External Diligence</h2>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            researchOnline
                              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                              : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              researchOnline ? 'bg-[#10B981] animate-pulse' : 'bg-[#94A3B8]'
                            }`}
                          />
                          <span>
                            {researchOnline
                              ? 'Live Intelligence Online'
                              : 'Zero-Cost Research Mode'}
                          </span>
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Multi-source verified intelligence synthesized across market sizing, competitors, capital efficiency, and real-time news.
                    </p>
                  </div>

                  {/* Actions & Tab Navigation Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRefreshResearch}
                      disabled={isRefreshingResearch}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:border-[#5028E0] bg-white text-xs font-semibold text-[#1E1B2E] transition-colors cursor-pointer disabled:opacity-50"
                      title="Trigger fresh external web crawler and research synthesis"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#5028E0] ${isRefreshingResearch ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingResearch ? 'Researching...' : 'Refresh Research'}</span>
                    </button>

                    <div className="flex items-center gap-1 bg-[#F8F9FE] p-1 rounded-xl border border-[#EAEBF2] overflow-x-auto">
                      {[
                        { id: 'overview', label: 'Summary', icon: Sparkles },
                        { id: 'market', label: 'Market & Industry', badge: 'Active', icon: Globe },
                        { id: 'competitors', label: 'Competitors', badge: 'Active', icon: Target },
                        { id: 'financials', label: 'Financial & Funding', badge: 'Active', icon: DollarSign },
                        { id: 'news', label: 'News & Milestones', badge: 'Active', icon: Newspaper },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = insightsTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setInsightsTab(tab.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                              isActive
                                ? 'bg-white text-[#5028E0] shadow-xs border border-[#E2E8F0]'
                                : 'text-[#64748B] hover:text-[#1E1B2E] hover:bg-white/60'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#5028E0]' : 'text-[#94A3B8]'}`} />
                            <span>{tab.label}</span>
                            {tab.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  isActive ? 'bg-[#F4F1FD] text-[#5028E0]' : 'bg-[#E2E8F0] text-[#64748B]'
                                }`}
                              >
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* TAB 1: OVERVIEW / CORE SUMMARY */}
                {insightsTab === 'overview' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Strengths */}
                      <div className="p-4 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] space-y-2.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#065F46]">
                            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                            <span>Core Strengths</span>
                          </div>
                          <ul className="space-y-1.5 text-xs text-[#064E3B] pt-2">
                            {(activeAnalysis.keyInsights?.strengths || [
                              'Large market opportunity',
                              'Experienced founding team',
                              'Scalable business model',
                            ]).map((s, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-[#10B981] font-bold mt-0.5">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Risks */}
                      <div className="p-4 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] space-y-2.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#991B1B]">
                            <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                            <span>Diligence Concerns & Risks</span>
                          </div>
                          <ul className="space-y-1.5 text-xs text-[#7F1D1D] pt-2">
                            {(activeAnalysis.keyInsights?.risks || [
                              'High customer acquisition costs and increasing competition in core markets.',
                            ]).map((r, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-[#EF4444] font-bold mt-0.5">•</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Opportunities */}
                      <div className="p-4 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] space-y-2.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#1E40AF]">
                            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
                            <span>Growth Opportunities</span>
                          </div>
                          <ul className="space-y-1.5 text-xs text-[#1E3A8A] pt-2">
                            {(
                              activeAnalysis.keyInsights?.opportunities ||
                              currentResearchData?.market.marketDrivers ||
                              ['International expansion and enterprise B2B licensing.']
                            )
                              .slice(0, 3)
                              .map((o, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                  <span className="text-[#2563EB] font-bold mt-0.5">•</span>
                                  <span>{o}</span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>

                      {/* Next Steps */}
                      <div className="p-4 rounded-xl border border-[#EDE9FE] bg-[#F5F3FF] space-y-2.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#5B21B6]">
                            <Layers className="w-4 h-4 text-[#7C3AED]" />
                            <span>Diligence Next Steps</span>
                          </div>
                          <ul className="space-y-1.5 text-xs text-[#4C1D95] pt-2">
                            {(activeAnalysis.keyInsights?.nextSteps || [
                              'Validate customer retention cohort data',
                              'Review IP ownership and enterprise pilot terms',
                            ]).map((ns, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-[#7C3AED] font-bold mt-0.5">•</span>
                                <span>{ns}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* 4-Pillar Quick Score Navigation Bar */}
                    {currentResearchData && (
                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE] flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-[#64748B]">
                          <span className="font-bold text-[#1E1B2E]">Research Pillar Scores:</span>
                          <span>Click any pill to open deep external research verification</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setInsightsTab('market')}
                            className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#5028E0] text-xs font-semibold text-[#1E1B2E] flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Globe className="w-3.5 h-3.5 text-[#5028E0]" />
                            <span>Market Score:</span>
                            <span className="font-bold text-[#5028E0]">
                              {currentResearchData.market.marketAttractivenessScore}/100
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInsightsTab('competitors')}
                            className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#5028E0] text-xs font-semibold text-[#1E1B2E] flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Target className="w-3.5 h-3.5 text-[#5028E0]" />
                            <span>Moat Score:</span>
                            <span className="font-bold text-[#5028E0]">
                              {currentResearchData.competitors.moatScore}/100
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInsightsTab('financials')}
                            className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#5028E0] text-xs font-semibold text-[#1E1B2E] flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-[#5028E0]" />
                            <span>Financial Health:</span>
                            <span className="font-bold text-[#5028E0]">
                              {currentResearchData.financials.financialHealthScore}/100
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInsightsTab('news')}
                            className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#5028E0] text-xs font-semibold text-[#1E1B2E] flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Newspaper className="w-3.5 h-3.5 text-[#5028E0]" />
                            <span>News Momentum:</span>
                            <span className="font-bold text-[#5028E0]">
                              {currentResearchData.news.momentumScore}/100
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: MARKET & INDUSTRY RESEARCH (TASK 6) */}
                {insightsTab === 'market' && currentResearchData && (
                  <div className="space-y-5">
                    {/* Sizing KPI 4-Card Bar */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE]">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                          Total Addressable Market (TAM)
                        </span>
                        <span className="text-xl font-extrabold text-[#1E1B2E] mt-1 block">
                          {currentResearchData.market.tam}
                        </span>
                        <span
                          className="text-[11px] text-[#64748B] mt-0.5 block truncate"
                          title={currentResearchData.market.tamMethodology}
                        >
                          {currentResearchData.market.tamMethodology || 'Global market sizing'}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE]">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                          Serviceable Addressable (SAM)
                        </span>
                        <span className="text-xl font-extrabold text-[#1E1B2E] mt-1 block">
                          {currentResearchData.market.sam}
                        </span>
                        <span className="text-[11px] text-[#64748B] mt-0.5 block">
                          Realistic serviceable segment
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE]">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                          Serviceable Obtainable (SOM)
                        </span>
                        <span className="text-xl font-extrabold text-[#1E1B2E] mt-1 block">
                          {currentResearchData.market.som}
                        </span>
                        <span className="text-[11px] text-[#64748B] mt-0.5 block">
                          Year 3-5 beachhead target
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE]">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                          Sector Growth Rate (CAGR)
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xl font-extrabold text-[#10B981]">
                            {currentResearchData.market.cagr}
                          </span>
                          <TrendingUp className="w-4 h-4 text-[#10B981]" />
                        </div>
                        <span className="text-[11px] text-[#64748B] mt-0.5 block">
                          Projected 5-year sector expansion
                        </span>
                      </div>
                    </div>

                    {/* Drivers vs Headwinds */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tailwinds */}
                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-white space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#065F46]">
                          <TrendingUp className="w-4 h-4 text-[#10B981]" />
                          <span>Market Growth Drivers & Tailwinds</span>
                        </div>
                        <div className="space-y-2">
                          {currentResearchData.market.marketDrivers.map((driver, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] text-xs text-[#166534]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                              <span>{driver}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Headwinds & Regulatory */}
                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-white space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#991B1B]">
                          <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                          <span>Industry Headwinds & Regulatory Barriers</span>
                        </div>
                        <div className="space-y-2">
                          {currentResearchData.market.headwinds.map((headwind, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 p-2 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#991B1B]"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-[#EF4444] shrink-0 mt-0.5" />
                              <span>{headwind}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ICP & Score Footer */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#DDD6FE] bg-gradient-to-r from-[#F4F1FD] to-white">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5028E0]">
                          Ideal Customer Profile (ICP)
                        </span>
                        <p className="text-xs font-medium text-[#1E1B2E]">
                          {currentResearchData.market.icp}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-[#64748B] block font-semibold">
                            Market Attractiveness
                          </span>
                          <span className="text-lg font-extrabold text-[#5028E0]">
                            {currentResearchData.market.marketAttractivenessScore}/100
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-[#5028E0] flex items-center justify-center font-bold text-xs text-[#5028E0] bg-white shadow-xs">
                          {currentResearchData.market.marketAttractivenessScore}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: COMPETITOR RESEARCH (TASK 7) */}
                {insightsTab === 'competitors' && currentResearchData && (
                  <div className="space-y-5">
                    {/* Competitor Profiles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentResearchData.competitors.directCompetitors.map((comp, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE] space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-[#1E1B2E]">{comp.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  comp.threatLevel === 'High'
                                    ? 'bg-[#FEE2E2] text-[#991B1B]'
                                    : comp.threatLevel === 'Medium'
                                    ? 'bg-[#FEF3C7] text-[#92400E]'
                                    : 'bg-[#DCFCE7] text-[#166534]'
                                }`}
                              >
                                {comp.threatLevel} Threat
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-[#5028E0] bg-[#EEECFC] px-2 py-0.5 rounded inline-block mt-1">
                              {comp.funding}
                            </span>

                            <div className="mt-3 space-y-1.5 text-xs">
                              {comp.strengths && (
                                <p className="text-[#166534] bg-[#F0FDF4] p-2 rounded-lg border border-[#DCFCE7] leading-snug">
                                  <strong className="block text-[10px] uppercase font-bold text-[#15803D]">
                                    Key Strength
                                  </strong>
                                  {comp.strengths}
                                </p>
                              )}
                              {comp.weaknesses && (
                                <p className="text-[#991B1B] bg-[#FEF2F2] p-2 rounded-lg border border-[#FEE2E2] leading-snug">
                                  <strong className="block text-[10px] uppercase font-bold text-[#B91C1C]">
                                    Vulnerability
                                  </strong>
                                  {comp.weaknesses}
                                </p>
                              )}
                            </div>
                          </div>

                          {comp.website && (
                            <a
                              href={comp.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-[#5028E0] hover:underline inline-flex items-center gap-1 pt-2"
                            >
                              <span>Visit website</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Feature Comparison Matrix Table */}
                    <div className="rounded-xl border border-[#EAEBF2] bg-white overflow-hidden">
                      <div className="p-3.5 bg-[#F8F9FE] border-b border-[#EAEBF2] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E1B2E]">Feature & Defensibility Matrix</span>
                        <span className="text-[10px] font-semibold text-[#64748B]">
                          Startup Capabilities vs. Key Rivals
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-[#F1F2F6] text-[#64748B] font-semibold bg-[#FAFAFA]">
                              <th className="p-3">Capability / Differentiator</th>
                              <th className="p-3 text-center bg-[#F4F1FD] text-[#5028E0] font-bold">
                                {activeAnalysis.title} (Us)
                              </th>
                              {currentResearchData.competitors.directCompetitors.map((c, i) => (
                                <th key={i} className="p-3 text-center font-medium text-[#1E1B2E]">
                                  {c.name.split(' ')[0]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F2F6]">
                            {currentResearchData.competitors.featureMatrix.map((row, idx) => (
                              <tr key={idx} className="hover:bg-[#F8F9FE] transition-colors">
                                <td className="p-3 font-medium text-[#1E1B2E]">{row.feature}</td>
                                <td className="p-3 text-center bg-[#F4F1FD]/50">
                                  {row.us ? (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ECFDF5] text-[#10B981] font-bold text-xs">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F1F5F9] text-[#94A3B8] font-bold text-xs">
                                      ✕
                                    </span>
                                  )}
                                </td>
                                {currentResearchData.competitors.directCompetitors.map((c, i) => {
                                  const cKey = Object.keys(row.competitors).find(
                                    (k) =>
                                      c.name.toLowerCase().includes(k.toLowerCase()) ||
                                      k.toLowerCase().includes(c.name.split(' ')[0].toLowerCase())
                                  );
                                  const hasFeature = cKey ? row.competitors[cKey] : false;
                                  return (
                                    <td key={i} className="p-3 text-center">
                                      {hasFeature ? (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ECFDF5] text-[#10B981] font-bold text-xs">
                                          ✓
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F1F5F9] text-[#94A3B8] font-bold text-xs">
                                          ✕
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Moat Summary Card */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#DDD6FE] bg-[#F4F1FD]/60">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5028E0]">
                          Technological & Business Moat Assessment
                        </span>
                        <p className="text-xs text-[#1E1B2E] font-medium max-w-3xl">
                          {currentResearchData.competitors.moatSummary}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-[#64748B] block font-semibold">Moat Score</span>
                          <span className="text-lg font-extrabold text-[#5028E0]">
                            {currentResearchData.competitors.moatScore}/100
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-[#5028E0] flex items-center justify-center font-bold text-xs text-[#5028E0] bg-white shadow-xs">
                          {currentResearchData.competitors.moatScore}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: FINANCIAL & FUNDING RESEARCH (TASK 8) */}
                {insightsTab === 'financials' && currentResearchData && (
                  <div className="space-y-5">
                    {/* Financial Metrics Bar */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE]">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                          Total Capital Raised
                        </span>
                        <span className="text-xl font-extrabold text-[#1E1B2E] mt-1 block">
                          {currentResearchData.financials.totalRaised || '$2.5M'}
                        </span>
                        <span className="text-[11px] text-[#64748B] mt-0.5 block">
                          Aggregated venture equity & grants
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE]">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                          Implied Valuation
                        </span>
                        <span className="text-xl font-extrabold text-[#1E1B2E] mt-1 block">
                          {currentResearchData.financials.lastValuation || '$15.0M'}
                        </span>
                        <span className="text-[11px] text-[#64748B] mt-0.5 block">
                          Estimated post-money round price
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE]">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                          Sector ARR Multiple
                        </span>
                        <span className="text-xl font-extrabold text-[#1E1B2E] mt-1 block">
                          {currentResearchData.financials.arrMultiple || '8.5x'}
                        </span>
                        <span className="text-[11px] text-[#64748B] mt-0.5 block">
                          Sector median: ~7.2x EV/ARR
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE]">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                          Burn Rate & Runway
                        </span>
                        <span className="text-xl font-extrabold text-[#10B981] mt-1 block">
                          {currentResearchData.financials.runwayMonths || 24} Months
                        </span>
                        <span className="text-[11px] text-[#64748B] mt-0.5 block">
                          Estimated burn: {currentResearchData.financials.burnRate}
                        </span>
                      </div>
                    </div>

                    {/* Historical Funding Rounds Table */}
                    <div className="rounded-xl border border-[#EAEBF2] bg-white overflow-hidden">
                      <div className="p-3.5 bg-[#F8F9FE] border-b border-[#EAEBF2] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E1B2E]">Funding Rounds & Investor Syndicate</span>
                        <span className="text-[10px] font-semibold text-[#64748B]">Verified Capital Tranches</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-[#F1F2F6] text-[#64748B] font-semibold bg-[#FAFAFA]">
                              <th className="p-3">Round</th>
                              <th className="p-3">Capital Raised</th>
                              <th className="p-3">Announced Date</th>
                              <th className="p-3">Lead Investors & Syndicates</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F2F6]">
                            {currentResearchData.financials.rounds.map((round, idx) => (
                              <tr key={idx} className="hover:bg-[#F8F9FE] transition-colors">
                                <td className="p-3 font-bold text-[#1E1B2E]">{round.round}</td>
                                <td className="p-3 font-bold text-[#10B981]">{round.amount}</td>
                                <td className="p-3 text-[#64748B] font-mono text-[11px]">{round.date}</td>
                                <td className="p-3">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {round.leadInvestors.map((inv, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 rounded-md bg-[#F4F1FD] text-[#5028E0] text-[10px] font-bold border border-[#DDD6FE]"
                                      >
                                        {inv}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Capital Efficiency Verdict */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#DDD6FE] bg-[#F4F1FD]/60">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5028E0]">
                          Capital Efficiency & Solvency Analysis
                        </span>
                        <p className="text-xs text-[#1E1B2E] font-medium max-w-3xl">
                          {currentResearchData.financials.capitalEfficiencyVerdict}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-[#64748B] block font-semibold">
                            Financial Health
                          </span>
                          <span className="text-lg font-extrabold text-[#5028E0]">
                            {currentResearchData.financials.financialHealthScore}/100
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-[#5028E0] flex items-center justify-center font-bold text-xs text-[#5028E0] bg-white shadow-xs">
                          {currentResearchData.financials.financialHealthScore}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: NEWS & SECTOR DEVELOPMENTS (TASK 9) */}
                {insightsTab === 'news' && currentResearchData && (
                  <div className="space-y-5">
                    {/* Momentum & Sentiment Bar */}
                    <div className="p-4 rounded-xl border border-[#DDD6FE] bg-gradient-to-r from-[#F4F1FD] via-white to-[#F8F9FE] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1E1B2E]">News Sentiment & Sector Velocity</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[10px] font-bold border border-[#A7F3D0]">
                            Positive / Bullish Momentum
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] max-w-3xl">{currentResearchData.news.sentimentSummary}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-[#64748B] block font-semibold">
                            Momentum Score
                          </span>
                          <span className="text-lg font-extrabold text-[#5028E0]">
                            {currentResearchData.news.momentumScore}/100
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-[#5028E0] flex items-center justify-center font-bold text-xs text-[#5028E0] bg-white shadow-xs">
                          {currentResearchData.news.momentumScore}
                        </div>
                      </div>
                    </div>

                    {/* Chronological Event Timeline */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-[#1E1B2E] block">
                        Chronological Press & Regulatory Timeline
                      </span>
                      <div className="space-y-3">
                        {currentResearchData.news.events.map((ev, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-[#EAEBF2] bg-white hover:border-[#DDD6FE] transition-colors flex items-start justify-between gap-4"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                                  {ev.date}
                                </span>
                                <span className="text-[10px] font-bold text-[#5028E0] bg-[#F4F1FD] px-2 py-0.5 rounded border border-[#DDD6FE]">
                                  {ev.source}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    ev.impact === 'positive'
                                      ? 'bg-[#DCFCE7] text-[#166534]'
                                      : ev.impact === 'negative'
                                      ? 'bg-[#FEE2E2] text-[#991B1B]'
                                      : 'bg-[#F1F5F9] text-[#64748B]'
                                  }`}
                                >
                                  {ev.impact}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-[#1E1B2E]">{ev.headline}</h4>
                              <p className="text-[11px] text-[#64748B] leading-relaxed">{ev.summary}</p>
                            </div>

                            {ev.url && (
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-[#F8F9FE] text-[#5028E0] hover:bg-[#EEECFC] transition-colors shrink-0"
                                title="Read original press coverage"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* LOWER 3-CARD GRID: Questions, Funding Matches, Deck Grounded Chat */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* CARD 2: Due-Diligence Questions */}
                <div className="rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-sm text-[#1E1B2E]">
                          Due-Diligence Questions
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('questions')}
                        className="text-xs font-semibold text-[#5028E0] hover:underline cursor-pointer"
                      >
                        View all →
                      </button>
                    </div>

                    <div className="pt-1 pb-1">
                      <span className="rounded-full bg-[#F4F1FD] text-[#5028E0] px-2.5 py-0.5 text-[10px] font-semibold inline-block">
                        12 questions generated
                      </span>
                    </div>

                    {/* Numbered Questions 1 to 5 */}
                    <div className="space-y-2 pt-1 text-xs">
                      {[
                        'What explains the recent increase in CAC?',
                        'How sustainable is the reported revenue growth?',
                        'What evidence supports the claimed market size?',
                        "How defensible is the company's competitive advantage?",
                        'What are the key assumptions in the financial projections?',
                      ].map((q, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-[#1E1B2E]">
                          <span className="w-4.5 h-4.5 rounded-full border border-[#CBD5E1] text-[#64748B] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] text-[#1E1B2E] font-medium leading-snug">
                            {q}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentTab('questions')}
                    className="text-xs font-semibold text-[#5028E0] hover:underline pt-2 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all questions</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* CARD 3: Funding Opportunities */}
                <div className="rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center">
                          <CircleDollarSign className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-sm text-[#1E1B2E]">
                          Funding Opportunities
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('funding')}
                        className="text-xs font-semibold text-[#5028E0] hover:underline cursor-pointer"
                      >
                        View all →
                      </button>
                    </div>

                    <div className="pt-1 pb-1">
                      <span className="rounded-full bg-[#F4F1FD] text-[#5028E0] px-2.5 py-0.5 text-[10px] font-semibold inline-block">
                        8 potential matches
                      </span>
                    </div>

                    {/* Investor Matches List */}
                    <div className="space-y-2.5 pt-1">
                      {[
                        {
                          name: 'Sequoia Capital',
                          stage: 'Series B • Global',
                          score: '92% match',
                          initials: 'S',
                          bg: 'bg-[#9A3412]',
                        },
                        {
                          name: 'Andreessen Horowitz',
                          stage: 'Series A • US',
                          score: '88% match',
                          initials: 'A',
                          bg: 'bg-[#D97706]',
                        },
                        {
                          name: 'Accel',
                          stage: 'Series B • Global',
                          score: '85% match',
                          initials: 'Acc',
                          bg: 'bg-[#1E293B]',
                        },
                      ].map((inv) => (
                        <div
                          key={inv.name}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#F8F9FE] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-6 h-6 rounded-md ${inv.bg} text-white flex items-center justify-center text-[9px] font-bold shrink-0`}
                            >
                              {inv.initials}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#1E1B2E] block leading-tight">
                                {inv.name}
                              </span>
                              <span className="text-[10px] text-[#94A3B8] block">{inv.stage}</span>
                            </div>
                          </div>
                          <span className="rounded bg-[#ECFDF5] text-[#059669] px-2 py-0.5 text-[10px] font-bold">
                            {inv.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentTab('funding')}
                    className="text-xs font-semibold text-[#5028E0] hover:underline pt-2 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all matches</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* CARD 4: Ask About This Startup (Interactive AI Diligence) */}
                <div className="rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-sm text-[#1E1B2E]">Ask About This Startup</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('chatbot')}
                        className="text-[11px] font-semibold text-[#5028E0] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Full Chat</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1 leading-tight">
                      Real-time diligence answers grounded strictly in this startup's pitch deck.
                    </p>
                    {activeSessionDoc ? (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#5028E0] bg-[#EEECFC] px-2.5 py-1 rounded-lg border border-[#DDD6FE]">
                        <FileText className="w-3 h-3 text-[#5028E0] shrink-0" />
                        <span className="truncate">{activeSessionDoc.name}</span>
                        {activeSessionDoc.isPdf && (
                          <span className="ml-auto text-[9px] bg-[#5028E0] text-white px-1.5 py-0.2 rounded font-bold">
                            PDF Grounded
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-[10px] text-[#F59E0B] font-medium bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FDE68A]">
                        No deck uploaded for {activeAnalysis.title} yet
                      </div>
                    )}

                    {/* Quick Suggestion Chips */}
                    <div className="space-y-1.5 pt-2">
                      {[
                        'What is the revenue & commercial model?',
                        'What are the biggest diligence risks?',
                        'Who are the founders & team background?',
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => {
                            handleSendChat(prompt);
                            setCurrentTab('chatbot');
                          }}
                          className="w-full text-left p-2 rounded-xl bg-[#F8F9FE] border border-[#E2E8F0] hover:border-[#5028E0] hover:bg-[#F4F1FD] text-[11px] text-[#1E1B2E] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 text-[#5028E0] shrink-0" />
                          <span className="truncate">{prompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Interactive Input Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChat();
                      setCurrentTab('chatbot');
                    }}
                    className="relative pt-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Ask about ${activeAnalysis.title}...`}
                      disabled={isChatThinking}
                      className="w-full pl-3 pr-10 py-2 bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl text-xs text-[#1E1B2E] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#5028E0] transition-colors disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatThinking}
                      className="absolute right-1.5 top-3.5 w-7 h-7 rounded-lg bg-[#5028E0] text-white flex items-center justify-center hover:bg-[#4320BD] transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* BOTTOM ROW: QUICK ACTIONS */}
              <div className="rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#1E1B2E]">Quick Actions</span>
                  <span className="text-xs text-[#64748B]">Platform Shortcuts</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => navigateTo('new-analysis')}
                    className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#5028E0] hover:bg-[#F8F9FE] transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <PlusCircle className="w-5 h-5 text-[#5028E0] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[#1E1B2E]">New Analysis</span>
                    <span className="text-[10px] text-[#64748B]">Startup or Codebase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentTab('documents')}
                    className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#5028E0] hover:bg-[#F8F9FE] transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <UploadCloud className="w-5 h-5 text-[#5028E0] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[#1E1B2E]">Upload Docs</span>
                    <span className="text-[10px] text-[#64748B]">Decks & Financials</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentTab('gmail')}
                    className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#5028E0] hover:bg-[#F8F9FE] transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <Mail className="w-5 h-5 text-[#5028E0] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[#1E1B2E]">Connect Gmail</span>
                    <span className="text-[10px] text-[#64748B]">Inbound Ingestion</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentTab('reports')}
                    className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#5028E0] hover:bg-[#F8F9FE] transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-[#5028E0] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[#1E1B2E]">Export Reports</span>
                    <span className="text-[10px] text-[#64748B]">PDF, PPT, Excel, Link</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#F1F2F6] flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span>VentureLens Analyst v2.4</span>
                  <a href="#" className="text-[#5028E0] hover:underline flex items-center gap-1">
                    <span>Landing Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AGENT 1 DOCUMENT DILIGENCE CONTROL CENTER */}
          {currentTab === 'agent1' && activeAnalysis && (
            <Agent1DiligenceView
              activeAnalysis={activeAnalysis}
              onAnalysisChange={(updated) => {
                setActiveAnalysis(updated);
                setAnalyses(getStoredAnalyses());
              }}
              onNavigateToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {/* TAB: AGENT 6 CODE DILIGENCE CONTROL CENTER */}
          {currentTab === 'agent6' && activeAnalysis && (
            <Agent6DiligenceView
              activeAnalysis={activeAnalysis}
              onAnalysisChange={(updated) => {
                setActiveAnalysis(updated);
                setAnalyses(getStoredAnalyses());
              }}
              onNavigateToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {/* TAB 2: MY ANALYSES VIEW */}
          {currentTab === 'my-analyses' && (
            <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B2E]">My Analyses</h2>
                  <p className="text-xs text-[#64748B]">
                    Manage, review, and compare multi-agent evaluations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className="text-xs font-semibold text-[#5028E0] hover:underline"
                >
                  ← Back to Dashboard
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analyses.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      selectAnalysis(a);
                      setCurrentTab('dashboard');
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      a.id === activeAnalysis.id
                        ? 'border-[#5028E0] bg-[#EEECFC]/20 shadow-xs'
                        : 'border-[#EAEBF2] bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-sm text-[#1E1B2E]">{a.title}</span>
                      <span className="font-bold text-sm text-[#10B981]">{a.overallScore}/100</span>
                    </div>
                    <p className="text-xs text-[#64748B] line-clamp-2 mb-3">{a.thesis}</p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="rounded bg-[#EEF4FF] text-[#3538CD] px-2 py-0.5 font-semibold">
                        {a.mode === 'project' ? 'Project' : 'Startup'}
                      </span>
                      <span className="text-[#5028E0] font-semibold">Select Analysis →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS UPLOAD / MANAGEMENT */}
          {currentTab === 'documents' && (
            <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B2E]">Document Vault & Ingestion</h2>
                  <p className="text-xs text-[#64748B]">
                    Pitch decks, financials, cap tables, and contracts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className="text-xs font-semibold text-[#5028E0] hover:underline"
                >
                  ← Back to Dashboard
                </button>
              </div>

              <div className="border-2 border-dashed border-[#DDD6FE] rounded-2xl p-8 text-center bg-[#F8F9FE]">
                <UploadCloud className="w-10 h-10 text-[#5028E0] mx-auto mb-2" />
                <h3 className="font-bold text-sm text-[#1E1B2E]">
                  Upload documents for {activeAnalysis?.title || 'this venture'}
                </h3>
                <p className="text-xs text-[#64748B] mt-1 mb-4">
                  Stored automatically in dedicated Supabase folder: <span className="font-mono text-[#5028E0] font-semibold">{activeAnalysis?.title ? `${activeAnalysis.title.replace(/\s+/g, '_')}/` : 'Company/'}</span>
                </p>
                <label className="inline-flex items-center gap-2 bg-[#5028E0] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#4320BD] cursor-pointer shadow-xs transition-all">
                  <UploadCloud className="w-4 h-4" />
                  <span>Select & Upload Document</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !activeAnalysis) return;
                      toast.loading(`Uploading '${file.name}' to Supabase folder...`, { id: 'vault-upload' });
                      const res = await uploadDocumentToSupabaseStorage(
                        file,
                        activeAnalysis.title,
                        activeAnalysis.id,
                        'Diligence Vault'
                      );
                      if (res.success && res.doc) {
                        const updated: AnalysisRecord = {
                          ...activeAnalysis,
                          documents: [res.doc, ...(activeAnalysis.documents || [])],
                        };
                        setActiveAnalysis(updated);
                        toast.success(`Saved to folder: ${res.folder}/`, { id: 'vault-upload' });
                      } else {
                        toast.error(res.error || 'Upload failed', { id: 'vault-upload' });
                      }
                      if (e.target) e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {/* Company Document Inventory */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#1E1B2E]">
                      Documents in {activeAnalysis?.title} Vault
                    </h4>
                    <span className="text-xs text-[#64748B]">
                      ({activeAnalysis?.documents?.length || 0} Files)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('agent1')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#EEECFC] text-[#5028E0] hover:bg-[#DDD6FE] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Cross-Examine Documents →</span>
                  </button>
                </div>

                <div className="divide-y divide-[#F1F5F9] rounded-xl border border-[#E2E8F0] overflow-hidden">
                  {(activeAnalysis?.documents || []).length > 0 ? (
                    activeAnalysis?.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3.5 bg-white hover:bg-[#F8FAFC] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#1E1B2E]">{doc.name}</p>
                            <p className="text-[11px] text-[#64748B]">
                              {doc.type} • {doc.size} • Folder: <span className="font-mono text-[#5028E0]">{activeAnalysis?.title.replace(/\s+/g, '_')}/</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.storageUrl && (
                            <a
                              href={doc.storageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5028E0] hover:text-[#4320BD] bg-[#EEECFC] hover:bg-[#DDD6FE] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              title="Open document directly from Supabase Cloud Storage"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View in Storage</span>
                            </a>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Indexed</span>
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-[#94A3B8]">
                      No documents stored in this company folder yet. Browse or drop files above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GMAIL INTEGRATION */}
          {currentTab === 'gmail' && (
            <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B2E]">Gmail Deal-Flow Sync</h2>
                  <p className="text-xs text-[#64748B]">
                    Automatically import inbound pitch decks from founders and syndicates
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className="text-xs font-semibold text-[#5028E0] hover:underline"
                >
                  ← Back to Dashboard
                </button>
              </div>

              <div className="rounded-xl bg-[#F8F9FE] border border-[#EAEBF2] p-6 text-center max-w-md mx-auto space-y-4">
                <Mail className="w-10 h-10 text-[#5028E0] mx-auto" />
                <h3 className="font-bold text-base text-[#1E1B2E]">Connect Your Investor Inbox</h3>
                <p className="text-xs text-[#64748B]">
                  Grant read-only access to emails labeled #Deals or automatically forward pitches to{' '}
                  <code className="text-[#5028E0] font-mono">deals@venturelens.ai</code>.
                </p>
                <button
                  type="button"
                  onClick={() => alert('Gmail OAuth flow initiated.')}
                  className="bg-[#5028E0] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#4320BD] transition-colors cursor-pointer"
                >
                  Authorize Google Workspace
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: KNOWLEDGE BASE DETAILS */}
          {currentTab === 'knowledge-base' && (
            <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B2E]">
                    Knowledge Base — {activeAnalysis.title}
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    12,482 indexed vector chunks with semantic cross-referencing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className="text-xs font-semibold text-[#5028E0] hover:underline"
                >
                  ← Back to Dashboard
                </button>
              </div>

              <div className="space-y-3">
                {(activeAnalysis.documents || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8F9FE] rounded-xl border border-[#EAEBF2]">
                    No documents uploaded yet for this venture. Upload a pitch deck or financial model to store in Supabase.
                  </div>
                ) : (
                  (activeAnalysis.documents || []).map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE] text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#5028E0]" />
                        <div>
                          <span className="font-bold text-[#1E1B2E] block">{d.name}</span>
                          <span className="text-[#64748B] text-[11px]">
                            {d.type} • {d.size} • {d.chunks} chunks
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.storageUrl && (
                          <a
                            href={d.storageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5028E0] hover:text-[#4320BD] bg-[#EEECFC] hover:bg-[#DDD6FE] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Open document directly from Supabase Cloud Storage"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View in Storage</span>
                          </a>
                        )}
                        <span className="rounded-full bg-[#ECFDF5] text-[#059669] px-3 py-1 text-xs font-semibold">
                          ✓ Indexed & Searchable
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: DUE DILIGENCE QUESTIONS */}
          {currentTab === 'questions' && (
            <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B2E]">
                    Due-Diligence Checklist & Questions
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Grounded inquiry areas for Investment Committee review
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className="text-xs font-semibold text-[#5028E0] hover:underline"
                >
                  ← Back to Dashboard
                </button>
              </div>

              <div className="space-y-4">
                {(activeAnalysis.dueDiligenceQuestions || []).map((q, i) => (
                  <div
                    key={q.id}
                    className="p-4.5 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E1B2E] text-sm flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#5028E0] text-white flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        {q.question}
                      </span>
                      <span className="rounded bg-[#F4F1FD] text-[#5028E0] px-2.5 py-0.5 text-[10px] font-semibold">
                        {q.category}
                      </span>
                    </div>
                    <p className="text-[#64748B] text-xs">
                      <strong>Why It Matters:</strong> {q.whyItMatters}
                    </p>
                    <p className="text-[#10B981] text-xs font-medium">
                      <strong>Suggested Validation:</strong> {q.suggestedValidation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: FUNDING DISCOVERY & TAVILY ECOSYSTEM RESEARCH */}
          {currentTab === 'funding' && (
            <div className="space-y-6">
              {/* HEADER BANNER */}
              <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Tavily AI Research Engine • Live Connected</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#1E1B2E]">
                    Ecosystem Discovery & Market Landscape
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                    Real-time research on existing projects across GitHub repositories, LinkedIn profiles, and commercial competitors for <strong className="text-[#1E1B2E] font-semibold">{activeAnalysis.title}</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleManualResearch(researchSearchText)}
                    disabled={isResearching}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5028E0] text-white text-xs font-semibold hover:bg-[#4320BD] transition-all disabled:opacity-60 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResearching ? 'animate-spin' : ''}`} />
                    <span>{isResearching ? 'Researching Live...' : 'Refresh Research'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('dashboard')}
                    className="text-xs font-semibold text-[#5028E0] hover:underline px-2 py-1"
                  >
                    ← Back to Dashboard
                  </button>
                </div>
              </div>

              {/* SEARCH & CATEGORY FILTER CONTROLS */}
              <div className="rounded-2xl border border-[#EAEBF2] bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={researchSearchText}
                    onChange={(e) => setResearchSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleManualResearch(researchSearchText);
                    }}
                    placeholder={`Search existing repos, founders, or competitors...`}
                    className="w-full pl-9 pr-20 py-2 bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl text-xs text-[#1E1B2E] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#5028E0] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleManualResearch(researchSearchText)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Search
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setResearchFilter('all')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      researchFilter === 'all'
                        ? 'bg-[#5028E0] text-white shadow-xs'
                        : 'bg-[#F8F9FE] text-[#64748B] hover:bg-[#EEECFC] hover:text-[#5028E0]'
                    }`}
                  >
                    <span>All Sources</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                      {tavilyProjects.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResearchFilter('github')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      researchFilter === 'github'
                        ? 'bg-[#181717] text-white shadow-xs'
                        : 'bg-[#F8F9FE] text-[#64748B] hover:bg-gray-100 hover:text-black'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                      {tavilyProjects.filter((p) => p.category === 'github').length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResearchFilter('linkedin')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      researchFilter === 'linkedin'
                        ? 'bg-[#0A66C2] text-white shadow-xs'
                        : 'bg-[#F8F9FE] text-[#64748B] hover:bg-blue-50 hover:text-[#0A66C2]'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                      {tavilyProjects.filter((p) => p.category === 'linkedin').length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResearchFilter('web')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      researchFilter === 'web'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#F8F9FE] text-[#64748B] hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Web & Market</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                      {tavilyProjects.filter((p) => p.category === 'web').length}
                    </span>
                  </button>
                </div>
              </div>

              {/* TAVILY RESEARCH RESULTS GRID */}
              {isResearching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl border border-[#EAEBF2] bg-white animate-pulse space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-5 w-24 bg-gray-200 rounded-full" />
                        <div className="h-4 w-12 bg-gray-200 rounded" />
                      </div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded" />
                      <div className="h-12 w-full bg-gray-100 rounded" />
                      <div className="h-8 w-full bg-gray-200 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : tavilyProjects.filter((p) => (researchFilter === 'all' ? true : p.category === researchFilter)).length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-[#EAEBF2] bg-white p-8">
                  <div className="w-12 h-12 rounded-full bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-[#1E1B2E]">No Projects Discovered In This Filter</h3>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
                    Switch to another category or trigger real-time Tavily search to analyze the web ecosystem.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleManualResearch()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5028E0] text-white text-xs font-semibold hover:bg-[#4320BD] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Tavily Research</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tavilyProjects
                    .filter((p) => (researchFilter === 'all' ? true : p.category === researchFilter))
                    .map((project) => {
                      const isGithub = project.category === 'github';
                      const isLinkedin = project.category === 'linkedin';

                      return (
                        <div
                          key={project.id}
                          className="p-5 rounded-2xl border border-[#EAEBF2] bg-white hover:border-[#DDD6FE] hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                        >
                          <div>
                            {/* Card Category & Relevance Pill */}
                            <div className="flex items-center justify-between mb-2.5">
                              {isGithub ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#181717] text-white">
                                  <GitBranch className="w-3 h-3" />
                                  <span>GitHub Project</span>
                                </span>
                              ) : isLinkedin ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0A66C2] text-white">
                                  <Share2 className="w-3 h-3" />
                                  <span>LinkedIn Network</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                                  <Globe className="w-3 h-3" />
                                  <span>Web Competitor</span>
                                </span>
                              )}

                              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                {project.score}% match
                              </span>
                            </div>

                            {/* Project Title */}
                            <h3 className="font-bold text-sm text-[#1E1B2E] group-hover:text-[#5028E0] transition-colors line-clamp-2 leading-snug">
                              {project.title}
                            </h3>

                            {/* Snippet / Description */}
                            <p className="text-xs text-[#64748B] mt-2 line-clamp-3 leading-relaxed">
                              {project.snippet}
                            </p>
                          </div>

                          {/* Footer with Domain & Direct Link */}
                          <div className="pt-3 border-t border-[#F1F2F6] flex items-center justify-between text-xs">
                            <span className="text-[11px] text-[#94A3B8] font-mono truncate max-w-[140px]">
                              {project.domain}
                            </span>

                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#5028E0] hover:text-[#4320BD] hover:underline"
                            >
                              <span>{isGithub ? 'View Repo' : isLinkedin ? 'View Profile' : 'Visit Web'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* SECTION 2: MATCHED INVESTORS & SYNDICATES */}
              <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-xs space-y-4 mt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#1E1B2E]">Matched Investors & Syndicates</h3>
                    <p className="text-xs text-[#64748B]">
                      Venture capital firms and angel syndicates targeting {activeAnalysis.stage || 'Seed'} stage projects
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(activeAnalysis.fundingMatches || []).map((f) => (
                    <div
                      key={f.id}
                      className="p-5 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#1E1B2E]">{f.firm}</span>
                        <span className="rounded bg-[#ECFDF5] text-[#059669] px-2 py-0.5 text-xs font-bold">
                          {f.matchScore}% match
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{f.rationale}</p>
                      <div className="pt-2 border-t border-[#EAEBF2] text-[11px] text-[#94A3B8] flex justify-between items-center">
                        <span>Check Size: {f.checkSize}</span>
                        <span className="text-[#5028E0] font-semibold">{f.investorName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: AI CHATBOT DETAILED SESSION */}
          {currentTab === 'chatbot' && (
            <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-sm space-y-4 max-w-4xl mx-auto">
              {/* Chat Header with Live AI Status & Session Pitch Deck */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EAEBF2] pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5028E0] to-[#7B5CF5] text-white flex items-center justify-center shadow-sm shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-base text-[#1E1B2E]">
                        VentureLens AI Diligence Copilot
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        AI Copilot Live
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] mt-1">
                      <span>Venture: <strong className="text-[#1E1B2E] font-bold">{activeAnalysis.title}</strong></span>
                      {activeRepoInfo ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EEECFC] text-[#5028E0] font-medium border border-[#DDD6FE] text-[11px]">
                          <Code2 className="w-3 h-3 text-[#5028E0]" />
                          <span className="font-semibold truncate max-w-[200px]">
                            {activeRepoInfo.owner}/{activeRepoInfo.repoName}
                          </span>
                          <span className="text-[9px] font-bold bg-[#10B981] text-white px-1.5 py-0.2 rounded">
                            AST Code Diligence
                          </span>
                          {activeRepoInfo.githubUrl && (
                            <a
                              href={activeRepoInfo.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#5028E0] hover:underline flex items-center gap-0.5 ml-1"
                              title="Open GitHub repository"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </span>
                      ) : activeSessionDoc ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EEECFC] text-[#5028E0] font-medium border border-[#DDD6FE] text-[11px]">
                          <FileText className="w-3 h-3 text-[#5028E0]" />
                          <span className="font-semibold truncate max-w-[200px]">{activeSessionDoc.name}</span>
                          {activeSessionDoc.isPdf && (
                            <span className="text-[9px] font-bold bg-[#5028E0] text-white px-1.5 py-0.2 rounded">
                              PDF Grounded
                            </span>
                          )}
                          {activeSessionDoc.storageUrl && (
                            <a
                              href={activeSessionDoc.storageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#5028E0] hover:underline flex items-center gap-0.5 ml-1"
                              title="Open original pitch deck PDF"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </span>
                      ) : (
                        <span className="text-[#F59E0B] text-[11px] font-medium">
                          ⚠️ No pitch deck uploaded for this session yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Session Switcher Dropdown & Back Button */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <span className="font-medium hidden md:inline">Venture:</span>
                    <select
                      value={activeAnalysis.id}
                      onChange={(e) => {
                        const selected = analyses.find((a) => a.id === e.target.value);
                        if (selected) {
                          selectAnalysis(selected);
                        }
                      }}
                      className="text-xs bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-[#1E1B2E] font-semibold focus:outline-none focus:border-[#5028E0] cursor-pointer"
                    >
                      {analyses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} {a.isDemo ? '(Demo)' : '(Uploaded)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('dashboard')}
                    className="text-xs font-semibold text-[#5028E0] hover:underline cursor-pointer"
                  >
                    ← Back to Dashboard
                  </button>
                </div>
              </div>

              {/* Chat History Container */}
              <div className="h-[460px] overflow-y-auto space-y-3.5 p-4 bg-[#F8F9FE] rounded-xl border border-[#EAEBF2]">
                {(activeAnalysis.chatHistory || []).map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xl p-4 rounded-2xl text-xs ${
                        m.role === 'user'
                          ? 'bg-[#5028E0] text-white shadow-sm'
                          : 'bg-white border border-[#EAEBF2] text-[#1E1B2E] shadow-xs'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#5028E0] mb-1.5">
                            <Sparkles className="w-3 h-3 text-[#5028E0]" />
                            <span>VentureLens Analyst</span>
                          </div>
                          <div className="whitespace-pre-wrap leading-relaxed text-[#1E1B2E] text-xs">
                            {m.text}
                          </div>
                        </div>
                      ) : (
                        <p className="leading-relaxed whitespace-pre-wrap text-xs">{m.text}</p>
                      )}
                      <span
                        className={`block text-[9px] mt-1.5 ${
                          m.role === 'user' ? 'text-white/70' : 'text-[#94A3B8]'
                        }`}
                      >
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {isChatThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#EAEBF2] text-[#5028E0] text-xs p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-[#5028E0] rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <div
                          className="w-2 h-2 bg-[#5028E0] rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <div
                          className="w-2 h-2 bg-[#5028E0] rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#64748B]">
                        {activeRepoInfo
                          ? 'AI Diligence Copilot is analyzing repository AST, code evidence & architecture...'
                          : 'AI Diligence Copilot is analyzing pitch deck vectors & diligence metrics...'}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#64748B]">Suggested Diligence Inquiries:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(activeRepoInfo
                    ? [
                        'What is the tech stack & architecture?',
                        'What technical claims were verified in the code?',
                        'What are the repository\'s code strengths?',
                        'Are there any technical risks or scaling flags?',
                        'Which files and components were audited?',
                      ]
                    : [
                        'What is the revenue & commercial model?',
                        'Who are the founders & leadership team?',
                        'What are the primary investment risks & red flags?',
                        'Summarize traction, customers, and market sizing',
                        'Are there any contradictions across documents?',
                      ]
                  ).map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSendChat(chip)}
                      disabled={isChatThinking}
                      className="px-2.5 py-1 rounded-lg bg-[#F4F1FD] border border-[#DDD6FE] hover:border-[#5028E0] hover:bg-white text-[11px] font-medium text-[#5028E0] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    activeRepoInfo
                      ? `Ask anything about ${activeAnalysis.title}'s code, architecture, tech stack, or files...`
                      : `Ask anything about ${activeAnalysis.title} (e.g. revenue, risks, traction, founders)...`
                  }
                  disabled={isChatThinking}
                  className="flex-1 px-4 py-3 bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl text-xs text-[#1E1B2E] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#5028E0] transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatThinking}
                  className="px-5 py-3 rounded-xl bg-[#5028E0] text-white text-xs font-semibold hover:bg-[#4320BD] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 9: REPORTS & EXPORTS */}
          {currentTab === 'reports' && (
            <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B2E]">
                    Investment Memo & Deliverable Reports
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Export verified institutional briefs for {activeAnalysis.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className="text-xs font-semibold text-[#5028E0] hover:underline"
                >
                  ← Back to Dashboard
                </button>
              </div>

              {/* 4 Agent 5 Deliverables (Matching System Design Diagram: PDF, PPT, Excel, Share Link) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. PDF Investment Memo */}
                <div className="p-5 rounded-2xl border border-[#EAEBF2] bg-[#F8F9FE] flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Print-Ready PDF
                    </span>
                    <h4 className="font-bold text-sm text-[#1E1B2E] mt-2">Full Investment Memo</h4>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      Comprehensive diligence report with calibrated scorecards, risk matrix, and investment thesis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportAnalysisToPDF(activeAnalysis)}
                    className="mt-5 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* 2. PPT Presentation Deck */}
                <div className="p-5 rounded-2xl border border-[#EAEBF2] bg-[#F8F9FE] flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Slide Deck
                    </span>
                    <h4 className="font-bold text-sm text-[#1E1B2E] mt-2">IC Presentation Deck</h4>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      Executive 4-slide diligence briefing deck formatted for partner meetings and IC votes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportAnalysisToPPT(activeAnalysis)}
                    className="mt-5 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Slides</span>
                  </button>
                </div>

                {/* 3. Excel Financial Model */}
                <div className="p-5 rounded-2xl border border-[#EAEBF2] bg-[#F8F9FE] flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Excel / CSV
                    </span>
                    <h4 className="font-bold text-sm text-[#1E1B2E] mt-2">Financial & Diligence Model</h4>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      Normalized metrics, dimension weights, sensitivity tables, and due-diligence questions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportAnalysisToExcel(activeAnalysis)}
                    className="mt-5 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Model</span>
                  </button>
                </div>

                {/* 4. Shareable Diligence Link */}
                <div className="p-5 rounded-2xl border border-[#EAEBF2] bg-[#F8F9FE] flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5028E0] flex items-center justify-center mb-3">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5028E0] bg-[#EEECFB] px-2 py-0.5 rounded-full border border-[#DCD6FA]">
                      Direct Link
                    </span>
                    <h4 className="font-bold text-sm text-[#1E1B2E] mt-2">Shareable Report Link</h4>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      One-click clipboard link for sharing live diligence findings with co-investors and partners.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => generateShareLink(activeAnalysis?.id, activeAnalysis?.title)}
                    className="mt-5 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#5028E0] text-white text-xs font-semibold hover:bg-[#4320BD] cursor-pointer shadow-xs transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Share Link</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
