do $$
declare
  admin_user_id uuid;
begin
  select id into admin_user_id
  from auth.users
  where lower(email) = lower('kgmultisectorlimited@gmail.com');

  if admin_user_id is null then
    raise exception 'Create and confirm the founder account in Supabase Auth before running this script.';
  end if;

  insert into public.profiles (
    auth_user_id,
    full_name,
    email,
    "current_role",
    company,
    phone,
    location,
    bio,
    role
  )
  values (
    admin_user_id,
    'KAZUNGU GERALD',
    'kgmultisectorlimited@gmail.com',
    'CEO & Founder',
    'KG MULTISECTOR LIMITED',
    '+256778617690',
    'Kampala, Uganda',
    'CEO and Founder of KG MULTISECTOR LIMITED.',
    'admin'
  )
  on conflict (email) do update
    set auth_user_id = excluded.auth_user_id,
        full_name = excluded.full_name,
        "current_role" = excluded."current_role",
        company = excluded.company,
        phone = excluded.phone,
        location = excluded.location,
        bio = excluded.bio,
        role = 'admin',
        updated_at = now();
end;
$$;
