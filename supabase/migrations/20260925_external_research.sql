-- ==============================================================================
-- VENTURELENS / NIVESH: EXTERNAL RESEARCH ENGINE SCHEMA (TASKS 5–10)
-- ==============================================================================

-- 1. TABLE: research_evaluations (Stores external web research, market, competitors, funding & news)
create table if not exists public.research_evaluations (
    id text primary key,
    analysis_id text references public.analyses(id) on delete cascade,
    startup_name text not null,
    website text,
    industry text default 'Technology',
    status text not null default 'completed' check (status in ('completed', 'processing', 'failed')),
    search_provider_used text default 'zerocost_search', -- 'perplexity' | 'zerocost_search'
    
    -- Task 5: Web Crawler & Evidence Validation
    evidence_sources jsonb default '[]'::jsonb,
    crawled_pages jsonb default '[]'::jsonb,
    overall_confidence numeric default 0.80 check (overall_confidence >= 0.0 and overall_confidence <= 1.0),
    
    -- Task 6: Market and Industry Research
    market_research jsonb default '{}'::jsonb,
    
    -- Task 7: Competitor Intelligence & Benchmarks
    competitor_research jsonb default '{}'::jsonb,
    
    -- Task 8: Financial and Funding Rounds
    financial_research jsonb default '{}'::jsonb,
    
    -- Task 9: News and Sector Developments
    news_research jsonb default '[]'::jsonb,
    
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_research_eval_analysis_id on public.research_evaluations(analysis_id);
create index if not exists idx_research_eval_startup_name on public.research_evaluations(startup_name);
create index if not exists idx_research_eval_created_at on public.research_evaluations(created_at desc);
create index if not exists idx_research_eval_status on public.research_evaluations(status);

-- Enable RLS
alter table public.research_evaluations enable row level security;

-- Policies for public, anon, and authenticated access
create policy "Allow read access to research_evaluations"
on public.research_evaluations for select
to anon, authenticated
using (true);

create policy "Allow insert access to research_evaluations"
on public.research_evaluations for insert
to anon, authenticated
with check (true);

create policy "Allow update access to research_evaluations"
on public.research_evaluations for update
to anon, authenticated
using (true)
with check (true);

create policy "Allow delete access to research_evaluations"
on public.research_evaluations for delete
to anon, authenticated
using (true);

-- Enable realtime streaming for live frontend updates
alter publication supabase_realtime add table public.research_evaluations;

