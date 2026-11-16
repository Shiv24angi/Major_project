/**
 * Agent 3 (Startup Scoring & Risk Calibration Engine) Client Service
 * Connects the frontend to the Agent 3 FastAPI backend (http://localhost:8004).
 */

import { supabase } from './supabaseService';
import { runClientScoring, type Agent3ScoringOutput } from './scoringEngine';

export const AGENT3_API_BASE = (
  (import.meta.env.AGENT3_API_URL as string) ||
  (import.meta.env.VITE_AGENT3_API_URL as string) ||
  'http://localhost:8004'
).replace(/\/+$/, '');

export interface Agent3HealthResponse {
  online: boolean;
  message?: string;
}

export async function checkAgent3Health(): Promise<Agent3HealthResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(`${AGENT3_API_BASE}/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return { online: false, message: `Status ${res.status}` };
    }
    const data = await res.json();
    return { online: true, message: data.status || 'online' };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return { online: false, message: err?.message || 'Offline' };
  }
}

export async function getAgent3Evaluation(analysisId: string): Promise<Agent3ScoringOutput | null> {
  // 1. Try querying Supabase agent3_evaluations
  try {
    const { data, error } = await supabase
      .from('agent3_evaluations')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as any;
    }
  } catch (_) {}

  // 2. Query analyses table
  try {
    const { data } = await supabase
      .from('analyses')
      .select('id, title, overall_score, recommendation, confidence, scores, thesis, mode')
      .eq('id', analysisId)
      .maybeSingle();

    if (data && data.scores) {
      return {
        id: `score_from_analysis_${data.id}`,
        analysis_id: data.id,
        startup_name: data.title,
        mode: data.mode || 'startup',
        overall_score: data.overall_score || 75,
        market_score: data.scores.market || 75,
        product_score: data.scores.product || 75,
        team_score: data.scores.team || 75,
        financial_score: data.scores.financial || 75,
        traction_score: data.scores.traction || 75,
        risk_score: data.scores.risk || 75,
        recommendation: data.recommendation || 'INVEST',
        recommendation_label: 'Investment Evaluation',
        confidence: data.confidence || 'High',
        confidence_score: 0.85,
        dimensions: {} as any,
        key_drivers: [],
        key_risks: [],
        scoring_summary: data.thesis || '',
        created_at: new Date().toISOString(),
      };
    }
  } catch (_) {}

  return null;
}

/**
 * Triggers multi-dimensional scoring for an analysis.
 * Tries Agent 3 backend microservice (port 8004) first;
 * if unreachable (e.g. deployed on Vercel), executes direct client scoring engine.
 */
export async function evaluateStartup(
  analysisId: string,
  startupName?: string
): Promise<Agent3ScoringOutput | null> {
  // 1. Try FastAPI backend if running
  try {
    const res = await fetch(`${AGENT3_API_BASE}/api/v1/agent3/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: analysisId,
        startup_name: startupName,
        save_to_database: true,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {
    console.info('[Agent 3 Service] Port 8004 offline; executing direct Supabase scoring engine.');
  }

  // 2. Fallback to resilient client scoring engine
  try {
    return await runClientScoring(analysisId, startupName);
  } catch (err) {
    console.error('Failed to run scoring evaluation for Agent 3:', err);
    return null;
  }
}
