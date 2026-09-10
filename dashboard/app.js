/**
 * AI STARTUP EVALUATION PLATFORM - DASHBOARD INTERACTIVITY
 */

let currentStartupId = "ecoverse";
let currentFindingFilter = "all";
let isSimulating = false;

document.addEventListener("DOMContentLoaded", () => {
  initStartupSelector();
  initTabNavigation();
  initFindingFilters();
  initModalEvents();
  renderCurrentStartup();
  initStorageBridgeViewer();
});

// ============================================================
// STARTUP SELECTION & RENDERING
// ============================================================
function initStartupSelector() {
  const dropdown = document.getElementById("startupSelectDropdown");
  if (!dropdown) return;

  dropdown.addEventListener("change", (e) => {
    currentStartupId = e.target.value;
    renderCurrentStartup();
  });
}

function renderCurrentStartup() {
  const startup = STARTUP_DATABASE[currentStartupId];
  if (!startup) return;

  // 1. Startup Hero Info
  document.getElementById("startupName").textContent = startup.name;
  document.getElementById("startupTagline").textContent = startup.tagline;
  document.getElementById("chipMode").textContent = startup.mode;
  document.getElementById("chipCategory").textContent = startup.category;
  document.getElementById("chipStage").textContent = startup.stage;
  document.getElementById("chipFounder").textContent = startup.founder;
  document.getElementById("chipLocation").textContent = startup.location;

  // 2. Financial & Growth Metrics Strip
  document.getElementById("valMrr").textContent = startup.metrics.mrr;
  document.getElementById("valArr").textContent = startup.metrics.arr_runrate;
  document.getElementById("valGrowth").textContent = startup.metrics.growth_mom;
  document.getElementById("valRunway").textContent = startup.metrics.runway;

  // 3. Overall Score Gauge & Verdict
  const score = startup.overall_score;
  document.getElementById("overallScoreNumber").textContent = score;
  document.getElementById("verdictPill").textContent = startup.verdict;
  document.getElementById("verdictPill").style.color = startup.verdict_color;
  document.getElementById("verdictBadge").textContent = startup.verdict_badge;
  document.getElementById("verdictConfidence").textContent = `Confidence: ${startup.confidence}`;

  // Calculate SVG stroke offset (Circumference ~ 377)
  const maxDash = 377;
  const offset = maxDash - (score / 100) * maxDash;
  const gaugeFill = document.getElementById("radialGaugeFill");
  if (gaugeFill) {
    gaugeFill.style.strokeDashoffset = offset;
  }

  // 4. Multi-dimensional Score Breakdown Bars
  renderScoreBreakdown(startup.scores);

  // 5. Agent 6 Technical Findings
  renderAgent6Findings(startup.agent6_findings);

  // 6. Agent 1 Market & Pitch Findings
  renderAgent1Content(startup);

  // 7. Investment Thesis & Risks
  renderThesisContent(startup.thesis);

  // 8. Normalized Data Bridge (Agent 2)
  renderNormalizedHandoff(startup);
}

// ============================================================
// SCORE BARS RENDERING
// ============================================================
function renderScoreBreakdown(scores) {
  const container = document.getElementById("scoreBarsGrid");
  if (!container) return;

  const scoreDefs = [
    { key: "product_tech", label: "Product & Technical Architecture", icon: "💻" },
    { key: "market_potential", label: "Market Opportunity & TAM", icon: "🌍" },
    { key: "team_execution", label: "Team Pedigree & Execution", icon: "👥" },
    { key: "financial_viability", label: "Financial Viability & Unit Econ", icon: "📈" },
    { key: "traction_growth", label: "Customer Traction & Velocity", icon: "⚡" },
    { key: "risk_resilience", label: "Risk Resilience & Defensibility", icon: "🛡️" }
  ];

  container.innerHTML = scoreDefs.map(def => {
    const item = scores[def.key];
    return `
      <div class="score-bar-item">
        <div class="score-bar-header">
          <span class="score-bar-name">${def.icon} ${def.label}</span>
          <span class="score-bar-grade">${item.grade} (${item.score}/100)</span>
        </div>
        <div class="score-progress-track">
          <div class="score-progress-fill" style="width: ${item.score}%"></div>
        </div>
        <div class="score-bar-footer">
          <span>Model Weight: ${item.weight}%</span>
          <span>Quant Tier: ${item.score >= 90 ? 'Top 5%' : item.score >= 80 ? 'Above Benchmark' : 'Standard'}</span>
        </div>
      </div>
    `;
  }).join("");
}

// ============================================================
// AGENT 6 FINDINGS RENDERING & FILTERING
// ============================================================
function initFindingFilters() {
  const pills = document.querySelectorAll(".filter-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentFindingFilter = pill.getAttribute("data-filter");
      const startup = STARTUP_DATABASE[currentStartupId];
      if (startup) {
        renderAgent6Findings(startup.agent6_findings);
      }
    });
  });
}

