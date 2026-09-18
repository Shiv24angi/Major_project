-- ==============================================================================
-- VENTURELENS SUPABASE DATABASE & STORAGE SCHEMA
-- Project Reference: kvcpmybvjllnddxzmnzr
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. STORAGE BUCKET: documents
-- Inserts bucket into storage.buckets if it does not already exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'documents',
    'documents',
    true,
    52428800, -- 50MB
    array[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json'
    ]
)
on conflict (id) do update set public = true;

-- Storage RLS Policies for the 'documents' bucket
create policy "Public Access to Documents"
on storage.objects for select
to public
using (bucket_id = 'documents');

create policy "Allow Upload to Documents"
on storage.objects for insert
to public
with check (bucket_id = 'documents');

create policy "Allow Update to Documents"
on storage.objects for update
to public
using (bucket_id = 'documents')
with check (bucket_id = 'documents');

create policy "Allow Delete from Documents"
on storage.objects for delete
to public
using (bucket_id = 'documents');


-- 3. TABLE: analyses
create table if not exists public.analyses (
    id text primary key,
    title text not null,
    mode text not null default 'startup' check (mode in ('startup', 'project')),
    tagline text,
    industry text default 'Technology',
    website text,
    stage text default 'Early Stage',
    status text not null default 'completed' check (status in ('completed', 'processing', 'failed')),
    is_demo boolean default false,
    overall_score integer default 75,
    recommendation text default 'INVEST' check (recommendation in ('INVEST', 'MAYBE', 'MONITOR', 'PASS')),
    confidence text default 'High' check (confidence in ('High', 'Moderate', 'Low')),
    thesis text,
    scores jsonb default '{"market": 75, "product": 75, "team": 75, "financial": 75, "traction": 75, "risk": 75}'::jsonb,
    key_insights jsonb default '{"strengths": [], "risks": [], "opportunities": [], "nextSteps": []}'::jsonb,
    due_diligence_questions jsonb default '[]'::jsonb,
    code_details jsonb,
    agent6_data jsonb,
    funding_matches jsonb default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for fast lookup by mode, status, and creation date
create index if not exists idx_analyses_created_at on public.analyses(created_at desc);
create index if not exists idx_analyses_mode on public.analyses(mode);
create index if not exists idx_analyses_status on public.analyses(status);

-- Enable RLS
alter table public.analyses enable row level security;

-- Policies for public access (allow both anon and authenticated users to read and create)
create policy "Allow read access to analyses"
on public.analyses for select
to anon, authenticated
using (true);

create policy "Allow insert access to analyses"
on public.analyses for insert
to anon, authenticated
with check (true);

create policy "Allow update access to analyses"
on public.analyses for update
to anon, authenticated
using (true)
with check (true);

create policy "Allow delete access to analyses"
on public.analyses for delete
to anon, authenticated
using (true);


-- 4. TABLE: documents (Metadata and storage pointers for uploaded documents)
-- Organizes uploaded files by distinct company/idea folders (e.g. 'Airbnb/Pitch_Decks/...')
create table if not exists public.documents (
    id text primary key,
    analysis_id text not null references public.analyses(id) on delete cascade,
    company_name text, -- Company / Startup / Idea name folder identifier
    folder_path text,  -- Folder path inside bucket (e.g. 'Airbnb/Pitch_Decks')
    name text not null,
    type text default 'Pitch Deck',
    size text,
    file_path text,    -- Full path inside bucket (e.g. 'Airbnb/Pitch_Decks/1726210000_deck.pdf')
    storage_url text,  -- Public Supabase CDN URL
    status text not null default 'indexed' check (status in ('uploaded', 'processing', 'indexed', 'failed')),
    chunks integer default 12,
    upload_date date default current_date,
    created_at timestamptz not null default now()
);

-- Index for fast company and foreign key lookups
create index if not exists idx_documents_analysis_id on public.documents(analysis_id);
create index if not exists idx_documents_company_name on public.documents(company_name);
create index if not exists idx_documents_status on public.documents(status);


-- Enable RLS
alter table public.documents enable row level security;

create policy "Allow read access to documents"
on public.documents for select
to anon, authenticated
using (true);

create policy "Allow insert access to documents"
on public.documents for insert
to anon, authenticated
with check (true);

create policy "Allow update access to documents"
on public.documents for update
to anon, authenticated
using (true)
with check (true);

create policy "Allow delete access to documents"
on public.documents for delete
to anon, authenticated
using (true);


-- 5. TABLE: chat_messages (Interactive diligence assistant chat history)
create table if not exists public.chat_messages (
    id text primary key,
    analysis_id text not null references public.analyses(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    text text not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_analysis_id on public.chat_messages(analysis_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at asc);

alter table public.chat_messages enable row level security;

create policy "Allow read access to chat_messages"
on public.chat_messages for select
to anon, authenticated
using (true);

create policy "Allow insert access to chat_messages"
on public.chat_messages for insert
to anon, authenticated
with check (true);


-- 6. TABLE: agent6_evaluations (Raw & structured Agent 6 code diligence handoffs)
create table if not exists public.agent6_evaluations (
    run_id text primary key,
    analysis_id text references public.analyses(id) on delete set null,
    github_url text not null,
    repository_owner text,
    repository_name text,
    findings_summary jsonb default '{}'::jsonb,
    findings jsonb default '[]'::jsonb,
    raw_analysis jsonb default '{}'::jsonb,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_agent6_eval_analysis_id on public.agent6_evaluations(analysis_id);
create index if not exists idx_agent6_eval_github_url on public.agent6_evaluations(github_url);

alter table public.agent6_evaluations enable row level security;

create policy "Allow read access to agent6_evaluations"
on public.agent6_evaluations for select
to anon, authenticated
using (true);

create policy "Allow insert access to agent6_evaluations"
on public.agent6_evaluations for insert
to anon, authenticated
with check (true);

create policy "Allow update access to agent6_evaluations"
on public.agent6_evaluations for update
to anon, authenticated
using (true)
with check (true);


-- 7. REALTIME REPLICATION (Allows live updates in the frontend)
alter publication supabase_realtime add table public.analyses;
alter publication supabase_realtime add table public.documents;
alter publication supabase_realtime add table public.chat_messages;
