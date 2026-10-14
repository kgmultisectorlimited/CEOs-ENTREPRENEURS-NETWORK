alter table public.applications
  add column if not exists whatsapp_contact text;
alter table public.profiles
  add column if not exists whatsapp_contact text;
alter table public.profiles
  add column if not exists show_whatsapp boolean not null default false;

create or replace view public.member_directory
with (security_invoker = false)
as
  select id, full_name, "current_role", company, location, linkedin, bio, allow_dm, profile_photo,
    case when show_whatsapp then whatsapp_contact else null end as whatsapp_contact
  from public.profiles
  where show_profile = true;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  approved_application public.applications%rowtype;
begin
  select *
    into approved_application
  from public.applications
  where lower(email) = lower(new.email)
    and status = 'approved'
    and auth_user_id is null
    and (
      new.raw_user_meta_data->>'application_id' is null
      or id::text = new.raw_user_meta_data->>'application_id'
    )
  order by updated_at desc, created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'An approved membership application is required to create an account.';
  end if;

  insert into public.profiles (
    auth_user_id,
    full_name,
    email,
    "current_role",
    company,
    phone,
    location,
    whatsapp_contact
  )
  values (
    new.id,
    approved_application.full_name,
    new.email,
    approved_application.position,
    approved_application.company,
    approved_application.phone,
    approved_application.location,
    approved_application.whatsapp_contact
  );

  update public.applications
  set auth_user_id = new.id,
      updated_at = now()
  where id = approved_application.id;

  return new;
end;
$$;