function renderAgent6Findings(findings) {
  const container = document.getElementById("findingsListContainer");
  if (!container) return;

  const filtered = findings.filter(f => {
    if (currentFindingFilter === "all") return true;
    return f.status === currentFindingFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-dim);">No claims found for status "${currentFindingFilter}".</div>`;
    return;
  }

  container.innerHTML = filtered.map(finding => {
    const statusClass = `status-${finding.status}`;
    const evidenceBadges = (finding.evidence && finding.evidence.length > 0)
      ? finding.evidence.map(ev => `<span class="evidence-file-badge">📄 ${ev}</span>`).join("")
      : `<span style="color: var(--text-dim); font-style: italic;">No direct codebase artifact found (Investigation Needed)</span>`;

    return `
      <div class="finding-card">
        <div class="finding-header">
          <span class="finding-category-tag">[${finding.category}]</span>
          <span class="finding-status-badge ${statusClass}">${finding.status}</span>
        </div>
        <div class="finding-claim">${finding.claim}</div>
        <div class="finding-evidence">
          <span style="font-weight: 600; color: var(--text-muted);">Evidence Sources:</span>
          ${evidenceBadges}
        </div>
      </div>
    `;
  }).join("");
}

// ============================================================
// AGENT 1 BUSINESS & MARKET TAB
// ============================================================
function renderAgent1Content(startup) {
  const pElem = document.getElementById("agent1Problem");
  const sElem = document.getElementById("agent1Solution");
  const tamElem = document.getElementById("agent1Tam");
  const samElem = document.getElementById("agent1Sam");
  const somElem = document.getElementById("agent1Som");
  const compElem = document.getElementById("agent1Competitors");

  if (pElem) pElem.textContent = startup.agent1_findings.problem_statement;
  if (sElem) sElem.textContent = startup.agent1_findings.solution;
  if (tamElem) tamElem.textContent = startup.market.tam;
  if (samElem) samElem.textContent = startup.market.sam;
  if (somElem) somElem.textContent = startup.market.som;

  if (compElem) {
    compElem.innerHTML = startup.agent1_findings.competitors.map(c => `
      <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle);">
        <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">${c.name}</div>
        <div style="font-size: 0.78rem; color: var(--emerald); margin-bottom: 2px;">✓ Pros: ${c.pros}</div>
        <div style="font-size: 0.78rem; color: var(--rose);">✗ Cons: ${c.cons}</div>
      </div>
    `).join("");
  }
}

// ============================================================
// AGENT 4 THESIS & RISKS
// ============================================================
function renderThesisContent(thesis) {
  const bullElem = document.getElementById("thesisBull");
  const bearElem = document.getElementById("thesisBear");
  const strengthsElem = document.getElementById("thesisStrengths");
  const risksElem = document.getElementById("thesisRisks");
  const stepsElem = document.getElementById("thesisSteps");

  if (bullElem) bullElem.textContent = thesis.bull_case;
  if (bearElem) bearElem.textContent = thesis.bear_case;

  if (strengthsElem) {
    strengthsElem.innerHTML = thesis.key_strengths.map(s => `
      <li class="bullet-item">
        <span style="color: var(--emerald); font-weight: bold;">✓</span>
        <span>${s}</span>
      </li>
    `).join("");
  }

  if (risksElem) {
    risksElem.innerHTML = thesis.risks_and_mitigations.map(r => `
      <li class="bullet-item" style="flex-direction: column; background: rgba(15, 23, 42, 0.5); padding: 10px; border-radius: 6px; border-left: 3px solid var(--amber);">
        <div style="font-weight: 600; color: #fbbf24;">⚠️ ${r.risk} <span style="font-size: 0.7rem; padding: 2px 6px; background: rgba(245, 158, 11, 0.2); border-radius: 4px; margin-left: 6px;">${r.severity} Severity</span></div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;"><strong>Mitigation:</strong> ${r.mitigation}</div>
      </li>
    `).join("");
  }

  if (stepsElem) {
    stepsElem.innerHTML = thesis.next_steps.map(step => `
      <li class="bullet-item">
        <span style="color: var(--primary); font-weight: bold;">➔</span>
        <span>${step}</span>
      </li>
    `).join("");
  }
}

