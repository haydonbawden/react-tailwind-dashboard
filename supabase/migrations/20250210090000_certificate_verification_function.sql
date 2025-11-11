-- Function to retrieve certificate details by verification token
create or replace function public.get_certificate_by_token(token text)
returns table (
  number text,
  status text,
  issued_at timestamptz,
  organisation_name text,
  audit_type_name text,
  expiry_date date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.number,
    c.status,
    c.issued_at,
    o.legal_name as organisation_name,
    at.name as audit_type_name,
    a.expiry_date
  from public.certificates c
  join public.audits a on a.id = c.audit_id
  join public.organisations o on o.id = a.org_id
  join public.audit_type_versions atv on atv.id = a.audit_type_version_id
  join public.audit_types at on at.id = atv.audit_type_id
  where c.verification_token = token
  limit 1;
$$;

grant execute on function public.get_certificate_by_token(text) to anon, authenticated;

create index if not exists certificates_verification_token_idx
  on public.certificates(verification_token);
