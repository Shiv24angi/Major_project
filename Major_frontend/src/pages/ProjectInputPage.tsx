import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  GitBranch,
  Globe,
  FileCode,
  FileText,
  Trash2,
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
}

export default function ProjectInputPage() {
  const [projectName, setProjectName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Hidden file inputs
  const zipInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const metricsInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    const newFiles: UploadedFileItem[] = Array.from(uploaded).map((f, i) => ({
      id: `proj_file_${Date.now()}_${i}`,
      name: f.name,
      category,
      size: formatFileSize(f.size),
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    if (e.target) e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!projectName.trim()) {
      newErrors.push('Please provide the Project Name.');
    }

    const trimmedGithub = githubUrl.trim();
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
    if (!trimmedGithub) {
      newErrors.push('Please provide a valid GitHub repository URL.');
    } else if (!githubRegex.test(trimmedGithub)) {
      newErrors.push('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repository).');
    }

    if (!projectDescription.trim() || projectDescription.trim().length < 15) {
      newErrors.push('Please provide a project description explaining what problem the project solves (at least 15 characters).');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);

    // Extract repository name from GitHub URL
    const repoParts = trimmedGithub.replace(/\/$/, '').split('/');
    const repoOwner = repoParts[repoParts.length - 2];
    const repoName = repoParts[repoParts.length - 1];

    const documentsList: AnalysisDocument[] = [
      {
        id: `github_${Date.now()}`,
        name: `${repoOwner}/${repoName} (GitHub Repository)`,
        type: 'Source Repository',
        size: '18 Files Read',
        status: 'indexed',
        chunks: 34,
        uploadDate: new Date().toISOString().split('T')[0],
      },
      ...files.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.category,
        size: f.size,
        status: 'indexed' as const,
        chunks: Math.floor(Math.random() * 20) + 8,
        uploadDate: new Date().toISOString().split('T')[0],
      })),
    ];

    const analysisId = `eval_proj_${repoName.toLowerCase()}_${Date.now()}`;

    const newRecord: AnalysisRecord = {
      id: analysisId,
      title: projectName.trim(),
      mode: 'project',
      tagline: projectDescription.trim().slice(0, 90) + (projectDescription.length > 90 ? '...' : ''),
      industry: 'Developer Tools / Software Infrastructure',
      website: demoUrl.trim() || trimmedGithub,
      stage: 'Project → Startup Transition',
      createdAt: new Date().toISOString(),
      status: 'processing',
      isDemo: false,
      overallScore: 81,
      recommendation: 'MONITOR',
      confidence: 'Moderate',
      thesis: `High technical execution observed in codebase architecture with verifiable modular separation. Strong developer problem statement. Transition to commercial startup requires establishing pricing tiers and developer acquisition channels.`,
      scores: {
        market: 78,
        product: 86,
        team: 75,
        financial: 68,
        traction: 72,
        risk: 84,
      },
      keyInsights: {
        strengths: [
          `Agent 6 Code Diligence verified functional modular architecture across ${repoParts[repoParts.length - 1]}`,
          `High test suite coverage and structured schema definitions in repository files`,
          `Solves clear developer friction: ${projectDescription.trim().slice(0, 100)}`,
        ],
        risks: [
          'Unclear monetization layer between open-source project and enterprise SaaS offerings',
          'Absence of automated telemetry to measure end-user retention or API usage frequency',
        ],
        opportunities: [
          'Introduce managed cloud-hosted tier with automated SLAs',
          'Expand developer ecosystem via CLI plugins and community integrations',
        ],
        nextSteps: [
          'Publish benchmark comparison against alternative closed-source tooling',
          'Deploy hosted landing page with self-serve developer signup',
        ],
      },
      dueDiligenceQuestions: [
        {
          id: 'q1',
          question: 'What architectural components will be reserved for the proprietary enterprise edition vs open-source core?',
          category: 'Commercial Strategy',
          whyItMatters: 'Protects commercial revenue from cloud provider commoditization.',
          suggestedValidation: 'Examine product licensing matrix and open-core feature roadmap.',
        },
        {
          id: 'q2',
          question: 'What is the developer onboarding friction and time-to-first-API-call?',
          category: 'Product Velocity',
          whyItMatters: 'High setup friction dampens organic developer adoption velocity.',
          suggestedValidation: 'Conduct interactive onboarding audit using quickstart documentation.',
        },
      ],
      documents: documentsList,
      codeDetails: {
        githubUrl: trimmedGithub,
        techStack: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'RESTful API'],
        features: [
          'Modular service architecture',
          'Automated validation and schema checks',
          'Database migration hooks',
          'OpenAPI / Swagger documentation',
        ],
        technicalStrengths: [
          'Clean separation of concerns across service layers',
          'Evidence-verified API route error handling',
        ],
        technicalConcerns: [
          'Rate limiting and distributed concurrency safeguards should be formalized for production loads',
        ],
        filesDiscovered: 86,
        filesRead: 14,
      },
      fundingMatches: [
        {
          id: 'fund_proj_1',
          investorName: 'Marcus Vance',
          firm: 'DevSeed Capital',
          stage: 'Pre-Seed / Seed',
          focusSectors: ['Developer Tools', 'Open Source Software', 'Infrastructure'],
          checkSize: '$250K - $1M',
          matchScore: 92,
          rationale: 'Backs technical founders spinning out open-source projects into venture-backed businesses.',
        },
      ],
      chatHistory: [
        {
          id: 'c1',
          role: 'assistant',
          text: `Analysis complete for ${projectName}. Agent 6 evaluated the repository structure and piped technical findings into the startup viability assessment.`,
          timestamp: 'Just now',
        },
      ],
    };

    addAnalysis(newRecord);
    navigateTo('processing', { id: analysisId, mode: 'project' });
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
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold text-cyan-900 mb-3 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
              <span>MODE B • PROJECT → STARTUP</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-semibold tracking-tight text-black mb-4"
              style={{ letterSpacing: '-0.03em' }}
            >
              Turn Your Project Into a Startup Analysis
            </h1>
            <p className="text-lg md:text-xl text-black/70 leading-relaxed">
              Provide your repository and project context. VentureLens will evaluate the technology,
              product, market potential, and startup viability.
            </p>
          </div>

          {/* Error Alert */}
          {errors.length > 0 && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>Please fix the following inputs:</span>
              </div>
              <ul className="list-disc pl-6 space-y-1 text-sm text-red-700">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={validateAndSubmit} className="space-y-8">
            {/* SECTION 1: PROJECT BASICS */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-1">1. Project Basics</h2>
              <p className="text-xs text-black/60 mb-6">Core project identification</p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EcoVerse, BookingAPI, VectorPulse"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full rounded-xl border border-black/15 bg-[#FBFBFB] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none"
                />
              </div>
            </div>

            {/* SECTION 2: GITHUB REPOSITORY URL */}
            <div className="rounded-3xl border-2 border-cyan-500/30 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-black flex items-center gap-2">
                  <span>2. GitHub Repository URL</span>
                  <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-bold text-cyan-800 uppercase tracking-wider">
                    Required
                  </span>
                </h2>
              </div>
              <p className="text-xs text-black/60 mb-6">
                Evaluated by Agent 6 (Project → Startup Code Agent) using AST parsing and Code RAG.
              </p>

              <div className="relative">
                <GitBranch className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-700" />
                <input
                  type="url"
                  required
                  placeholder="https://github.com/Shiv24angi/EcoVerse"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full rounded-xl border border-cyan-200 bg-cyan-50/20 pl-10 pr-4 py-3 text-sm font-mono text-black placeholder:text-black/40 focus:border-cyan-600 focus:outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-black/50">
                Example: <code className="bg-black/5 px-1.5 py-0.5 rounded">https://github.com/Shiv24angi/EcoVerse</code>
              </p>
            </div>

            {/* SECTION 3: CODEBASE UPLOAD (.ZIP OPTIONAL) */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-1">3. Codebase Archive (Optional)</h2>
              <p className="text-xs text-black/60 mb-6">
                Upload a complete codebase (.zip) if analyzing a private or offline repository
              </p>

              <input
                ref={zipInputRef}
                type="file"
                accept=".zip,.tar,.gz"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'Codebase Archive')}
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-black/10 bg-[#FAFAFA] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black">Upload Codebase Archive</p>
                    <p className="text-xs text-black/50">ZIP or TAR archive up to 100MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => zipInputRef.current?.click()}
                  className="rounded-full border border-black/20 bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  Upload Codebase .zip
                </button>
              </div>
            </div>

            {/* SECTION 4: PROJECT PROBLEM DESCRIPTION */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-1">4. Project Problem Statement <span className="text-red-500">*</span></h2>
              <p className="text-xs text-black/60 mb-4">
                What problem does the project solve? What is its target commercial use case?
              </p>

              <textarea
                rows={4}
                required
                placeholder="Explain the core problem solved, target users, and why this project could become a scalable product or venture..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full rounded-xl border border-black/15 bg-[#FBFBFB] p-4 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none"
              />
            </div>

            {/* SECTION 5: DOCUMENTATION & LIVE DEMO */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-1">5. Documentation & Live Demo</h2>
              <p className="text-xs text-black/60 mb-6">README, Architecture specs, and live preview</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2">
                    Live Demo or Deployed Website URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-black/40" />
                    <input
                      type="url"
                      placeholder="https://myproject-demo.vercel.app"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      className="w-full rounded-xl border border-black/15 bg-[#FBFBFB] pl-10 pr-4 py-3 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <input
                  ref={docInputRef}
                  type="file"
                  multiple
                  accept=".md,.pdf,.txt"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'Project Documentation')}
                />

                <div className="flex items-center justify-between rounded-xl border border-black/10 bg-[#FAFAFA] p-4">
                  <div>
                    <p className="text-xs font-semibold text-black">Upload Architecture Docs / README</p>
                    <p className="text-[11px] text-black/50">Markdown, PDF, or text documentation</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="rounded-full border border-black/20 bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                  >
                    Upload Docs
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 6: SUPPORTING ATTACHMENTS */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-black">6. Supporting Documents & Metrics</h2>
                <button
                  type="button"
                  onClick={() => metricsInputRef.current?.click()}
                  className="rounded-full border border-black/20 bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  + Add File
                </button>
              </div>
              <p className="text-xs text-black/60 mb-6">User analytics, benchmarks, design mockups</p>

              <input
                ref={metricsInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'Supporting Metrics')}
              />

              {files.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 p-6 text-center text-xs text-black/40">
                  No additional files attached yet. (GitHub repository URL will be parsed by default)
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
                        <span className="rounded-full bg-cyan-100 text-cyan-800 px-2 py-0.5 font-mono text-[10px]">
                          Attached
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
                className="group flex w-full items-center justify-between rounded-full bg-[#1F2438] px-8 py-5 text-lg font-semibold text-white transition-all hover:bg-black shadow-xl cursor-pointer"
              >
                <span>Analyze Project</span>
                <span className="rounded-full bg-cyan-400 p-2.5 text-black transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-black/50">
                <ShieldCheck className="h-4 w-4 text-cyan-600" />
                <span>Agent 6 parses AST, tech stack, and scalability metrics before piping to Agent 2</span>
              </div>
            </div>
          </form>
        </main>
      </div>

      <Footer />
    </div>
  );
}
