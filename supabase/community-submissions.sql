alter table public.resource_library
  add column if not exists review_status text not null default 'approved'
  check (review_status in ('pending', 'approved', 'rejected'));

drop policy if exists "Members can view published resources" on public.resource_library;
create policy "Members can view published resources"
  on public.resource_library for select
  to authenticated
  using (
    published = true
    or created_by = auth.uid()
    or public.is_admin()
  );
drop policy if exists "Members can submit resources for review" on public.resource_library;
create policy "Members can submit resources for review"
  on public.resource_library for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and published = false
    and review_status = 'pending'
  );

create table if not exists public.event_submissions (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  event_type text not null default 'Community event' check (char_length(event_type) between 1 and 80),
  description text check (description is null or char_length(description) <= 1500),
  date timestamptz not null,
  venue text not null check (char_length(venue) between 1 and 180),
  seats_available integer not null default 0 check (seats_available >= 0),
  price text check (price is null or char_length(price) <= 80),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_event_submissions_status_created
  on public.event_submissions(status, created_at asc);
create index if not exists idx_event_submissions_requester_created
  on public.event_submissions(requester_profile_id, created_at desc);

alter table public.event_submissions enable row level security;
revoke all on public.event_submissions from anon, authenticated;
grant select, insert on public.event_submissions to authenticated;
drop policy if exists "Members can view own event submissions" on public.event_submissions;
create policy "Members can view own event submissions"
  on public.event_submissions for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.profiles
      where profiles.id = requester_profile_id
        and profiles.auth_user_id = auth.uid()
    )
  );
drop policy if exists "Members can request events for review" on public.event_submissions;
create policy "Members can request events for review"
  on public.event_submissions for insert
  to authenticated
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and event_id is null
    and date > now()
    and exists (
      select 1 from public.profiles
      where profiles.id = requester_profile_id
        and profiles.auth_user_id = auth.uid()
    )
  );

create or replace function public.review_event_submission(p_submission_id uuid, p_decision text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  submission public.event_submissions%rowtype;
  created_event_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required to review event requests.'
      using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('approved', 'rejected') then
    raise exception 'Choose an approve or reject decision.';
  end if;

  select * into submission
  from public.event_submissions
  where id = p_submission_id and status = 'pending'
  for update;
  if not found then
    raise exception 'This event request is no longer pending.';
  end if;

  if p_decision = 'approved' then
    insert into public.events (
      title, event_type, description, date, venue, seats_available, price, status
    )
    values (
      submission.title, submission.event_type, submission.description, submission.date,
      submission.venue, submission.seats_available, submission.price, 'published'
    )
    returning id into created_event_id;
  end if;

  update public.event_submissions
  set status = p_decision,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      event_id = created_event_id
  where id = submission.id;

  return created_event_id;
end;
$$;
revoke all on function public.review_event_submission(uuid, text) from public, anon;
grant execute on function public.review_event_submission(uuid, text) to authenticated;

drop policy if exists "Members can read community media" on storage.objects;
create policy "Members can read community media"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'community-media'
    and (
      (storage.foldername(name))[1] in ('profiles', 'events', 'forum')
      or (
        (storage.foldername(name))[1] = 'resources'
        and exists (
          select 1 from public.resource_library
          where media_path = name
            and (published = true or created_by = auth.uid() or public.is_admin())
        )
      )
    )
  );
drop policy if exists "Members can upload resource submissions" on storage.objects;
create policy "Members can upload resource submissions"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'resources'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
drop policy if exists "Members can clean up unlinked resource uploads" on storage.objects;
create policy "Members can clean up unlinked resource uploads"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'resources'
    and (storage.foldername(name))[2] = auth.uid()::text
    and not exists (
      select 1 from public.resource_library
      where media_path = name
    )
  );