// ============================================================
// AGENT 6 ➔ AGENT 2 NORMALIZED DATA BRIDGE
// ============================================================
function renderNormalizedHandoff(startup) {
  const codeElem = document.getElementById("agent2JsonHandoff");
  if (!codeElem) return;

  const handoffPayload = {
    version: "1.0",
    run_id: `${startup.id}_eval_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
    source_agent: "agent_6_project_code",
    target_agent: "agent_2_data_normalization",
    status: "READY_FOR_AGENT_2",
    repository: {
      name: startup.name,
      github_url: startup.github_url,
      stage: startup.stage
    },
    findings_summary: {
      total: startup.agent6_findings.length,
      supported: startup.agent6_findings.filter(f => f.status === "supported").length,
      inferred: startup.agent6_findings.filter(f => f.status === "inferred").length,
      unknown: startup.agent6_findings.filter(f => f.status === "unknown").length
    },
    findings: startup.agent6_findings,
    code_metadata: startup.agent6_metadata
  };

  codeElem.textContent = JSON.stringify(handoffPayload, null, 2);
}

// ============================================================
// WORKSPACE TAB NAVIGATION
// ============================================================
function initTabNavigation() {
  const tabs = document.querySelectorAll(".workspace-tab");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("data-tab");

      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });
}

// ============================================================
// LIVE AGENT PIPELINE SIMULATOR
// ============================================================
window.runPipelineSimulation = function() {
  if (isSimulating) return;
  isSimulating = true;

  const nodes = document.querySelectorAll(".pipeline-node");
  const logBadge = document.getElementById("pipelineLiveLog");
  const triggerBtn = document.getElementById("runSimulationBtn");

  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.textContent = "⏳ Running Agents...";
  }

  let step = 0;
  const steps = [
    { nodeIdx: 0, text: "Layer 0: Ingesting repository files, AST chunking & OCR parsing..." },
    { nodeIdx: 1, text: "Agent 1: Extracting business metrics, TAM/SAM/SOM & founder background..." },
    { nodeIdx: 2, text: "Agent 6: Deep-scanning source code, tech stack & validating evidence..." },
    { nodeIdx: 3, text: "Agent 2: Normalizing schemas & storing Agent 6 technical payload..." },
    { nodeIdx: 4, text: "Agent 3: Computing 6-dimensional quant valuation scores..." },
    { nodeIdx: 5, text: "Agent 4: Generating investment thesis, risks & [INVEST] verdict..." },
    { nodeIdx: 6, text: "Agent 5: Compiling executive report PDF, PPT & financial model..." }
  ];

  function runNextStep() {
    if (step < steps.length) {
      nodes.forEach((n, idx) => {
        if (idx === steps[step].nodeIdx) {
          n.classList.add("active");
          n.style.borderColor = "var(--primary)";
        } else {
          n.classList.remove("active");
        }
      });

      if (logBadge) {
        logBadge.textContent = steps[step].text;
        logBadge.style.color = "#a5b4fc";
      }

      step++;
      setTimeout(runNextStep, 900);
    } else {
      // Completed
      nodes.forEach(n => n.classList.remove("active"));
      if (logBadge) {
        logBadge.textContent = "✓ Multi-Agent Pipeline Execution Complete. Data Synced.";
        logBadge.style.color = "var(--emerald)";
      }
      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.textContent = "⚡ Simulate Agent Run";
      }
      isSimulating = false;
      renderCurrentStartup();
    }
  }

  runNextStep();
};

// ============================================================
// STORAGE BRIDGE & LIVE BACKEND POLLING
// ============================================================
function initStorageBridgeViewer() {
  const syncBtn = document.getElementById("syncBackendBtn");
  if (!syncBtn) return;

  syncBtn.addEventListener("click", async () => {
    syncBtn.textContent = "🔄 Checking Backend...";
    try {
      const res = await fetch("http://localhost:8000/agent6/github/handoff/latest");
      if (res.ok) {
        const data = await res.json();
        const codeElem = document.getElementById("agent2JsonHandoff");
        if (codeElem) codeElem.textContent = JSON.stringify(data, null, 2);
        showNotification("✓ Live Agent 6 output retrieved from Backend API!", "success");
      } else {
        showNotification("ℹ️ Backend returned 404. Using local cached Agent 6 storage payload.", "info");
      }
    } catch (err) {
      showNotification("ℹ️ Backend server not running at :8000. Displaying mock storage artifact.", "info");
    } finally {
      syncBtn.textContent = "⚡ Pull Live Backend Stored Output";
    }
  });
}

// ============================================================
// MODAL & REPORT DOWNLOAD TRIGGERS
// ============================================================
function initModalEvents() {
  const modal = document.getElementById("newAnalysisModal");
  const openBtn = document.getElementById("openNewAnalysisBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const modeCards = document.querySelectorAll(".mode-card");

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => modal.classList.add("open"));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => modal.classList.remove("open"));
  }

  modeCards.forEach(card => {
    card.addEventListener("click", () => {
      modeCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });
}

window.startNewEvaluation = function() {
  const modal = document.getElementById("newAnalysisModal");
  if (modal) modal.classList.remove("open");
  showNotification("🚀 Analysis job queued! Multi-agent pipeline is parsing the inputs.", "success");
  window.runPipelineSimulation();
};

window.triggerReportDownload = function(format) {
  showNotification(`📑 Generating ${format.toUpperCase()} report with full Agent 1-6 insights... Ready!`, "success");
};

function showNotification(msg, type = "info") {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "10px";
  toast.style.background = type === "success" ? "#065f46" : "#1e293b";
  toast.style.color = "#ffffff";
  toast.style.fontSize = "0.85rem";
  toast.style.fontWeight = "600";
  toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
  toast.style.border = "1px solid rgba(255,255,255,0.15)";
  toast.style.zIndex = "999";
  toast.style.transition = "all 0.3s ease";
  toast.textContent = msg;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
