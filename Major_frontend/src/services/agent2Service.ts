/**
 * Agent 2 (Data Extraction & Normalization) Client Service
 * Connects the frontend to the Agent 2 FastAPI backend (http://localhost:8003).
 */

export const AGENT2_API_BASE = (
  (import.meta.env.AGENT2_API_URL as string) ||
  (import.meta.env.VITE_AGENT2_API_URL as string) ||
  'http://localhost:8003'
).replace(/\/+$/, '');

export interface NormalizedMetric {
  metric_name: string;
  original_value: any;
  normalized_value: any;
  unit?: string;
  currency?: string;
  confidence: number;
  validation_status: string;
  conflict_status: string;
  source_agent: string;
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  original_value?: any;
  action_taken: string;
}

export interface DuplicateRecord {
  field: string;
  duplicate_value: any;
  kept_value: any;
  source_agents: string[];
  similarity_score: number;
  action: string;
}

export interface ConflictRecord {
  field: string;
  category: string;
  candidates: Array<{
    source: string;
    value: any;
    confidence: number;
    timestamp?: string;
    notes?: string;
  }>;
  resolved_value: any;
  resolution_policy: string;
  resolution_rationale: string;
  is_resolved: boolean;
}

export interface MissingFieldRecord {
  field: string;
  category: string;
  importance: 'critical' | 'important' | 'optional';
  description: string;
  downstream_impact: string;
}

export interface SourceProvenanceRecord {
  field_path: string;
  source_agent: string;
  document_or_url?: string;
  location?: string;
  evidence_snippet?: string;
  confidence_score: number;
  extraction_timestamp?: string;
}

export interface NormalizedStartupDataset {
  id: string;
  analysis_id: string;
  startup_id?: string;
  normalization_status: 'completed' | 'partial' | 'failed';
  overall_confidence_score: number;
  
  startup_profile: {
    canonical_name: string;
    legal_name?: string;
    aliases: string[];
    tagline?: string;
    description: string;
    primary_industry: string;
    sub_sectors: string[];
    stage: string;
    headquarters?: string;
    founded_year?: number;
    website?: string;
    github_url?: string;
  };

  business_information: {
    business_model: string;
    monetization_structure: string[];
    target_customer_segments: string[];
    pricing_strategy?: string;
    sales_motion?: string;
    competitors: string[];
    key_differentiators: string[];
    risk_factors: string[];
  };

  financial_information: {
    currency: string;
    annual_recurring_revenue?: number;
    monthly_recurring_revenue?: number;
    total_capital_raised?: number;
    last_known_valuation?: number;
    implied_arr_multiple?: number;
    monthly_burn_rate?: number;
    runway_months?: number;
    gross_margin_percentage?: number;
    annual_growth_rate_percentage?: number;
    churn_rate_percentage?: number;
    cac?: number;
    ltv?: number;
    ltv_cac_ratio?: number;
    capital_efficiency_status: 'healthy' | 'moderate' | 'critical' | 'unverified';
    investor_syndicate: string[];
  };

  team_information: {
    founders: Array<{
      name: string;
      role?: string;
      domain_background?: string;
      is_technical: boolean;
      linkedin_url?: string;
    }>;
    team_size_estimate?: number;
    technical_founder_present: boolean;
    team_strengths: string[];
  };

  traction_information: {
    customer_count_estimate?: number;
    active_pilot_count?: number;
    retention_health?: string;
    qualitative_traction: string[];
    public_metrics: Record<string, any>;
  };

  market_information: {
    tam_usd?: number;
    sam_usd?: number;
    som_usd?: number;
    cagr_percentage?: number;
    market_drivers: string[];
    market_headwinds: string[];
    icp_profile?: string;
    sizing_confidence: number;
  };

  technical_information: {
    repository_full_name?: string;
    tech_stack_standardized: string[];
    architecture_pattern?: string;
    code_maturity_rating: 'high' | 'moderate' | 'early' | 'unverified';
    supported_feature_claims: string[];
    inferred_feature_claims: string[];
    unsupported_or_unknown_claims: string[];
    technical_strengths: string[];
    technical_risks: string[];
    files_audited_count: number;
    agent6_verified: boolean;
  };

  project_information: {
    is_open_source: boolean;
    problem_statement?: string;
    primary_solution?: string;
    commercialization_readiness: 'high' | 'moderate' | 'low';
    enterprise_gaps: string[];
  };

  external_research: Record<string, any>;
  normalized_metrics: NormalizedMetric[];
  validation_results: ValidationIssue[];
  duplicate_records: DuplicateRecord[];
  conflicts: ConflictRecord[];
  missing_fields: MissingFieldRecord[];
  source_provenance: SourceProvenanceRecord[];
  metadata: Record<string, any>;
  created_at: string;
  schema_version: string;
}

export async function checkAgent2Health(): Promise<boolean> {
  try {
    const res = await fetch(`${AGENT2_API_BASE}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getNormalizedDataset(analysisId: string): Promise<NormalizedStartupDataset | null> {
  try {
    const res = await fetch(`${AGENT2_API_BASE}/api/v1/agent2/${analysisId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch normalized dataset from Agent 2:', err);
    return null;
  }
}

export async function fetchAndNormalize(
  analysisId: string,
  startupName?: string
): Promise<NormalizedStartupDataset | null> {
  try {
    const res = await fetch(`${AGENT2_API_BASE}/api/v1/agent2/fetch-and-normalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: analysisId,
        startup_name: startupName,
        save_to_database: true,
      }),
    });
    if (!res.ok) throw new Error(`Agent 2 responded with status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to run fetch-and-normalize on Agent 2:', err);
    return null;
  }
}

export async function getNormalizationStatus(analysisId: string): Promise<any> {
  try {
    const res = await fetch(`${AGENT2_API_BASE}/api/v1/agent2/${analysisId}/status`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

