/**
 * Mock Data Repository for AI Startup Evaluation Platform Dashboard
 * Includes Mode A & Mode B startup evaluations, multi-agent artifacts, and handoff payloads.
 */

const STARTUP_DATABASE = {
  ecoverse: {
    id: "ecoverse",
    name: "EcoVerse",
    tagline: "Decentralized Carbon Credit Verification & Real-time ESG Telemetry",
    mode: "Mode B (Project → Startup)",
    category: "ClimateTech / Web3 / Enterprise SaaS",
    stage: "Seed / Pre-Series A",
    website: "https://ecoverse.eco",
    github_url: "https://github.com/Shiv24angi/EcoVerse",
    founder: "Shivangi & Team",
    founded_year: "2024",
    location: "San Francisco, CA / Bengaluru, IN",
    overall_score: 88,
    verdict: "INVEST",
    verdict_badge: "High Conviction",
    verdict_color: "#10B981",
    confidence: "High (94%)",
    scores: {
      product_tech: { score: 92, weight: 25, grade: "A+" },
      market_potential: { score: 87, weight: 20, grade: "A" },
      team_execution: { score: 85, weight: 20, grade: "A-" },
      financial_viability: { score: 82, weight: 15, grade: "B+" },
      traction_growth: { score: 89, weight: 10, grade: "A" },
      risk_resilience: { score: 90, weight: 10, grade: "A+" }
    },
    metrics: {
      mrr: "$48,500",
      arr_runrate: "$582,000",
      growth_mom: "+24.5%",
      gross_margin: "82%",
      cac: "$1,450",
      ltv: "$18,200",
      ltv_cac_ratio: "12.5x",
      burn_rate: "$32,000 / mo",
      runway: "18 Months",
      total_raised: "$850,000 (Angel/Grant)"
    },
    market: {
      tam: "$48.5 Billion (Global Voluntary Carbon & ESG Market 2030)",
      sam: "$14.2 Billion (Enterprise Automated Verification & MRV)",
      som: "$1.85 Billion (Mid-Market B2B & Energy Corporations)",
      cagr: "31.2% (2024-2030)"
    },
    agent6_findings: [
      {
        category: "technology",
        claim: "Modern full-stack architecture built with Next.js 14, TypeScript, TailwindCSS, and Node.js microservices",
        status: "supported",
        evidence: ["package.json", "tsconfig.json", "src/app/layout.tsx"]
      },
      {
        category: "technical",
        claim: "Automated cryptographic smart contract verification pipeline for on-chain carbon credits",
        status: "supported",
        evidence: ["contracts/CarbonCreditVerifier.sol", "lib/web3/client.ts", "test/verifier.test.ts"]
      },
      {
        category: "technical",
        claim: "High-throughput telemetry ingestion pipeline with Redis caching and WebSocket live stream",
        status: "supported",
        evidence: ["services/telemetry_service.py", "lib/redis.ts", "routes/stream.py"]
      },
      {
        category: "feature",
        claim: "Automated satellite & IoT sensor data ingestion for real-time forest/soil carbon quantification",
        status: "supported",
        evidence: ["services/geospatial_parser.py", "components/MapTelemetry.tsx"]
      },
      {
        category: "feature",
        claim: "Multi-tenant enterprise organization switcher and role-based access control (RBAC)",
        status: "supported",
        evidence: ["middleware.ts", "lib/auth/roles.ts", "models/Organization.ts"]
      },
      {
        category: "architecture",
        claim: "Modular separation of concerns with LangGraph AI agents orchestrating data verification",
        status: "supported",
        evidence: ["services/agent6/graph.py", "services/agent6/nodes.py"]
      },
      {
        category: "startup_signals",
        claim: "Automated CI/CD workflows, Docker containerization, and staging deployment configs detected",
        status: "supported",
        evidence: [".github/workflows/deploy.yml", "Dockerfile", "docker-compose.yml"]
      },
      {
        category: "problem",
        claim: "B2B enterprise tiered pricing model and automated Stripe billing webhook handling",
        status: "inferred",
        evidence: ["pages/api/billing/webhook.ts", "types/subscription.d.ts"]
      },
      {
        category: "market",
        claim: "Direct API integration with Verra and Gold Standard legacy carbon registries",
        status: "unknown",
        evidence: []
      }
    ],
    agent1_findings: {
      problem_statement: "Enterprises face rigorous ESG compliance mandates (CSRD, SEC Climate Rules) but rely on manual, slow (6-12 month), and error-prone third-party audits with up to 35% greenwashing risk.",
      solution: "EcoVerse provides automated, satellite-verified MRV (Measurement, Reporting & Verification) software with smart contracts and instant audit trails.",
      target_customers: ["Fortune 500 ESG Officers", "Renewable Energy Project Developers", "Institutional Asset Managers"],
      competitors: [
        { name: "Pachama", pros: "Strong satellite AI", cons: "High manual overhead, slow report turnaround" },
        { name: "Sylvera", pros: "Established enterprise brand", cons: "Closed data silos, expensive annual lock-in" },
        { name: "EcoVerse (Our Startup)", pros: "Real-time API, smart-contract audit trail, 10x cheaper", cons: "Early-stage enterprise pipeline" }
      ]
    },
    thesis: {
      bull_case: "Climate reporting regulations (CSRD/SEC) are moving from voluntary to legally binding. EcoVerse's developer-first API and verifiable telemetry provide the lowest-friction on-ramp for enterprises. High code quality and live smart-contract backend enable rapid scaling.",
      bear_case: "Enterprise sales cycles can extend to 9+ months. Potential regulatory shifts in voluntary vs compliance carbon markets.",
      key_strengths: [
        "Proprietary telemetry ingestion engine verified in source code",
        "82% gross margins with scalable SaaS + transaction fee model",
        "High code test coverage (88%) and clean modular architecture"
      ],
      risks_and_mitigations: [
        { risk: "Regulatory market fragmentation", mitigation: "Dual architecture supporting both compliance (EU ETS) and voluntary registries", severity: "Medium" },
        { risk: "Sensor hardware dependency", mitigation: "Universal REST API accommodating any third-party IoT or public satellite dataset", severity: "Low" }
      ],
      next_steps: [
        "Review Enterprise POC customer contracts (Schedule call with 2 pilot customers)",
        "Technical audit of smart contract security with external firm",
        "Finalize $1.5M Seed Round allocation ($500k lead ticket recommended)"
      ]
    },
    agent6_metadata: {
      files_discovered: 142,
      files_selected: 15,
      files_read: 15,
      chunks_created: 38,
      code_quality_score: "94/100",
      security_rating: "A",
      test_coverage: "88%"
    }
  },

  finai: {
    id: "finai",
    name: "FinAI Sentinel",
    tagline: "Autonomous Graph Neural Network for Real-Time AML & Cross-Border Fraud Prevention",
    mode: "Mode A + Mode B (Hybrid)",
    category: "FinTech / RegTech / CyberSecurity",
    stage: "Series A",
    website: "https://finaisec.io",
    github_url: "https://github.com/FinAI-Labs/sentinel-core",
    founder: "David K. & Sarah Chen",
    founded_year: "2023",
    location: "New York, NY",
    overall_score: 93,
    verdict: "INVEST",
    verdict_badge: "Top 1% Tier",
    verdict_color: "#10B981",
    confidence: "Very High (97%)",
    scores: {
      product_tech: { score: 96, weight: 25, grade: "A+" },
      market_potential: { score: 94, weight: 20, grade: "A+" },
      team_execution: { score: 92, weight: 20, grade: "A+" },
      financial_viability: { score: 91, weight: 15, grade: "A" },
      traction_growth: { score: 95, weight: 10, grade: "A+" },
      risk_resilience: { score: 88, weight: 10, grade: "A" }
    },
    metrics: {
      mrr: "$142,000",
      arr_runrate: "$1,704,000",
      growth_mom: "+32.1%",
      gross_margin: "87%",
      cac: "$4,200",
      ltv: "$78,000",
      ltv_cac_ratio: "18.5x",
      burn_rate: "$65,000 / mo",
      runway: "22 Months",
      total_raised: "$2.8M (Seed Round)"
    },
    market: {
      tam: "$62.0 Billion (Global Fraud Detection & Anti-Money Laundering)",
      sam: "$21.5 Billion (Tier 2/3 Banks & Neo-banks Core Banking)",
      som: "$3.40 Billion (Fast-growing Crypto & Cross-border Fintechs)",
      cagr: "24.8% (2024-2030)"
    },
    agent6_findings: [
      {
        category: "technology",
        claim: "Distributed Rust core engine with PyTorch Geometric GNN inference service",
        status: "supported",
        evidence: ["Cargo.toml", "crates/sentinel-engine/src/lib.rs", "python/model.py"]
      },
      {
        category: "technical",
        claim: "Sub-5ms transaction latency with Kafka stream consumer and Redis Bloom filter",
        status: "supported",
        evidence: ["crates/stream/src/kafka.rs", "config/redis_cluster.conf"]
      },
      {
        category: "feature",
        claim: "Automated Suspicious Activity Report (SAR) XML generation compatible with FinCEN specs",
        status: "supported",
        evidence: ["services/fincen_reporter.py", "templates/sar_v2.xml"]
      },
      {
        category: "technical",
        claim: "End-to-end encrypted audit logging adhering to SOC2 Type II and GDPR standards",
        status: "supported",
        evidence: ["crates/security/src/crypto.rs", "docs/compliance_matrix.md"]
      },
      {
        category: "problem",
        claim: "Dedicated on-premises deployment container images for sovereign banking clients",
        status: "inferred",
        evidence: ["deploy/helm/sentinel-onprem/", "deploy/docker-compose.enterprise.yml"]
      },
      {
        category: "market",
        claim: "Pre-integrated connector for SWIFT ISO 20022 message feeds",
        status: "unknown",
        evidence: []
      }
    ],
    agent1_findings: {
      problem_statement: "Traditional rule-based fraud detection yields 95%+ false positive rates, draining billions in compliance analyst hours and delaying genuine customer transactions.",
      solution: "FinAI Sentinel utilizes real-time Graph Neural Networks to map entity relationship subgraphs in milliseconds, cutting false positives by 78%.",
      target_customers: ["Neobanks", "Payment Facilitators", "Digital Asset Exchanges", "Regional Banks"],
      competitors: [
        { name: "Feedzai", pros: "Deep enterprise contracts", cons: "Legacy rules hybrid, multi-month onboarding" },
        { name: "Sardine", pros: "Strong US neobank brand", cons: "High cost, limited cross-border graph depth" },
        { name: "FinAI Sentinel", pros: "Sub-5ms latency, zero-code model fine-tuning, Rust speed", cons: "Younger brand vs Feedzai" }
      ]
    },
    thesis: {
      bull_case: "Explosive 32% MoM revenue growth driven by urgent banking demand for real-time instant payment fraud prevention (FedNow, SEPA Instant). The Rust engine delivers 10x throughput at 1/5th cloud cost.",
      bear_case: "High switching cost for traditional tier 1 legacy core banking systems.",
      key_strengths: [
        "Unrivaled sub-5ms performance benchmarked in Rust source code",
        "18.5x LTV:CAC ratio with near-zero logo churn",
        "World-class founding team from MIT & Goldman Sachs Compliance"
      ],
      risks_and_mitigations: [
        { risk: "Regulatory compliance scrutiny", mitigation: "Full explainability layer with SHAP feature attribution", severity: "Low" }
      ],
      next_steps: [
        "Fast-track $5M Series A lead term sheet",
        "Introduce to partner banks in European jurisdiction"
      ]
    },
    agent6_metadata: {
      files_discovered: 312,
      files_selected: 15,
      files_read: 15,
      chunks_created: 54,
      code_quality_score: "98/100",
      security_rating: "A+",
      test_coverage: "95%"
    }
  },

  biosynth: {
    id: "biosynth",
    name: "BioSynth AI",
    tagline: "Generative De Novo Molecular Design for Precision Oncology",
    mode: "Mode A (Startup Pitch & Research)",
    category: "BioTech / Healthcare AI / Drug Discovery",
    stage: "Pre-Seed",
    website: "https://biosynth.health",
    github_url: "https://github.com/biosynth-labs/alpha-dock",
    founder: "Dr. Elena Rostova",
    founded_year: "2024",
    location: "Boston, MA",
    overall_score: 76,
    verdict: "MONITOR",
    verdict_badge: "Promising - Needs De-risking",
    verdict_color: "#F59E0B",
    confidence: "Medium (78%)",
    scores: {
      product_tech: { score: 88, weight: 25, grade: "A-" },
      market_potential: { score: 92, weight: 20, grade: "A+" },
      team_execution: { score: 79, weight: 20, grade: "B+" },
      financial_viability: { score: 62, weight: 15, grade: "C+" },
      traction_growth: { score: 58, weight: 10, grade: "C" },
      risk_resilience: { score: 66, weight: 10, grade: "B-" }
    },
    metrics: {
      mrr: "$0 (Pre-revenue)",
      arr_runrate: "$0",
      growth_mom: "N/A",
      gross_margin: "N/A",
      cac: "N/A",
      ltv: "N/A",
      ltv_cac_ratio: "N/A",
      burn_rate: "$22,000 / mo",
      runway: "9 Months",
      total_raised: "$250,000 (Academic Grant)"
    },
    market: {
      tam: "$180 Billion (Global Oncology Therapeutics & Drug Discovery)",
      sam: "$32 Billion (Early-stage Preclinical Lead Optimization)",
      som: "$2.1 Billion (Targeted Kinase Inhibitors Preclinical Phase)",
      cagr: "18.4% (2024-2030)"
    },
    agent6_findings: [
      {
        category: "technology",
        claim: "Python pipeline combining AlphaFold / ESMFold API connectors and RDKit molecular analysis",
        status: "supported",
        evidence: ["requirements.txt", "scripts/docking_pipeline.py"]
      },
      {
        category: "technical",
        claim: "Diffusion generative model architecture for ligand binding pocket matching",
        status: "supported",
        evidence: ["models/diffusion_dock.py", "notebooks/eval_kinases.ipynb"]
      },
      {
        category: "feature",
        claim: "Interactive 3D molecular structure visualizer using NGLView",
        status: "supported",
        evidence: ["src/viewer.py"]
      },
      {
        category: "problem",
        claim: "Commercial wet-lab validation assay partnership contracts",
        status: "unknown",
        evidence: []
      },
      {
        category: "startup_signals",
        claim: "Codebase is currently primarily research scripts with missing automated unit tests",
        status: "inferred",
        evidence: ["scripts/", "notebooks/"]
      }
    ],
    agent1_findings: {
      problem_statement: "Small-molecule drug discovery takes 5-7 years and $1.2B per candidate to reach clinical trials, with a 90% failure rate in preclinical candidate selection.",
      solution: "BioSynth combines 3D generative diffusion models with physics-based binding simulation to design high-affinity inhibitors in weeks rather than years.",
      target_customers: ["Biopharma R&D Divisions", "Academic Medical Centers", "Contract Research Orgs"],
      competitors: [
        { name: "Recursion Pharma", pros: "Massive automated wet-lab", cons: "High capital burn, closed platform" },
        { name: "Schrodinger", pros: "Industry standard physics modeling", cons: "High software seat cost, slower generative AI adoption" },
        { name: "BioSynth AI", pros: "Lightweight generative algorithms, fast hit discovery", cons: "Needs wet-lab validation" }
      ]
    },
    thesis: {
      bull_case: "Massive potential upside if in silico hits are validated in wet lab. Founder is a top cancer genomics researcher with multiple Nature publications.",
      bear_case: "Pre-revenue, short runway (9 months), and heavy dependency on securing a pharma co-development partnership.",
      key_strengths: [
        "Groundbreaking diffusion modeling approach",
        "Strong academic IP and foundational biology expertise"
      ],
      risks_and_mitigations: [
        { risk: "Preclinical biological validation risk", mitigation: "Structure seed round tranche conditioned on first in vitro binding assays", severity: "High" },
        { risk: "Capital runway exhaustion", mitigation: "Apply for NIH SBIR Phase II non-dilutive grant ($2M)", severity: "Medium" }
      ],
      next_steps: [
        "Request wet-lab binding affinity data (Kd/IC50 results)",
        "Revisit in 3 months once initial in vitro assays are published"
      ]
    },
    agent6_metadata: {
      files_discovered: 64,
      files_selected: 12,
      files_read: 12,
      chunks_created: 18,
      code_quality_score: "72/100",
      security_rating: "B",
      test_coverage: "32%"
    }
  }
};

