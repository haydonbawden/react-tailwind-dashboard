create extension if not exists "pgcrypto" with schema public;
create extension if not exists "uuid-ossp" with schema public;

-- Organisations
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  abn text not null unique,
  legal_name text not null,
  trading_name text,
  billing_email text not null,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

-- Users (profile linked to supabase auth.users via user_id)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references public.organisations(id) on delete set null,
  role text not null check (role in ('Admin','Reviewer','ClientRep')),
  given_name text,
  family_name text,
  phone text,
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  email text,
  unique(user_id)
);

-- Audit types + versions
create table if not exists public.audit_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  status text not null default 'Active'
);

create table if not exists public.audit_type_versions (
  id uuid primary key default gen_random_uuid(),
  audit_type_id uuid not null references public.audit_types(id) on delete cascade,
  version text not null,
  criteria_md text not null,
  form_schema jsonb not null,
  analysis_prompt_template text not null,
  price_aud numeric(12,2) not null,
  reminder_days int not null default 30,
  linked_docx_template_ids jsonb default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(audit_type_id, version)
);

-- Audits
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  audit_type_version_id uuid not null references public.audit_type_versions(id),
  status text not null check (status in ('Draft','AwaitingEvidence','InReview','ChangesRequested','Approved','Failed','Issued','Expired')),
  open_date date,
  due_date date,
  expiry_date date,
  reviewer_id uuid references public.profiles(id),
  decision_log_ref uuid,
  created_at timestamptz not null default now()
);

-- Evidence submissions & artifacts
create table if not exists public.evidence_submissions (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id),
  submitted_at timestamptz not null default now(),
  notes text
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  submission_id uuid references public.evidence_submissions(id) on delete set null,
  parent_artifact_id uuid references public.artifacts(id) on delete set null,
  kind text not null check (kind in ('original','ocr_text','split_pdf','page_text')),
  storage_path text not null,
  size_bytes bigint,
  sha256 text not null,
  page_ranges int4range,
  text_indexed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(sha256)
);

-- Findings
create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  criterion_key text not null,
  level text not null check (level in ('Compliant','OFI','MinorNC','MajorNC')),
  rationale text not null,
  citations jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Certificates + numbering
create sequence if not exists public.certificate_seq;
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  number text not null unique,
  issued_at timestamptz not null default now(),
  pdf_path text not null,
  verification_token text not null unique,
  status text not null check (status in ('Active','Revoked','Replaced')),
  revocation_reason text
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id),
  audit_id uuid,
  stripe_payment_intent_id text,
  amount_aud numeric(12,2) not null,
  status text not null,
  receipt_url text,
  created_at timestamptz not null default now()
);

-- Email templates + logs
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  version text not null,
  mode text not null check (mode in ('WYSIWYG','DragDrop','HTML')),
  html text not null,
  text text,
  variables jsonb default '[]'::jsonb,
  status text not null default 'Active',
  unique(key, version)
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  to_address text not null,
  cc_addresses text[],
  subject text,
  template_key text,
  template_version text,
  provider_message_id text,
  sent_at timestamptz,
  delivery_status text,
  provider_payload jsonb
);

-- Audit trail (append only)
create table if not exists public.audit_trail (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.audits enable row level security;
alter table public.artifacts enable row level security;
alter table public.evidence_submissions enable row level security;
alter table public.findings enable row level security;
alter table public.certificates enable row level security;
alter table public.payments enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_logs enable row level security;
alter table public.audit_trail enable row level security;

create policy profiles_self on public.profiles
  for select using (auth.uid() = user_id or exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'Admin'));
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = user_id or exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('Admin','Reviewer')));

create policy org_read on public.organisations
  for select using (
    exists (select 1 from public.profiles pr where pr.user_id = auth.uid() and (pr.role in ('Admin','Reviewer') or pr.org_id = organisations.id))
  );

create policy audit_read on public.audits
  for select using (
    exists (select 1 from public.profiles pr where pr.user_id = auth.uid() and (pr.role in ('Admin','Reviewer') or pr.org_id = audits.org_id))
  );

create policy artifacts_read on public.artifacts
  for select using (
    exists (select 1 from public.profiles pr where pr.user_id = auth.uid() and (pr.role in ('Admin','Reviewer') or pr.org_id = (select a.org_id from public.audits a where a.id = artifacts.audit_id)))
  );

create policy audit_trail_read on public.audit_trail
  for select using (exists (select 1 from public.profiles pr where pr.user_id = auth.uid() and pr.role in ('Admin','Reviewer')));

create or replace function public.next_certificate_number() returns text as $$
declare
  yr text := to_char(now(), 'YYYY');
  seq int := nextval('public.certificate_seq');
begin
  return 'CASTOR-' || yr || '-' || lpad(seq::text, 3, '0');
end; $$ language plpgsql stable;
