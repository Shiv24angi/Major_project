/**
 * AI Diligence Chat Service
 * Provides real-time interactive Q&A grounded strictly in the pitch deck PDF
 * and verified document intelligence uploaded for the active venture session.
 */

import type { AnalysisRecord, ChatMessage } from './analysisStorage';
import type { Agent1EvaluationRecord } from './supabaseService';

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';

const FALLBACK_MODELS = [
  (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

export interface SessionDocumentInfo {
  name: string;
  storageUrl?: string;
  size?: string;
  isPdf: boolean;
}

export interface QueryVentureAiParams {
  userMessage: string;
  activeAnalysis: AnalysisRecord;
  agent1Eval?: Agent1EvaluationRecord | null;
  chatHistory?: ChatMessage[];
}

// In-memory cache for downloaded PDF base64 strings so each file is downloaded once per browser session
const sessionPdfBase64Cache = new Map<string, string>();

/**
 * Identify the primary pitch deck document uploaded for this startup session
 */
export function getSessionPitchDeck(
  analysis: AnalysisRecord,
  evalRecord?: Agent1EvaluationRecord | null
): SessionDocumentInfo | null {
  const docs = analysis.documents || [];

  // 1. Look in activeAnalysis.documents for a PDF pitch deck
  const primaryPdf = docs.find(
    (d) =>
      d.storageUrl &&
      (d.name.toLowerCase().endsWith('.pdf') ||
        (d.type && d.type.toLowerCase().includes('pitch')))
  );
  if (primaryPdf && primaryPdf.storageUrl) {
    return {
      name: primaryPdf.name,
      storageUrl: primaryPdf.storageUrl,
      size: primaryPdf.size,
      isPdf: primaryPdf.name.toLowerCase().endsWith('.pdf'),
    };
  }

  // 2. Look in evalRecord.uploaded_files
  const uploaded = evalRecord?.uploaded_files || [];
  for (const f of uploaded) {
    const sUrl = (f as any).storage_url || (f as any).storageUrl;
    if (sUrl) {
      const name = f.original_filename || 'pitchdeck.pdf';
      return {
        name,
        storageUrl: sUrl,
        size: '1.5 MB',
        isPdf: name.toLowerCase().endsWith('.pdf') || f.file_type === '.pdf',
      };
    }
  }

  // 3. Any document with a storage URL
  if (docs.length > 0 && docs[0].storageUrl) {
    return {
      name: docs[0].name,
      storageUrl: docs[0].storageUrl,
      size: docs[0].size,
      isPdf: docs[0].name.toLowerCase().endsWith('.pdf'),
    };
  }

  // 4. If documents exist without storageUrl yet
  if (docs.length > 0) {
    return {
      name: docs[0].name,
      size: docs[0].size,
      isPdf: docs[0].name.toLowerCase().endsWith('.pdf'),
    };
  }

  return null;
}

/**
 * Safely convert ArrayBuffer to Base64 in chunks to prevent call-stack overflow on large PDFs
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Fetch and cache PDF bytes as Base64 for multimodal Gemini ingestion
 */
async function fetchPdfAsBase64(storageUrl: string): Promise<string | null> {
  if (sessionPdfBase64Cache.has(storageUrl)) {
    return sessionPdfBase64Cache.get(storageUrl)!;
  }

  try {
    const res = await fetch(storageUrl);
    if (!res.ok) {
      console.warn(`[aiChatService] Failed to fetch PDF from ${storageUrl}: status ${res.status}`);
      return null;
    }
    const buffer = await res.arrayBuffer();

    // Limit inlining to 20MB for Gemini payload constraints
    if (buffer.byteLength > 20 * 1024 * 1024) {
      console.warn(`[aiChatService] PDF exceeds 20MB (${buffer.byteLength} bytes). Falling back to dossier.`);
      return null;
    }

    const base64 = arrayBufferToBase64(buffer);
    sessionPdfBase64Cache.set(storageUrl, base64);
    return base64;
  } catch (err) {
    console.warn('[aiChatService] Error downloading PDF for Gemini:', err);
    return null;
  }
}

/**
 * Construct a grounded diligence prompt strictly scoped to the active session and its PDF document
 */
function buildSessionDiligencePrompt(
  query: string,
  analysis: AnalysisRecord,
  evalRecord?: Agent1EvaluationRecord | null,
  history?: ChatMessage[],
  docInfo?: SessionDocumentInfo | null
): string {
  const merged = evalRecord?.merged_analysis || {};
  const companyTitle = merged.startup_name || analysis.title || 'Venture';

  // Format founders
  let foundersText = 'Not explicitly listed';
  if (merged.founders && Array.isArray(merged.founders) && merged.founders.length > 0) {
    foundersText = merged.founders
      .map((f: any) =>
        typeof f === 'string'
          ? f
          : `${f.name || 'Founder'} (${f.role || 'Executive'}${f.background ? ` - ${f.background}` : ''})`
      )
      .join(', ');
  }

  // Format financials
  const fin = merged.financials || {};
  const financialsText = [
    fin.revenue ? `Revenue: ${fin.revenue}` : null,
    fin.arr ? `ARR: ${fin.arr}` : null,
    fin.mrr ? `MRR: ${fin.mrr}` : null,
    fin.burn_rate ? `Burn Rate: ${fin.burn_rate}` : null,
    fin.runway ? `Runway: ${fin.runway}` : null,
    fin.growth_rate ? `Growth Rate: ${fin.growth_rate}` : null,
    fin.gross_margin ? `Gross Margin: ${fin.gross_margin}` : null,
    fin.churn ? `Churn: ${fin.churn}` : null,
    fin.cac ? `CAC: ${fin.cac}` : null,
    fin.ltv ? `LTV: ${fin.ltv}` : null,
  ]
    .filter(Boolean)
    .join(' | ') || 'Specific financial figures (e.g. ARR, exact revenue) are not detailed in the available slides.';

  // Format traction & customers
  const tractionText = merged.traction || 'Disclosed in attached deck';
  const customersText = Array.isArray(merged.customers)
    ? merged.customers.join(', ')
    : merged.customers || 'Enterprise and market clients';
  const competitorsText = Array.isArray(merged.competitors)
    ? merged.competitors.join(', ')
    : merged.competitors || 'None noted';

  // Format risks
  const risksList = (merged.risks && merged.risks.length > 0 ? merged.risks : analysis.keyInsights?.risks) || [];
  const risksText = risksList.length > 0 ? risksList.map((r: string, i: number) => `  ${i + 1}. ${r}`).join('\n') : '  None flagged.';

  // Format contradictions
  const contradictions = evalRecord?.contradictions || [];
  const contradictionsText =
    contradictions.length > 0
      ? contradictions
          .map(
            (c: any) =>
              `  - Claim 1 (${c.source_1}): "${c.claim_1}" vs Claim 2 (${c.source_2}): "${c.claim_2}" (${c.explanation || ''})`
          )
          .join('\n')
      : '  No conflicting claims found across documents.';

  // Format recent turns
  const historyText = (history || [])
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'Investor' : 'Analyst'}: ${m.text}`)
    .join('\n');

  if (docInfo && docInfo.isPdf) {
    return `You are the VentureLens AI Due Diligence Partner, an institutional investment analyst.
You are evaluating the venture "${companyTitle}".
Attached to this session is the EXACT pitch deck PDF document: "${docInfo.name}".

================ CRITICAL SESSION ISOLATION & GROUNDING RULES ================
1. You have DIRECT visual & textual access to the attached PDF pitch deck ("${docInfo.name}").
2. Answer the investor's question STRICTLY and EXCLUSIVELY based on this attached PDF for "${companyTitle}".
3. UNDER NO CIRCUMSTANCES should you confuse this with or mention other companies (like Airbnb, EcoVerse, or unrelated companies).
4. Whenever possible, CITE THE SPECIFIC SLIDE OR PAGE NUMBER from the PDF where the information was found (e.g., [Slide 2], [Slide 5: Traction], [Slide 8: Team]).
5. If the investor asks for numbers or information (such as exact ARR, current revenue, churn, or specific valuation) that is NOT disclosed in this pitch deck, EXPLICITLY state:
   "According to the uploaded pitch deck (${docInfo.name}), this information is not disclosed."
   Then mention what related commercial or business model information IS in the deck.
6. Keep your answers direct, factual, professional, and investment-committee ready.
================================================================================

Verified Session Intelligence (Extracted from ${docInfo.name}):
- Company / Startup: ${companyTitle}
- Industry / Sector: ${merged.industry || analysis.industry || 'Technology'}
- Product Description: ${merged.product || analysis.thesis || 'Proprietary platform'}
- Key Traction Highlights: ${tractionText}
- Notable Customers / Partners: ${customersText}
- Known Competitors: ${competitorsText}
- Commercial / Revenue Model: ${merged.business_model || analysis.tagline || 'Subscription SaaS / Enterprise licensing'}
- Financial Disclosures: ${financialsText}
- Founders: ${foundersText}
- Highlighted Risks:
${risksText}
- Known Contradictions:
${contradictionsText}

Recent Chat Context:
${historyText || 'No prior conversation in this session.'}

Investor Question: "${query}"

Provide your factual response grounded in the attached PDF ("${docInfo.name}"):`;
  }

  // Fallback prompt when no PDF document is directly attached
  return `You are the VentureLens AI Due Diligence Partner, an institutional investment analyst.
You are evaluating the venture "${companyTitle}".
There is no direct PDF attached to this session; your answers must be grounded STRICTLY in the verified session dossier below.

================ SESSION DOSSIER FOR ${companyTitle.toUpperCase()} ================
Startup: ${companyTitle} (${analysis.industry || 'Technology'})
Thesis: ${merged.description || analysis.thesis || 'N/A'}
Business Model: ${merged.business_model || 'Subscription SaaS'}
Financial Overview: ${financialsText}
Founding Team: ${foundersText}
Product: ${merged.product || 'N/A'}
Traction: ${tractionText}
Customers: ${customersText}
Competitors: ${competitorsText}
Risks:
${risksText}
Contradictions:
${contradictionsText}
=============================================================================

Rules:
1. Answer strictly for "${companyTitle}". Do not introduce outside companies.
2. If metrics are not in the dossier, state: "The uploaded materials for this session do not disclose this."

Recent Conversation:
${historyText || 'No prior conversation.'}

Investor Question: "${query}"

Provide your factual, concise response:`;
}

/**
 * Direct call to Google Gemini REST API (v1beta generateContent)
 * Supports passing base64 PDF inlineData for multimodal document reasoning
 */
async function callGeminiDirect(
  promptText: string,
  pdfBase64?: string | null
): Promise<string> {
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    if (!model || model.includes('1.5') || model.includes('2.0')) continue; // Skip deprecated versions

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const parts: any[] = [];

      // If PDF bytes are available, attach them as inlineData
      if (pdfBase64) {
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64,
          },
        });
      }

      // Attach prompt text
      parts.push({
        text: promptText,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts,
            },
          ],
          generationConfig: {
            temperature: 0.1, // Strict factual adherence to the document
            maxOutputTokens: 1000,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini Chat] Model ${model} returned ${res.status}:`, errText);
        lastError = new Error(`HTTP ${res.status}: ${errText}`);
        continue;
      }

      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply && reply.trim()) {
        return reply.trim();
      }
    } catch (err) {
      console.warn(`[Gemini Chat] Model ${model} request error:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini model fallbacks failed to respond.');
}

/**
 * Query the AI Due Diligence Assistant in real-time
 * Grounded strictly in the session's uploaded pitch deck PDF
 */
export async function queryVentureAiChat(params: QueryVentureAiParams): Promise<string> {
  // 1. Identify the pitch deck document for this session
  const docInfo = getSessionPitchDeck(params.activeAnalysis, params.agent1Eval);

  // 2. Fetch PDF base64 if available
  let pdfBase64: string | null = null;
  if (docInfo && docInfo.storageUrl && docInfo.isPdf) {
    pdfBase64 = await fetchPdfAsBase64(docInfo.storageUrl);
  }

  // 3. Build grounded prompt
  const prompt = buildSessionDiligencePrompt(
    params.userMessage,
    params.activeAnalysis,
    params.agent1Eval,
    params.chatHistory,
    docInfo
  );

  // 4. Query Gemini 2.5 Flash with the attached PDF
  return await callGeminiDirect(prompt, pdfBase64);
}
