-- ==============================================================================
-- VENTURELENS: AGENT 1 DOCUMENT DILIGENCE EVALUATIONS SCHEMA
-- ==============================================================================

-- 1. TABLE: agent1_evaluations (Stores parsed extractions, multi-doc synthesis, and contradictions)
create table if not exists public.agent1_evaluations (
    id text primary key,
    analysis_id text references public.analyses(id) on delete cascade,
    company_name text,
    status text not null default 'completed' check (status in ('completed', 'processing', 'failed')),
    uploaded_files jsonb default '[]'::jsonb,
    document_analyses jsonb default '[]'::jsonb,
    merged_analysis jsonb default '{}'::jsonb,
    contradictions jsonb default '[]'::jsonb,
    validation_errors jsonb default '[]'::jsonb,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_agent1_eval_analysis_id on public.agent1_evaluations(analysis_id);
create index if not exists idx_agent1_eval_created_at on public.agent1_evaluations(created_at desc);
create index if not exists idx_agent1_eval_status on public.agent1_evaluations(status);

-- Enable RLS
alter table public.agent1_evaluations enable row level security;

-- Policies for anon and authenticated access
create policy "Allow read access to agent1_evaluations"
on public.agent1_evaluations for select
to anon, authenticated
using (true);

create policy "Allow insert access to agent1_evaluations"
on public.agent1_evaluations for insert
to anon, authenticated
with check (true);

create policy "Allow update access to agent1_evaluations"
on public.agent1_evaluations for update
to anon, authenticated
using (true)
with check (true);

create policy "Allow delete access to agent1_evaluations"
on public.agent1_evaluations for delete
to anon, authenticated
using (true);

-- Realtime replication for instant UI updates
alter publication supabase_realtime add table public.agent1_evaluations;
