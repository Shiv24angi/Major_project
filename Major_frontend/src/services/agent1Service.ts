/**
 * Agent 1 Service
 * Connects VentureLens frontend to Agent 1 FastAPI Document Intelligence Engine (port 8001).
 * Features multi-document extraction, LangGraph synthesis, contradiction detection, and Supabase persistence.
 */

import { saveAgent1Evaluation, type Agent1EvaluationRecord } from './supabaseService';
import { addAnalysis, getStoredAnalyses } from './analysisStorage';

export const AGENT1_API_BASE =
  import.meta.env.VITE_AGENT1_API_URL ||
  import.meta.env.AGENT1_API_URL ||
  'http://localhost:8001';

export interface Agent1Founder {
  name?: string;
  role?: string;
  background?: string;
}

export interface Agent1FinancialMetrics {
  revenue?: string | null;
  arr?: string | null;
  mrr?: string | null;
  burn_rate?: string | null;
  runway?: string | null;
  growth_rate?: string | null;
  gross_margin?: string | null;
  churn?: string | null;
  cac?: string | null;
  ltv?: string | null;
}

export interface Agent1MarketSize {
  tam?: string | null;
  sam?: string | null;
  som?: string | null;
}

export interface Agent1Evidence {
  claim: string;
  source?: string;
  location?: string;
  supporting_text?: string;
  confidence?: number;
}

export interface Agent1DocumentAnalysis {
  file_path?: string;
  document_type?: string;
  is_startup_document?: boolean;
  document_category?: string;
  startup_relevance_reason?: string;
  startup_name?: string;
  description?: string;
  industry?: string;
  sector?: string;
  founders?: Agent1Founder[];
  product?: string;
  business_model?: string;
  target_customers?: string;
  financials?: Agent1FinancialMetrics;
  funding_raised?: string;
  investors?: string[];
  customers?: string;
  traction?: string;
  market_size?: Agent1MarketSize;
  competitors?: string[];
  risks?: string[];
  key_metrics?: Record<string, string>;
  missing_information?: string[];
  evidence?: Agent1Evidence[];
}

export interface Agent1Contradiction {
  topic?: string;
  claim_1?: string;
  source_1?: string;
  claim_2?: string;
  source_2?: string;
  explanation?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export interface Agent1MergedAnalysis {
  startup_name?: string;
  description?: string;
  industry?: string;
  sector?: string;
  founders?: Array<Record<string, any>>;
  product?: string;
  business_model?: string;
  target_customers?: string;
  financials?: Record<string, any>;
  funding_raised?: string;
  investors?: string[];
  customers?: string;
  traction?: string;
  market_size?: Record<string, any>;
  competitors?: string[];
  risks?: string[];
  key_metrics?: Record<string, any>;
  missing_information?: string[];
  source_files?: string[];
}

export interface Agent1AnalysisResult {
  message?: string;
  uploaded_files: Array<{
    original_filename: string;
    stored_filename?: string;
    file_type?: string;
  }>;
  status: string;
  document_analyses: Agent1DocumentAnalysis[];
  merged_analysis?: Agent1MergedAnalysis | null;
  contradictions: Agent1Contradiction[];
  validation_errors: string[];
  evaluation_id?: string;
  supabase_synced?: boolean;
}

export interface Agent1HealthResponse {
  online: boolean;
  status?: string;
  agent?: string;
  version?: string;
  port?: number;
  model?: string;
  llm_configured?: boolean;
  error?: string;
}

/**
 * Check if the Agent 1 FastAPI backend is accessible
 */
export async function checkAgent1Health(): Promise<Agent1HealthResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(`${AGENT1_API_BASE}/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        status: data.status,
        agent: data.agent,
        version: data.version,
        port: data.port || 8001,
        model: data.model,
        llm_configured: data.llm_configured,
      };
    }
    return { online: false, error: `HTTP ${res.status}` };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      online: false,
      error:
        err.name === 'AbortError'
          ? 'Agent 1 connection timed out'
          : `Agent 1 offline (${err.message || 'port 8001'})`,
    };
  }
}

/**
 * Run Multi-Document LangGraph Ingestion & Contradiction Analysis
 */
export async function analyzeDocumentsWithAgent1(
  files: File[],
  analysisId?: string,
  companyName?: string
): Promise<{
  success: boolean;
  result?: Agent1AnalysisResult;
  error?: string;
}> {
  if (!files || files.length === 0) {
    return { success: false, error: 'Please select at least one document to analyze.' };
  }

  const formData = new FormData();
  files.forEach((f) => formData.append('files', f, f.name));

  try {
    const res = await fetch(`${AGENT1_API_BASE}/api/v1/analyze-documents`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let errDetail = `Server responded with ${res.status}`;
      try {
        const errorJson = await res.json();
        errDetail = errorJson.detail || errDetail;
      } catch (_) {}
      return { success: false, error: errDetail };
    }

    const data: Agent1AnalysisResult = await res.json();
    const evaluationId = `a1_eval_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    data.evaluation_id = evaluationId;

    // 1. Automatically persist evaluation into Supabase Database
    try {
      const evalRecord: Agent1EvaluationRecord = {
        id: evaluationId,
        analysis_id: analysisId,
        company_name:
          companyName ||
          data.merged_analysis?.startup_name ||
          data.document_analyses[0]?.startup_name ||
          'Uploaded Venture',
        status: 'completed',
        uploaded_files: data.uploaded_files || [],
        document_analyses: data.document_analyses || [],
        merged_analysis: data.merged_analysis || {},
        contradictions: data.contradictions || [],
        validation_errors: data.validation_errors || [],
        metadata: {
          analyzed_at: new Date().toISOString(),
          file_count: files.length,
          model: 'gemini',
        },
      };

      const syncRes = await saveAgent1Evaluation(evalRecord);
      data.supabase_synced = syncRes.success;
    } catch (dbErr) {
      console.warn('[Agent 1 Service] Supabase database sync warning:', dbErr);
      data.supabase_synced = false;
    }

    // 2. Optionally enrich existing analysis in local storage
    if (analysisId) {
      try {
        const analyses = getStoredAnalyses();
        const existing = analyses.find((a) => a.id === analysisId);
        if (existing) {
          const merged = data.merged_analysis;
          const updated = {
            ...existing,
            thesis: merged?.description || existing.thesis,
            tagline: merged?.business_model || existing.tagline,
            industry: merged?.industry || existing.industry,
          };
          addAnalysis(updated);
        }
      } catch (storageErr) {
        console.warn('[Agent 1 Service] Local storage update warning:', storageErr);
      }
    }

    return { success: true, result: data };
  } catch (netErr: any) {
    return {
      success: false,
      error: `Could not reach Agent 1 on port 8001: ${netErr.message}. Ensure backend is running.`,
    };
  }
}

/**
 * Extract text from a single PDF/DOCX/PPTX document
 */
export async function extractDocumentText(file: File): Promise<{
  success: boolean;
  data?: {
    document_type: string;
    full_text: string;
    metadata?: Record<string, any>;
  };
  error?: string;
}> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    const res = await fetch(`${AGENT1_API_BASE}/api/v1/extract-document`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.detail || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return {
      success: true,
      data: {
        document_type: data.document_type,
        full_text: data.full_text,
        metadata: data.metadata,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
