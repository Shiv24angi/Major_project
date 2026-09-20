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
} from 'lucide-react';
import {
  getStoredAnalyses,
  getActiveAnalysis,
  setActiveAnalysisId,
  updateAnalysisChat,
  saveAnalyses,
  type AnalysisRecord,
} from '../services/analysisStorage';
import { getRouteParams, navigateTo } from '../shared/preset-site-routing';
import Agent6DiligenceView from '../components/Agent6DiligenceView';
import { checkAgent6Health } from '../services/agent6Service';
import Agent1DiligenceView from '../components/Agent1DiligenceView';
import { checkAgent1Health } from '../services/agent1Service';
import {
  uploadDocumentToSupabaseStorage,
  getAgent1EvaluationByAnalysisId,
  getDocumentsByAnalysisId,
  fetchAnalysesFromSupabase,
  saveChatMessageToSupabase,
  fetchChatMessagesFromSupabase,
  type Agent1EvaluationRecord,
} from '../services/supabaseService';
import { queryVentureAiChat, getSessionPitchDeck } from '../services/aiChatService';

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

  // Agent 1 & Agent 6 backend connectivity status
  const [agent1Online, setAgent1Online] = useState(false);
  const [agent6Online, setAgent6Online] = useState(false);

  // Agent 1 evaluation result from Supabase
  const [agent1Eval, setAgent1Eval] = useState<Agent1EvaluationRecord | null>(null);

  // Interactive AI chat input & auto-scroll ref
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Load analyses on mount and respond to route
  useEffect(() => {
    const loaded = getStoredAnalyses();
    setAnalyses(loaded);

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

        // Auto-select latest real non-demo startup (e.g. Grow / ArangoDB) if current is demo or unset
        const currentActiveId = getActiveAnalysisId();
        const nonDemo = dbAnalyses.filter((a) => !a.isDemo);
        if (nonDemo.length > 0) {
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
    }).catch((err) => console.warn('[DashboardPage] Supabase fetch warning:', err));

    // Initial check and periodic polling of Agent 1 (port 8001) and Agent 6 (port 8000)
    checkAgent1Health().then((res) => setAgent1Online(res.online));
    checkAgent6Health().then((res) => setAgent6Online(res.online));
    const healthInterval = setInterval(() => {
      checkAgent1Health().then((res) => setAgent1Online(res.online));
      checkAgent6Health().then((res) => setAgent6Online(res.online));
    }, 8000);

    const params = getRouteParams();
    if (params.id) {
      const found = loaded.find((a) => a.id === params.id);
      if (found) {
        setActiveAnalysis(found);
        setActiveAnalysisId(found.id);
      } else {
        const active = getActiveAnalysis();
        setActiveAnalysis(active);
      }
    } else {
      const active = getActiveAnalysis();
      setActiveAnalysis(active);
    }

    return () => clearInterval(healthInterval);
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

  if (!activeAnalysis) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FE]">
        <div className="text-center font-medium text-sm text-[#64748B]">
          Loading VentureLens Intelligence Engine...
        </div>
      </div>
    );
  }

  // Active pitch deck document attached to this venture session
  const activeSessionDoc = activeAnalysis ? getSessionPitchDeck(activeAnalysis, agent1Eval) : null;

  // Dimension scores mapping for the 6 cards under the hero
  const scoreDimensions = [
    { label: 'Market Score', val: activeAnalysis.scores.market, color: 'bg-[#10B981]' },
    { label: 'Product Score', val: activeAnalysis.scores.product, color: 'bg-[#10B981]' },
    { label: 'Team Score', val: activeAnalysis.scores.team, color: 'bg-[#10B981]' },
    {
      label: 'Financial Score',
      val: activeAnalysis.scores.financial,
      color: activeAnalysis.scores.financial >= 80 ? 'bg-[#10B981]' : 'bg-[#F59E0B]',
    },
    {
      label: 'Traction Score',
      val: activeAnalysis.scores.traction,
      color: activeAnalysis.scores.traction >= 80 ? 'bg-[#10B981]' : 'bg-[#F59E0B]',
    },
    {
      label: 'Risk Score',
      val: activeAnalysis.scores.risk,
      color: activeAnalysis.scores.risk >= 80 ? 'bg-[#10B981]' : 'bg-[#F59E0B]',
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FE] text-[#1E1B2E] antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 xl:w-72 bg-white border-r border-[#EAEBF2] p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <VentureLensLogo className="w-8 h-8 shrink-0" />
              <div>
                <span className="text-base font-bold text-[#1E1B2E] tracking-tight block leading-tight">
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
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'agent1', label: 'Agent 1 Document Diligence', icon: FileText, badge: agent1Online ? 'Online' : 'Ready' },
              { id: 'agent6', label: 'Agent 6 Code Diligence', icon: Code2, badge: agent6Online ? 'Online' : 'Ready' },
              { id: 'new-analysis', label: 'New Analysis', icon: PlusCircle, isAction: true },
              { id: 'my-analyses', label: 'My Analyses', icon: Folder },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'gmail', label: 'Gmail Integration', icon: Mail },
              { id: 'knowledge-base', label: 'Knowledge Base', icon: Database },
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
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#EEECFC] text-[#5028E0] font-semibold'
                      : 'text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 ${
                        isActive ? 'text-[#5028E0]' : 'text-[#64748B]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
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
          <div className="pt-2">
            <p className="px-3.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Analysis Tools
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => navigateTo('analyze-startup')}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4.5 h-4.5 shrink-0 text-[#64748B]" />
                <span>Startup Analysis</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('analyze-project')}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors cursor-pointer"
              >
                <Code2 className="w-4.5 h-4.5 shrink-0 text-[#64748B]" />
                <span>Project → Startup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Settings & Upgrade to Pro */}
        <div className="space-y-4 pt-4 border-t border-[#EAEBF2]">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => alert('Settings configuration modal')}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors cursor-pointer"
            >
              <Settings className="w-4.5 h-4.5 shrink-0 text-[#64748B]" />
              <span>Settings</span>
            </button>
            <button
              type="button"
              onClick={() => alert('VentureLens Support: support@venturelens.ai')}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E] transition-colors cursor-pointer"
            >
              <LifeBuoy className="w-4.5 h-4.5 shrink-0 text-[#64748B]" />
              <span>Help & Support</span>
            </button>
          </div>

          {/* Upgrade to Pro Promo Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#F4F1FD] to-[#EDE9FE] border border-[#DDD6FE] p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#5028E0] text-white flex items-center justify-center shadow-xs">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-xs text-[#1E1B2E]">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-snug mb-3">
              Unlock more analyses, higher limits and advanced features.
            </p>
            <button
              type="button"
              onClick={() => alert('Pro Plan: Unlimited agent evaluations and team exports.')}
              className="w-full py-1.5 px-3 rounded-lg bg-white border border-[#DDD6FE] text-[#5028E0] hover:bg-[#F8F7FD] font-semibold text-xs transition-colors shadow-2xs cursor-pointer text-center"
            >
              View Plans
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP APP BAR */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#EAEBF2] px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
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
            {/* Agent 1 Backend Status Indicator */}
            <button
              type="button"
              onClick={() => setCurrentTab('agent1')}
              title="Agent 1 Document Diligence Engine Status (Port 8001)"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                agent1Online
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] hover:bg-[#D1FAE5]'
                  : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] hover:bg-[#FEF3C7]'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {agent1Online && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    agent1Online ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                  }`}
                />
              </span>
              <span className="hidden sm:inline">
                Agent 1: <strong className="font-bold">{agent1Online ? 'Online (8001)' : 'Standby'}</strong>
              </span>
              <span className="sm:hidden font-bold">A1</span>
            </button>

            {/* Agent 6 Backend Status Indicator */}
            <button
              type="button"
              onClick={() => setCurrentTab('agent6')}
              title="Agent 6 Code Diligence Engine Status (Port 8000)"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                agent6Online
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] hover:bg-[#D1FAE5]'
                  : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] hover:bg-[#FEF3C7]'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {agent6Online && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    agent6Online ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                  }`}
                />
              </span>
              <span className="hidden sm:inline">
                Agent 6: <strong className="font-bold">{agent6Online ? 'Online (8000)' : 'Standby'}</strong>
              </span>
              <span className="sm:hidden font-bold">A6</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-xl text-[#64748B] hover:text-[#1E1B2E] hover:bg-[#F8F9FE] transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#5028E0] ring-2 ring-white" />
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center gap-3 pl-2 border-l border-[#EAEBF2]">
              <div className="w-9 h-9 rounded-full bg-[#1E1B4B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                VA
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-[#1E1B2E] leading-tight">
                  Vansh Aggarwal
                </span>
                <span className="block text-[11px] text-[#64748B] leading-tight">Investor</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] hidden sm:block" />
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 p-6 lg:p-8 max-w-[90rem] w-full mx-auto space-y-6">
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
                              <span>Agent 6 Verified</span>
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
                            <span>Agent 1 Document Verified</span>
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

                {/* Agent 1 Live Intelligence Banner (When evaluation exists in Supabase) */}
                {agent1Eval && (
                  <div className="rounded-xl border border-[#DDD6FE] bg-gradient-to-r from-[#F8F9FE] to-[#F4F1FD] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#5028E0] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        A1
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[#1E1B2E]">
                            Agent 1 Document Intelligence
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
                            'Multi-document findings and claims verified by LangGraph engine.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentTab('agent1')}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#5028E0] text-white hover:bg-[#4320BD] shrink-0 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Inspect Agent 1 Diligence</span>
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
                          ? 'Analysis Pipeline (Agent 6 Code Diligence → Agent 2)'
                          : 'Analysis Pipeline (Startup Evaluation)'}
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
                          { step: 'Repo AST Parsing', agent: 'Agent 6 — Stage 1' },
                          { step: 'Codebase Analysis', agent: 'Agent 6 — Stage 2' },
                          { step: 'Technical Claims', agent: 'Agent 6 — Stage 3' },
                          { step: 'Data Normalization', agent: 'Agent 6 → Agent 2' },
                          { step: 'Venture Diligence', agent: 'Agent 5' },
                        ]
                      : [
                          { step: 'Document Analysis', agent: 'Agent 1' },
                          { step: 'Data Normalization', agent: 'Agent 2' },
                          { step: 'Scoring Engine', agent: 'Agent 3' },
                          { step: 'Insights & Recommendation', agent: 'Agent 4' },
                          { step: 'Report Generation', agent: 'Agent 5' },
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

              {/* AGENT 6 CODE DILIGENCE HIGHLIGHT BANNER (PROJECT MODE) */}
              {(activeAnalysis.mode === 'project' || activeAnalysis.codeDetails) && (
                <div className="rounded-2xl border border-[#DDD6FE] bg-gradient-to-r from-[#F4F1FD] via-white to-[#F8F9FE] p-6 shadow-2xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5028E0] text-white flex items-center gap-1.5 shadow-2xs">
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Agent 6 Code Intelligence Active</span>
                        </span>
                        <span className="text-xs text-[#64748B] font-mono">
                          {activeAnalysis.codeDetails?.filesDiscovered || 58} Files Discovered • {activeAnalysis.codeDetails?.filesRead || 15} Files Audited
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#1E1B2E]">
                        Codebase Verified: {activeAnalysis.title}
                      </h3>
                      <p className="text-xs text-[#64748B] max-w-3xl">
                        Agent 6 audited the repository AST and extracted verified architectural claims, evidence-backed capabilities, and security posture for venture due diligence.
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
                      <span>Open Agent 6 Inspector</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* LOWER 4-CARD GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* CARD 1: Key Insights */}
                <div className="rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm text-[#1E1B2E]">
                        <div className="w-6 h-6 rounded-lg bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span>Key Insights</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('reports')}
                        className="text-xs font-semibold text-[#5028E0] hover:underline cursor-pointer"
                      >
                        View all →
                      </button>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#1E1B2E] block">
                            Large market opportunity
                          </span>
                          <span className="text-[11px] text-[#64748B] leading-tight block">
                            Significant and growing demand for alternative accommodations.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#1E1B2E] block">
                            Experienced founding team
                          </span>
                          <span className="text-[11px] text-[#64748B] leading-tight block">
                            Strong execution track record and domain expertise.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#F4F1FD] text-[#5028E0] flex items-center justify-center shrink-0 mt-0.5">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#1E1B2E] block">
                            Scalable business model
                          </span>
                          <span className="text-[11px] text-[#64748B] leading-tight block">
                            Asset-light model with high scalability potential.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#1E1B2E] block">Key risks</span>
                          <span className="text-[11px] text-[#64748B] leading-tight block">
                            High customer acquisition costs and increasing competition in core
                            markets.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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

              {/* BOTTOM ROW: RECENT ANALYSES TABLE & QUICK ACTIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Analyses Table (8 cols) */}
                <div className="lg:col-span-8 rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#1E1B2E]">
                      <FileSpreadsheet className="w-4 h-4 text-[#5028E0]" />
                      <span>Recent Analyses</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('my-analyses')}
                      className="text-xs font-semibold text-[#5028E0] hover:underline cursor-pointer"
                    >
                      View all →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#F1F2F6] text-[#94A3B8] font-semibold pb-2">
                          <th className="pb-2.5 font-medium">Startup</th>
                          <th className="pb-2.5 font-medium">Type</th>
                          <th className="pb-2.5 font-medium">Industry</th>
                          <th className="pb-2.5 font-medium">Score</th>
                          <th className="pb-2.5 font-medium">Recommendation</th>
                          <th className="pb-2.5 font-medium text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F2F6]">
                        {analyses.map((a) => (
                          <tr
                            key={a.id}
                            onClick={() => selectAnalysis(a)}
                            className={`hover:bg-[#F8F9FE] cursor-pointer transition-colors ${
                              a.id === activeAnalysis.id ? 'bg-[#EEECFC]/30' : ''
                            }`}
                          >
                            <td className="py-3 font-semibold text-[#1E1B2E] flex items-center gap-2">
                              {a.title === 'Airbnb' ? (
                                <div className="w-5 h-5 rounded bg-[#FF5A5F] text-white flex items-center justify-center text-[10px] font-bold">
                                  <AirbnbIcon className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded bg-[#5028E0] text-white flex items-center justify-center text-[10px] font-bold">
                                  {a.title.charAt(0)}
                                </div>
                              )}
                              <span>{a.title}</span>
                            </td>
                            <td className="py-3 text-[#64748B]">
                              {a.mode === 'project' ? 'Project → Startup' : 'Startup Evaluation'}
                            </td>
                            <td className="py-3 text-[#64748B]">{a.industry}</td>
                            <td className="py-3 font-bold text-[#10B981]">{a.overallScore}</td>
                            <td className="py-3">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                  a.recommendation === 'INVEST'
                                    ? 'bg-[#ECFDF5] text-[#059669]'
                                    : a.recommendation === 'MAYBE'
                                    ? 'bg-[#FEF6E7] text-[#D97706]'
                                    : 'bg-[#FEF2F2] text-[#DC2626]'
                                }`}
                              >
                                {a.recommendation}
                              </span>
                            </td>
                            <td className="py-3 text-right text-[#94A3B8] font-mono">
                              {a.createdAt.split('T')[0]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Actions (4 cols) */}
                <div className="lg:col-span-4 rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#1E1B2E] block">Quick Actions</span>
                    <div className="grid grid-cols-2 gap-2.5 pt-3">
                      <button
                        type="button"
                        onClick={() => navigateTo('new-analysis')}
                        className="p-3 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#5028E0] hover:bg-[#F8F9FE] transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <PlusCircle className="w-5 h-5 text-[#5028E0]" />
                        <span className="text-xs font-semibold text-[#1E1B2E]">New Analysis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentTab('documents')}
                        className="p-3 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#5028E0] hover:bg-[#F8F9FE] transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <UploadCloud className="w-5 h-5 text-[#5028E0]" />
                        <span className="text-xs font-semibold text-[#1E1B2E]">Upload Docs</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentTab('gmail')}
                        className="p-3 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#5028E0] hover:bg-[#F8F9FE] transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Mail className="w-5 h-5 text-[#5028E0]" />
                        <span className="text-xs font-semibold text-[#1E1B2E]">Connect Gmail</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentTab('reports')}
                        className="p-3 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#5028E0] hover:bg-[#F8F9FE] transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-[#5028E0]" />
                        <span className="text-xs font-semibold text-[#1E1B2E]">View Reports</span>
                      </button>
                    </div>
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
                    <span>Cross-Examine with Agent 1 →</span>
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
                {activeAnalysis.documents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8F9FE] rounded-xl border border-[#EAEBF2]">
                    No documents uploaded yet for this venture. Upload a pitch deck or financial model to store in Supabase.
                  </div>
                ) : (
                  activeAnalysis.documents.map((d) => (
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
                {activeAnalysis.dueDiligenceQuestions.map((q, i) => (
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

          {/* TAB 7: FUNDING DISCOVERY */}
          {currentTab === 'funding' && (
            <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B2E]">Funding Discovery & Syndicates</h2>
                  <p className="text-xs text-[#64748B]">
                    Matched investors aligned with {activeAnalysis.title} stage and industry
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
                {activeAnalysis.fundingMatches.map((f) => (
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
                    <div className="pt-2 border-t border-[#EAEBF2] text-[11px] text-[#94A3B8]">
                      <span>Check Size: {f.checkSize}</span>
                    </div>
                  </div>
                ))}
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
                      {activeSessionDoc ? (
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
                {activeAnalysis.chatHistory.map((m) => (
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
                        AI Diligence Copilot is analyzing pitch deck vectors & diligence metrics...
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
                  {[
                    'What is the revenue & commercial model?',
                    'Who are the founders & leadership team?',
                    'What are the primary investment risks & red flags?',
                    'Summarize traction, customers, and market sizing',
                    'Are there any contradictions across documents?',
                  ].map((chip) => (
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
                  placeholder={`Ask anything about ${activeAnalysis.title} (e.g. revenue, risks, traction, founders)...`}
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
                    Investment Memo & Agent 5 Reports
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Full Investment Memo (PDF)',
                    desc: '18-page comprehensive diligence report with risk assessment',
                  },
                  {
                    title: 'IC Presentation Deck (PPTX)',
                    desc: 'Executive 10-slide summary formatted for partner meetings',
                  },
                  {
                    title: 'Normalized Financial Model (XLSX)',
                    desc: 'Standardized 3-statement forecast with sensitivity matrix',
                  },
                ].map((rep) => (
                  <div
                    key={rep.title}
                    className="p-5 rounded-xl border border-[#EAEBF2] bg-[#F8F9FE] flex flex-col justify-between"
                  >
                    <div>
                      <FileSpreadsheet className="w-7 h-7 text-[#5028E0] mb-2" />
                      <h4 className="font-bold text-sm text-[#1E1B2E]">{rep.title}</h4>
                      <p className="text-xs text-[#64748B] mt-1">{rep.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading ${rep.title}...`)}
                      className="mt-4 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#5028E0] text-white text-xs font-semibold hover:bg-[#4320BD] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Report</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
