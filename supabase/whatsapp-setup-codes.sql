create table if not exists public.applicant_setup_codes (
  application_id uuid primary key references public.applications(id) on delete cascade,
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  failed_attempts smallint not null default 0 check (failed_attempts between 0 and 5),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.applicant_setup_codes enable row level security;
revoke all on public.applicant_setup_codes from public, anon, authenticated;
grant all on public.applicant_setup_codes to service_role;

create or replace function public.consume_applicant_setup_code(
  p_application_id uuid,
  p_email text,
  p_code_hash text
)
returns table(application_id uuid, full_name text, email text)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  approved record;
begin
  select a.id, a.full_name, a.email
    into approved
  from public.applicant_setup_codes c
  join public.applications a on a.id = c.application_id
  where a.id = p_application_id
    and lower(a.email) = lower(trim(p_email))
    and a.status = 'approved'
    and a.auth_user_id is null
    and c.code_hash = p_code_hash
    and c.expires_at > now()
    and c.consumed_at is null
    and c.failed_attempts < 5
  for update of c;

  if not found then
    update public.applicant_setup_codes c
    set failed_attempts = least(c.failed_attempts + 1, 5)
    from public.applications a
    where a.id = c.application_id
      and a.id = p_application_id
      and lower(a.email) = lower(trim(p_email))
      and a.status = 'approved'
      and a.auth_user_id is null
      and c.expires_at > now()
      and c.consumed_at is null
      and c.failed_attempts < 5;
    return;
  end if;

  update public.applicant_setup_codes
  set consumed_at = now()
  where applicant_setup_codes.application_id = approved.id;

  return query
  select approved.id, approved.full_name, approved.email;
end;
$$;

revoke all on function public.consume_applicant_setup_code(uuid, text, text) from public, anon, authenticated;
grant execute on function public.consume_applicant_setup_code(uuid, text, text) to service_role;
