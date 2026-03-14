-- ABOUTME: Migration to add prompt_versions table for Brand DNA prompt version history
-- ABOUTME: Mirrors the agent_prompt_versions pattern from AI Garage; ai_prompt_templates.prompt_text remains the active version

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.ai_prompt_templates(id) on delete cascade,
  content text not null,
  version_number integer not null,
  change_summary text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- Efficient lookup by prompt, newest first
create index idx_prompt_versions_prompt_id on public.prompt_versions(prompt_id, version_number desc);

-- RLS
alter table public.prompt_versions enable row level security;

create policy "Authenticated users can read prompt versions"
  on public.prompt_versions for select to authenticated using (true);

create policy "Authenticated users can insert prompt versions"
  on public.prompt_versions for insert to authenticated with check (true);
