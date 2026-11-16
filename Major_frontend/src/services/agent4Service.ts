/**
 * Agent 4 (Insight & Recommendation Generator) Client Service
 * Connects frontend to the Agent 4 FastAPI backend (http://localhost:8005).
 */

import { supabase } from './supabaseService';
import { runClientRecommendations, type Agent4RecommendationOutput } from './recommendationEngine';

export const AGENT4_API_BASE = (
  (import.meta.env.AGENT4_API_URL as string) ||
  (import.meta.env.VITE_AGENT4_API_URL as string) ||
  'http://localhost:8005'
).replace(/\/+$/, '');

export interface Agent4HealthResponse {
  online: boolean;
  message?: string;
}

export async function checkAgent4Health(): Promise<Agent4HealthResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(`${AGENT4_API_BASE}/health`, {
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

/**
 * Triggers Insight & Recommendation generation for an analysis.
 * Attempts FastAPI backend (port 8005) first;
 * falls back cleanly to client recommendation engine on cloud/Vercel deployments.
 */
export async function generateInsightsAndRecommendations(
  analysisId: string,
  startupName?: string
): Promise<Agent4RecommendationOutput | null> {
  // 1. Try FastAPI backend if online
  try {
    const res = await fetch(`${AGENT4_API_BASE}/api/v1/agent4/generate`, {
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
    console.info('[Agent 4 Service] Port 8005 offline; executing direct Supabase recommendation engine.');
  }

  // 2. Resilient cloud fallback
  try {
    return await runClientRecommendations(analysisId, startupName);
  } catch (err) {
    console.error('Failed to run Agent 4 recommendation synthesis:', err);
    return null;
  }
}

export async function getAgent4Recommendations(analysisId: string): Promise<Agent4RecommendationOutput | null> {
  try {
    const { data, error } = await supabase
      .from('agent4_recommendations')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as any;
  } catch (_) {}

  return null;
}
