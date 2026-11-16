-- ==============================================================================
-- VENTURELENS: AGENT 3 - MULTI-DIMENSIONAL SCORING ENGINE SCHEMA
-- Table: agent3_evaluations
-- Consumes: Agent 2 (normalized_startup_profiles)
-- Outputs: 6 Calibrated Dimensions, Overall Score, Recommendation, Confidence
-- ==============================================================================

create table if not exists public.agent3_evaluations (
    id text primary key,
    analysis_id text references public.analyses(id) on delete cascade,
    startup_name text not null,
    
    -- Calibrated 6-Dimension Scores (0 to 100)
    overall_score integer not null check (overall_score >= 0 and overall_score <= 100),
    market_score integer not null check (market_score >= 0 and market_score <= 100),
    product_score integer not null check (product_score >= 0 and product_score <= 100),
    team_score integer not null check (team_score >= 0 and team_score <= 100),
    financial_score integer not null check (financial_score >= 0 and financial_score <= 100),
    traction_score integer not null check (traction_score >= 0 and traction_score <= 100),
    risk_score integer not null check (risk_score >= 0 and risk_score <= 100),
    
    -- Investment Verdict & Confidence
    recommendation text not null check (recommendation in ('INVEST', 'MAYBE', 'MONITOR', 'PASS')),
    confidence text not null default 'High' check (confidence in ('High', 'Moderate', 'Low')),
    confidence_score numeric default 0.85 check (confidence_score >= 0.0 and confidence_score <= 1.0),
    
    -- Detailed Dimension Breakdown & Factor Weights
    dimension_breakdowns jsonb default '{}'::jsonb,
    scoring_rationale jsonb default '{}'::jsonb,
    key_drivers jsonb default '[]'::jsonb,
    risk_penalties jsonb default '[]'::jsonb,
    
    -- Metadata
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_agent3_eval_analysis_id on public.agent3_evaluations(analysis_id);
create index if not exists idx_agent3_eval_overall_score on public.agent3_evaluations(overall_score desc);
create index if not exists idx_agent3_eval_recommendation on public.agent3_evaluations(recommendation);
create index if not exists idx_agent3_eval_created_at on public.agent3_evaluations(created_at desc);

-- Enable RLS
alter table public.agent3_evaluations enable row level security;

-- Policies for public, anon, and authenticated access
drop policy if exists "Allow read access to agent3_evaluations" on public.agent3_evaluations;
create policy "Allow read access to agent3_evaluations"
on public.agent3_evaluations for select
to anon, authenticated
using (true);

drop policy if exists "Allow insert access to agent3_evaluations" on public.agent3_evaluations;
create policy "Allow insert access to agent3_evaluations"
on public.agent3_evaluations for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow update access to agent3_evaluations" on public.agent3_evaluations;
create policy "Allow update access to agent3_evaluations"
on public.agent3_evaluations for update
to anon, authenticated
using (true);
