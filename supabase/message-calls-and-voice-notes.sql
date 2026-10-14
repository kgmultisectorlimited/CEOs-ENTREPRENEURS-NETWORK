update storage.buckets
set allowed_mime_types = array_cat(
  coalesce(allowed_mime_types, array[]::text[]),
  array['audio/webm']::text[]
)
where id = 'community-media'
  and not coalesce(allowed_mime_types, array[]::text[]) @> array['audio/webm']::text[];

create table if not exists public.direct_call_invites (
  id uuid primary key default gen_random_uuid(),
  caller_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('audio', 'video')),
  created_at timestamptz not null default now(),
  check (caller_profile_id <> recipient_profile_id)
);
create index if not exists idx_direct_call_invites_recipient_created
  on public.direct_call_invites(recipient_profile_id, created_at desc);

alter table public.direct_call_invites enable row level security;
revoke all on public.direct_call_invites from anon, authenticated;
grant select on public.direct_call_invites to authenticated;
grant insert (id, caller_profile_id, recipient_profile_id, mode) on public.direct_call_invites to authenticated;
grant delete on public.direct_call_invites to authenticated;

create or replace function public.can_create_direct_call_invite(p_caller_profile_id uuid, p_recipient_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles caller
    join public.profiles recipient on recipient.id = p_recipient_profile_id
    where caller.id = p_caller_profile_id
      and caller.auth_user_id = auth.uid()
      and caller.id <> recipient.id
      and recipient.show_profile = true
      and recipient.allow_dm = true
  );
$$;

revoke all on function public.can_create_direct_call_invite(uuid, uuid) from public, anon;
grant execute on function public.can_create_direct_call_invite(uuid, uuid) to authenticated;

drop policy if exists "Recipients can receive direct call invitations" on public.direct_call_invites;
drop policy if exists "Call participants can view call invitations" on public.direct_call_invites;
create policy "Call participants can view call invitations"
  on public.direct_call_invites for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = caller_profile_id and auth_user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles
      where id = recipient_profile_id and auth_user_id = auth.uid()
    )
  );

drop policy if exists "Members can call opted-in members" on public.direct_call_invites;
create policy "Members can call opted-in members"
  on public.direct_call_invites for insert
  to authenticated
  with check (public.can_create_direct_call_invite(caller_profile_id, recipient_profile_id));

drop policy if exists "Call participants can clear call invitations" on public.direct_call_invites;
create policy "Call participants can clear call invitations"
  on public.direct_call_invites for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = caller_profile_id and auth_user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles
      where id = recipient_profile_id and auth_user_id = auth.uid()
    )
  );

create or replace function public.can_access_direct_call_room(p_topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_topic ~ '^direct-call:[0-9a-fA-F-]{36}:[0-9a-fA-F-]{36}$'
    and exists (
      select 1
      from public.profiles first_member
      join public.profiles second_member
        on second_member.id::text = split_part(p_topic, ':', 3)
      where first_member.id::text = split_part(p_topic, ':', 2)
        and first_member.id < second_member.id
        and auth.uid() in (first_member.auth_user_id, second_member.auth_user_id)
        and (first_member.show_profile or second_member.show_profile)
        and (first_member.allow_dm or second_member.allow_dm)
    );
$$;

revoke all on function public.can_access_direct_call_room(text) from public, anon;
grant execute on function public.can_access_direct_call_room(text) to authenticated;

drop policy if exists "Conversation members can receive call signals" on realtime.messages;
create policy "Conversation members can receive call signals"
  on realtime.messages for select
  to authenticated
  using (public.can_access_direct_call_room(realtime.topic()));

drop policy if exists "Conversation members can send call signals" on realtime.messages;
create policy "Conversation members can send call signals"
  on realtime.messages for insert
  to authenticated
  with check (public.can_access_direct_call_room(realtime.topic()));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'direct_call_invites'
    )
  then
    execute 'alter publication supabase_realtime add table public.direct_call_invites';
  end if;
end;
$$;
