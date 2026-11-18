/**
 * Agent 5: Report Generator & Deliverables Export Tool
 * Generates institutional-grade Investment Memos (PDF),
 * Partner Presentation Decks (PPT), Financial Models (Excel/CSV),
 * and Shareable Evaluation Links without requiring separate backend microservices.
 */

import { toast } from 'sonner';
import type { AnalysisRecord } from './analysisStorage';

/**
 * 1. PDF / Printable Investment Memo Export
 * Opens a clean, print-optimized institutional diligence memo window (native Vector PDF)
 * and triggers automated file download fallback.
 */
export function exportAnalysisToPDF(analysis?: AnalysisRecord | null): boolean {
  if (!analysis) {
    toast.error('No active analysis selected for export.');
    return false;
  }

  const scores = analysis.scores || {
    market: 75,
    product: 75,
    team: 75,
    financial: 75,
    traction: 75,
    risk: 75,
  };

  const recColor =
    analysis.recommendation === 'INVEST'
      ? '#059669'
      : analysis.recommendation === 'MONITOR'
      ? '#D97706'
      : '#DC2626';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Investment Diligence Memo - ${analysis.title}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      line-height: 1.5;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #5028E0;
      padding-bottom: 14px;
      margin-bottom: 22px;
    }
    .brand {
      font-size: 20pt;
      font-weight: 800;
      color: #5028E0;
      letter-spacing: -0.03em;
    }
    .subbrand {
      font-size: 9pt;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .meta-box {
      text-align: right;
      font-size: 8.5pt;
      color: #64748B;
    }
    .title-section {
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24pt;
      font-weight: 800;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
      color: #0F172A;
    }
    .tagline {
      font-size: 12pt;
      color: #475569;
      margin-bottom: 12px;
    }
    .badges {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .badge {
      font-size: 8.5pt;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-primary { background: #EEECFB; color: #5028E0; border: 1px solid #DCD6FA; }
    .badge-rec {
      background: ${recColor}15;
      color: ${recColor};
      border: 1px solid ${recColor}40;
    }
    .scorecard-banner {
      background: #F8F9FE;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 20px;
      align-items: center;
    }
    .overall-score-box {
      text-align: center;
      border-right: 1px solid #CBD5E1;
      padding-right: 16px;
    }
    .overall-number {
      font-size: 38pt;
      font-weight: 900;
      color: #5028E0;
      line-height: 1;
    }
    .overall-label {
      font-size: 8pt;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .dimensions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .dim-pill {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 8px 10px;
    }
    .dim-name { font-size: 8pt; color: #64748B; text-transform: uppercase; font-weight: 600; }
    .dim-val { font-size: 13pt; font-weight: 800; color: #0F172A; }
    .section-title {
      font-size: 13pt;
      font-weight: 800;
      color: #0F172A;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 10px;
      letter-spacing: -0.01em;
    }
    .thesis-box {
      background: #FAF5FF;
      border-left: 4px solid #7C3AED;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      font-style: normal;
      color: #2E1065;
      font-size: 10.5pt;
      margin-bottom: 18px;
    }
    .insights-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .insight-card {
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 12px 14px;
      background: #FFFFFF;
    }
    .insight-title {
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .insight-list {
      margin: 0;
      padding-left: 18px;
      font-size: 9.5pt;
      color: #334155;
    }
    .insight-list li { margin-bottom: 6px; }
    .tech-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px;
      font-size: 9pt;
      margin-bottom: 16px;
    }
    .tag-pill {
      display: inline-block;
      background: #E2E8F0;
      color: #0F172A;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
      margin: 2px 4px 2px 0;
    }
    .footer {
      margin-top: 36px;
      border-top: 1px solid #E2E8F0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94A3B8;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">VentureLens</div>
      <div class="subbrand">Multi-Agent AI Startup Diligence Platform</div>
    </div>
    <div class="meta-box">
      <div><strong>Report ID:</strong> ${analysis.id}</div>
      <div><strong>Date:</strong> ${new Date(analysis.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div><strong>Methodology:</strong> Multi-Agent AST + Quantitative Ground Truth</div>
    </div>
  </div>

  <div class="title-section">
    <h1>${analysis.title}</h1>
    <div class="tagline">${analysis.tagline || 'Institutional Venture Opportunity Assessment'}</div>
    <div class="badges">
      <span class="badge badge-primary">${analysis.industry || 'Technology'}</span>
      <span class="badge badge-primary">${analysis.stage || 'Seed / Project'}</span>
      <span class="badge badge-rec">Recommendation: ${analysis.recommendation || 'MONITOR'}</span>
      <span class="badge badge-primary">Confidence: ${analysis.confidence || 'Moderate'}</span>
    </div>
  </div>

  <div class="scorecard-banner">
    <div class="overall-score-box">
      <div class="overall-number">${analysis.overallScore || 75}</div>
      <div class="overall-label">Venture Composite Score</div>
    </div>
    <div class="dimensions-grid">
      <div class="dim-pill">
        <div class="dim-name">Market (20%)</div>
        <div class="dim-val">${scores.market}/100</div>
      </div>
      <div class="dim-pill">
        <div class="dim-name">Product (20%)</div>
        <div class="dim-val">${scores.product}/100</div>
      </div>
      <div class="dim-pill">
        <div class="dim-name">Team (20%)</div>
        <div class="dim-val">${scores.team}/100</div>
      </div>
      <div class="dim-pill">
        <div class="dim-name">Financial (15%)</div>
        <div class="dim-val">${scores.financial}/100</div>
      </div>
      <div class="dim-pill">
        <div class="dim-name">Traction (15%)</div>
        <div class="dim-val">${scores.traction}/100</div>
      </div>
      <div class="dim-pill">
        <div class="dim-name">Risk Resilience (10%)</div>
        <div class="dim-val">${scores.risk}/100</div>
      </div>
    </div>
  </div>

  <div class="section-title">1. Executive Investment Thesis</div>
  <div class="thesis-box">
    ${analysis.thesis || 'Technical diligence completed across primary documents and repository architecture.'}
  </div>

  <div class="section-title">2. Key Diligence Findings</div>
  <div class="insights-grid">
    <div class="insight-card">
      <div class="insight-title" style="color: #059669;">Primary Strengths & Catalysts</div>
      <ul class="insight-list">
        ${(analysis.keyInsights?.strengths || ['Validated market opportunity', 'Technical founder present'])
          .map((s) => `<li>${s}</li>`)
          .join('')}
      </ul>
    </div>
    <div class="insight-card">
      <div class="insight-title" style="color: #DC2626;">Key Risks & Concerns</div>
      <ul class="insight-list">
        ${(analysis.keyInsights?.risks || ['Execution cadence and market adoption velocity'])
          .map((r) => `<li>${r}</li>`)
          .join('')}
      </ul>
    </div>
  </div>

  <div class="insights-grid">
    <div class="insight-card">
      <div class="insight-title" style="color: #2563EB;">Growth Opportunities</div>
      <ul class="insight-list">
        ${(analysis.keyInsights?.opportunities || ['Enterprise expansion', 'Self-serve developer tier'])
          .map((o) => `<li>${o}</li>`)
          .join('')}
      </ul>
    </div>
    <div class="insight-card">
      <div class="insight-title" style="color: #7C3AED;">Actionable Next Steps</div>
      <ul class="insight-list">
        ${(analysis.keyInsights?.nextSteps || ['Conduct customer cohort retention review'])
          .map((n) => `<li>${n}</li>`)
          .join('')}
      </ul>
    </div>
  </div>

  ${analysis.codeDetails ? `
  <div class="section-title">3. Codebase & AST Diligence (Agent 6)</div>
  <div class="tech-box">
    <p style="margin: 0 0 6px 0;"><strong>Repository:</strong> ${analysis.codeDetails.githubUrl || analysis.website || 'N/A'}</p>
    <p style="margin: 0 0 6px 0;"><strong>Files Audited:</strong> ${analysis.codeDetails.filesRead || 0} read (${analysis.codeDetails.filesDiscovered || 0} discovered)</p>
    <div style="margin-top: 6px;">
      <strong>Detected Tech Stack:</strong><br/>
      ${(analysis.codeDetails.techStack || ['Polyglot Software']).map((t) => `<span class="tag-pill">${t}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${analysis.dueDiligenceQuestions?.length ? `
  <div class="section-title">4. Investment Committee Due Diligence Questions</div>
  <div style="margin-bottom: 20px;">
    ${analysis.dueDiligenceQuestions.slice(0, 3).map((q, idx) => `
      <div style="margin-bottom: 10px; padding: 10px 12px; background: #F8F9FE; border-left: 3px solid #5028E0; border-radius: 4px;">
        <div style="font-size: 9.5pt; font-weight: 700; color: #1E1B2E;">Q${idx + 1}: ${q.question}</div>
        <div style="font-size: 8.5pt; color: #64748B; margin-top: 2px;"><strong>Why it matters:</strong> ${q.whyItMatters}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <div>Generated autonomously by VentureLens AI Diligence Suite (Agent 1 - 6 Pipeline)</div>
    <div>Confidential • For Institutional Investment Diligence Only</div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
  `;

  // 1. Open in printable window for Instant Vector PDF Save
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      toast.success('Generated PDF Investment Memo! Check the print dialog to save as PDF.');
      return true;
    }
  } catch (_) {}

  // 2. Direct HTML file download fallback if popup is blocked
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${analysis.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Investment_Memo.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success('Downloaded Investment Memo document!');
  return true;
}

/**
 * 2. PPT / Presentation Slide Deck Export
 * Generates an executive 6-slide presentation deck formatted for Investment Committee reviews.
 */
export function exportAnalysisToPPT(analysis?: AnalysisRecord | null): boolean {
  if (!analysis) {
    toast.error('No active analysis selected for export.');
    return false;
  }

  const scores = analysis.scores || {
    market: 75,
    product: 75,
    team: 75,
    financial: 75,
    traction: 75,
    risk: 75,
  };

  const slidesHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${analysis.title} - Investment Committee Deck (VentureLens)</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0F172A;
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
    }
    .slide {
      width: 960px;
      height: 540px;
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .slide-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: #5028E025;
      border: 1px solid #5028E060;
      color: #A78BFA;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    h2 { font-size: 28px; margin: 10px 0; color: #FFFFFF; }
    h3 { font-size: 20px; margin: 0 0 10px 0; color: #E2E8F0; }
    p { font-size: 15px; color: #94A3B8; line-height: 1.5; }
    .footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748B;
      border-top: 1px solid #334155;
      padding-top: 12px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    .card {
      background: #0F172A;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
    }
    .big-num { font-size: 32px; font-weight: 800; color: #38BDF8; margin-top: 6px; }
    @media print {
      body { background: transparent; padding: 0; gap: 0; }
      .slide { page-break-after: always; box-shadow: none; width: 100vw; height: 100vh; border-radius: 0; }
    }
  </style>
</head>
<body>
  <!-- SLIDE 1: COVER -->
  <div class="slide">
    <div>
      <span class="slide-badge">VentureLens • AI Diligence Memo</span>
      <h1 style="font-size: 44px; margin-top: 20px; margin-bottom: 8px;">${analysis.title}</h1>
      <p style="font-size: 20px; color: #38BDF8;">${analysis.tagline || 'Institutional Opportunity Evaluation'}</p>
    </div>
    <div class="grid-3">
      <div class="card">
        <div style="font-size: 12px; color: #94A3B8;">INDUSTRY</div>
        <div style="font-size: 16px; font-weight: 700; color: #FFF; margin-top: 4px;">${analysis.industry || 'Technology'}</div>
      </div>
      <div class="card">
        <div style="font-size: 12px; color: #94A3B8;">STAGE</div>
        <div style="font-size: 16px; font-weight: 700; color: #FFF; margin-top: 4px;">${analysis.stage || 'Seed'}</div>
      </div>
      <div class="card">
        <div style="font-size: 12px; color: #94A3B8;">RECOMMENDATION</div>
        <div style="font-size: 16px; font-weight: 700; color: #10B981; margin-top: 4px;">${analysis.recommendation || 'MONITOR'}</div>
      </div>
    </div>
    <div class="footer">
      <span>VentureLens AI Evaluation Platform</span>
      <span>Slide 1 of 4</span>
    </div>
  </div>

  <!-- SLIDE 2: SCORECARD -->
  <div class="slide">
    <div>
      <span class="slide-badge">Multidimensional Diligence Scorecard</span>
      <h2>Composite Venture Score: ${analysis.overallScore || 75}/100</h2>
      <p>Calibrated across 6 objective diligence dimensions with AST code and deck grounding.</p>
    </div>
    <div class="grid-3" style="grid-template-columns: repeat(3, 1fr);">
      <div class="card">
        <div style="color: #94A3B8; font-size: 12px;">MARKET (20%)</div>
        <div class="big-num">${scores.market}</div>
      </div>
      <div class="card">
        <div style="color: #94A3B8; font-size: 12px;">PRODUCT (20%)</div>
        <div class="big-num">${scores.product}</div>
      </div>
      <div class="card">
        <div style="color: #94A3B8; font-size: 12px;">TEAM (20%)</div>
        <div class="big-num">${scores.team}</div>
      </div>
      <div class="card">
        <div style="color: #94A3B8; font-size: 12px;">FINANCIAL (15%)</div>
        <div class="big-num">${scores.financial}</div>
      </div>
      <div class="card">
        <div style="color: #94A3B8; font-size: 12px;">TRACTION (15%)</div>
        <div class="big-num">${scores.traction}</div>
      </div>
      <div class="card">
        <div style="color: #94A3B8; font-size: 12px;">RISK RESILIENCE (10%)</div>
        <div class="big-num">${scores.risk}</div>
      </div>
    </div>
    <div class="footer">
      <span>Agent 3 Calibrated Scoring Engine</span>
      <span>Slide 2 of 4</span>
    </div>
  </div>

  <!-- SLIDE 3: THESIS & CATALYSTS -->
  <div class="slide">
    <div>
      <span class="slide-badge">Strategic Thesis & Value Drivers</span>
      <h2>Investment Thesis</h2>
      <div style="background: #0F172A; border-left: 4px solid #8B5CF6; padding: 14px 18px; border-radius: 6px; font-size: 15px; color: #DDD6FE; margin: 10px 0;">
        ${analysis.thesis || 'Technical execution validated with structured architectural separation.'}
      </div>
    </div>
    <div class="grid-3" style="grid-template-columns: 1fr 1fr;">
      <div class="card">
        <div style="color: #10B981; font-weight: 700; margin-bottom: 8px;">TOP STRENGTHS</div>
        <ul style="font-size: 13px; color: #CBD5E1; padding-left: 18px; margin: 0;">
          ${(analysis.keyInsights?.strengths || ['High code maturity', 'Active market pull']).slice(0, 3).map((s) => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <div style="color: #F87171; font-weight: 700; margin-bottom: 8px;">CRITICAL RISKS</div>
        <ul style="font-size: 13px; color: #CBD5E1; padding-left: 18px; margin: 0;">
          ${(analysis.keyInsights?.risks || ['Runway sensitivity', 'Enterprise cycle length']).slice(0, 3).map((r) => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
        </ul>
      </div>
    </div>
    <div class="footer">
      <span>Agent 4 Strategic Synthesis</span>
      <span>Slide 3 of 4</span>
    </div>
  </div>

  <!-- SLIDE 4: DUE DILIGENCE ROADMAP -->
  <div class="slide">
    <div>
      <span class="slide-badge">Partner Due Diligence Roadmap</span>
      <h2>Next Steps & IC Action Items</h2>
    </div>
    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
      ${(analysis.dueDiligenceQuestions || [
        { question: 'What is trailing cohort retention and CAC payback?', whyItMatters: 'Guarantees capital efficiency at scale.' },
        { question: 'What proprietary moat prevents cloud replication?', whyItMatters: 'Protects enterprise margins.' },
      ]).slice(0, 3).map((q, idx) => `
        <div class="card" style="padding: 12px 16px;">
          <div style="font-weight: 700; color: #FFF; font-size: 14px;">Q${idx + 1}: ${q.question}</div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 3px;">Validation: ${q.whyItMatters}</div>
        </div>
      `).join('')}
    </div>
    <div class="footer">
      <span>VentureLens Investment Committee Pack</span>
      <span>Slide 4 of 4</span>
    </div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([slidesHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${analysis.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Presentation_Deck.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success('Downloaded Presentation Deck (opens as interactive slides in any browser or PowerPoint)!');
  return true;
}

/**
 * 3. Excel / CSV Model Export
 * Downloads a structured CSV financial and diligence scorecard ready for Excel or Google Sheets.
 */
export function exportAnalysisToExcel(analysis?: AnalysisRecord | null): boolean {
  if (!analysis) {
    toast.error('No active analysis selected for export.');
    return false;
  }

  const scores = analysis.scores || {
    market: 75,
    product: 75,
    team: 75,
    financial: 75,
    traction: 75,
    risk: 75,
  };

  const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const rows: string[][] = [
    ['VENTURELENS INSTITUTIONAL DUE DILIGENCE MODEL'],
    ['Report ID', analysis.id],
    ['Startup / Project Name', analysis.title],
    ['Tagline', analysis.tagline || ''],
    ['Primary Industry', analysis.industry || 'Technology'],
    ['Venture Stage', analysis.stage || 'Seed'],
    ['Overall Score (100)', String(analysis.overallScore || 75)],
    ['Recommendation', analysis.recommendation || 'MONITOR'],
    ['Confidence Level', analysis.confidence || 'Moderate'],
    ['Website / Repository', analysis.website || ''],
    ['Evaluation Date', new Date().toISOString()],
    [],
    ['--- DIMENSION SCORECARD (AGENT 3) ---'],
    ['Dimension Name', 'Weight', 'Score (/100)', 'Status Rating'],
    ['Market', '20%', String(scores.market), scores.market >= 80 ? 'Exceptional' : 'Standard'],
    ['Product', '20%', String(scores.product), scores.product >= 80 ? 'Exceptional' : 'Standard'],
    ['Team', '20%', String(scores.team), scores.team >= 80 ? 'Exceptional' : 'Standard'],
    ['Financial', '15%', String(scores.financial), scores.financial >= 75 ? 'Healthy' : 'Standard'],
    ['Traction', '15%', String(scores.traction), scores.traction >= 75 ? 'Strong' : 'Moderate'],
    ['Risk Resilience', '10%', String(scores.risk), scores.risk >= 80 ? 'Low Risk' : 'Standard'],
    [],
    ['--- EXECUTIVE THESIS ---'],
    ['Investment Thesis', analysis.thesis || ''],
    [],
    ['--- STRATEGIC INSIGHTS ---'],
    ['Category', 'Insight Detail'],
    ...(analysis.keyInsights?.strengths || []).map((s) => ['Strength', s]),
    ...(analysis.keyInsights?.risks || []).map((r) => ['Risk Concern', r]),
    ...(analysis.keyInsights?.opportunities || []).map((o) => ['Growth Opportunity', o]),
    ...(analysis.keyInsights?.nextSteps || []).map((n) => ['Next Step', n]),
    [],
    ['--- CODEBASE DILIGENCE (AGENT 6) ---'],
    ['Files Discovered', String(analysis.codeDetails?.filesDiscovered || 0)],
    ['Files Read / Audited', String(analysis.codeDetails?.filesRead || 0)],
    ['Tech Stack Tokens', (analysis.codeDetails?.techStack || []).join('; ')],
    [],
    ['--- DUE DILIGENCE QUESTIONS ---'],
    ['Question', 'Category', 'Why It Matters', 'Suggested Validation'],
    ...(analysis.dueDiligenceQuestions || []).map((q) => [
      q.question,
      q.category,
      q.whyItMatters,
      q.suggestedValidation || '',
    ]),
  ];

  const csvString = '\uFEFF' + rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${analysis.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Financial_Diligence_Model.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success('Exported Excel / CSV Financial Model!');
  return true;
}

/**
 * 4. Share Link Generation
 * Generates a persistent permalink to this evaluation and copies it to clipboard.
 */
export function generateShareLink(analysisId?: string, title?: string): string {
  if (!analysisId) {
    toast.error('No active analysis ID found to generate share link.');
    return '';
  }

  const origin = window.location.origin;
  const shareUrl = `${origin}/#dashboard?id=${encodeURIComponent(analysisId)}&shared=true`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast.success(`Share link for "${title || 'Evaluation'}" copied to clipboard!`);
      })
      .catch(() => {
        toast.info(`Share link: ${shareUrl}`);
      });
  } else {
    toast.info(`Share link: ${shareUrl}`);
  }

  return shareUrl;
}
