-- ==============================================================================
-- VENTURELENS: AGENT 4 - INSIGHT & RECOMMENDATION GENERATOR SCHEMA
-- Table: agent4_recommendations
-- Consumes: Agent 3 (Scoring Engine) + Agent 2 (Normalized Startup Profiles)
-- Outputs: Investment Thesis, Strengths, Risks, Opportunities, Next Steps, Due Diligence Questions
-- ==============================================================================

create table if not exists public.agent4_recommendations (
    id text primary key,
    analysis_id text references public.analyses(id) on delete cascade,
    startup_name text not null,
    
    -- Investment Verdict & Confidence
    recommendation text not null check (recommendation in ('INVEST', 'MAYBE', 'MONITOR', 'PASS')),
    recommendation_label text,
    confidence text not null default 'High' check (confidence in ('High', 'Moderate', 'Low')),
    
    -- Core Diligence Narratives
    investment_thesis text not null,
    
    -- Structured Key Insights
    key_strengths jsonb default '[]'::jsonb,
    risks_and_concerns jsonb default '[]'::jsonb,
    growth_opportunities jsonb default '[]'::jsonb,
    actionable_next_steps jsonb default '[]'::jsonb,
    
    -- Targeted Founder Due Diligence Inquiries
    due_diligence_questions jsonb default '[]'::jsonb,
    
    -- Scoring Alignment & Lineage
    overall_score integer check (overall_score >= 0 and overall_score <= 100),
    dimension_scores jsonb default '{}'::jsonb,
    
    -- Execution Metadata
    generation_source text default 'gemini_and_rules',
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_agent4_rec_analysis_id on public.agent4_recommendations(analysis_id);
create index if not exists idx_agent4_rec_recommendation on public.agent4_recommendations(recommendation);
create index if not exists idx_agent4_rec_created_at on public.agent4_recommendations(created_at desc);

-- Enable RLS
alter table public.agent4_recommendations enable row level security;

-- Policies for public, anon, and authenticated access
drop policy if exists "Allow read access to agent4_recommendations" on public.agent4_recommendations;
create policy "Allow read access to agent4_recommendations"
on public.agent4_recommendations for select
to anon, authenticated
using (true);

drop policy if exists "Allow insert access to agent4_recommendations" on public.agent4_recommendations;
create policy "Allow insert access to agent4_recommendations"
on public.agent4_recommendations for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow update access to agent4_recommendations" on public.agent4_recommendations;
create policy "Allow update access to agent4_recommendations"
on public.agent4_recommendations for update
to anon, authenticated
using (true);