const AGENT_PIPELINE_STAGES = [
  {
    id: "preprocessing",
    name: "Preprocessing Layer",
    description: "PDF/DOCX/Audio parser, OCR, GitHub repo AST crawler, File classifier & Code Chunker",
    status: "ready",
    badge: "Layer 0"
  },
  {
    id: "agent1",
    name: "Agent 1: Document Analysis",
    description: "LLM + Structured Output parser for Pitch decks, Financial statements, TAM/SAM/SOM & Team",
    status: "active",
    badge: "LLM Agent"
  },
  {
    id: "agent6",
    name: "Agent 6: Project → Startup Code Agent",
    description: "Code LLM + Code RAG: Architecture, Tech stack, Code quality, Scalability & Startup signals",
    status: "active",
    badge: "Code RAG"
  },
  {
    id: "agent2",
    name: "Agent 2: Data Normalization",
    description: "Normalizes, validates, deduplicates, and structures extracted data from Agent 1 & Agent 6",
    status: "active",
    badge: "Bridge Layer"
  },
  {
    id: "agent3",
    name: "Agent 3: Scoring Engine",
    description: "Multi-dimensional scoring: Market, Product, Team, Financial, Traction & Risk models",
    status: "active",
    badge: "Quant Engine"
  },
  {
    id: "agent4",
    name: "Agent 4: Insight & Recommendation",
    description: "Investment Thesis, Bull/Bear scenarios, Risk mitigations, and [INVEST / MONITOR / PASS] decision",
    status: "active",
    badge: "Decision LLM"
  },
  {
    id: "agent5",
    name: "Agent 5: Report Generator",
    description: "Generates exportable Executive PDF, Pitch Deck PPT, Financial Excel, and Shareable Investor Link",
    status: "active",
    badge: "Export Engine"
  }
];
