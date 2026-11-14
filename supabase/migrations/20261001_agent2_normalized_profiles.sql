-- ==============================================================================
-- VENTURELENS: AGENT 2 - DATA EXTRACTION & NORMALIZATION SCHEMA
-- ==============================================================================

-- 1. TABLE: normalized_startup_profiles
-- Stores canonical, standardized evaluation datasets consumable by Agent 3 (Scoring Engine)
create table if not exists public.normalized_startup_profiles (
    id text primary key,
    analysis_id text references public.analyses(id) on delete cascade,
    startup_id text,
    canonical_name text not null,
    primary_industry text default 'Technology',
    stage text default 'Early Stage',
    normalization_status text not null default 'completed' check (normalization_status in ('completed', 'partial', 'failed')),
    overall_confidence_score numeric default 0.85 check (overall_confidence_score >= 0.0 and overall_confidence_score <= 1.0),

    -- Normalized Domain Payloads
    startup_profile jsonb default '{}'::jsonb,
    business_information jsonb default '{}'::jsonb,
    financial_information jsonb default '{}'::jsonb,
    team_information jsonb default '{}'::jsonb,
    traction_information jsonb default '{}'::jsonb,
    market_information jsonb default '{}'::jsonb,
    technical_information jsonb default '{}'::jsonb,
    project_information jsonb default '{}'::jsonb,
    external_research jsonb default '{}'::jsonb,

    -- Traceability, Audit & Conflict Resolution Records
    normalized_metrics jsonb default '[]'::jsonb,
    validation_results jsonb default '[]'::jsonb,
    duplicate_records jsonb default '[]'::jsonb,
    conflicts jsonb default '[]'::jsonb,
    missing_fields jsonb default '[]'::jsonb,
    source_provenance jsonb default '[]'::jsonb,

    -- Metadata
    metadata jsonb default '{}'::jsonb,
    schema_version text default '1.0',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Performance Indexes
create index if not exists idx_norm_profiles_analysis_id on public.normalized_startup_profiles(analysis_id);
create index if not exists idx_norm_profiles_startup_id on public.normalized_startup_profiles(startup_id);
create index if not exists idx_norm_profiles_canonical_name on public.normalized_startup_profiles(canonical_name);
create index if not exists idx_norm_profiles_created_at on public.normalized_startup_profiles(created_at desc);
create index if not exists idx_norm_profiles_status on public.normalized_startup_profiles(normalization_status);

-- Enable Row Level Security
alter table public.normalized_startup_profiles enable row level security;

-- Policies for public, anon, and authenticated access
create policy "Allow read access to normalized_startup_profiles"
on public.normalized_startup_profiles for select
to anon, authenticated
using (true);

create policy "Allow insert access to normalized_startup_profiles"
on public.normalized_startup_profiles for insert
to anon, authenticated
with check (true);

create policy "Allow update access to normalized_startup_profiles"
on public.normalized_startup_profiles for update
to anon, authenticated
using (true);

