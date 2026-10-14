create extension if not exists pgcrypto;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  location text,
  company text,
  position text,
  industry text,
  years_in_business integer not null default 0,
  website text,
  linkedin text,
  whatsapp_contact text,
  why_join text,
  contribute text,
  gain text,
  referral text,
  profile_photo text,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'review', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.applications
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
alter table public.applications add column if not exists whatsapp_contact text;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  "current_role" text,
  company text,
  phone text,
  location text,
  linkedin text,
  whatsapp_contact text,
  bio text,
  role text not null default 'member' check (role in ('member', 'admin')),
  weekly_digest boolean not null default true,
  event_reminders boolean not null default true,
  mentions_replies boolean not null default true,
  new_forum_activity boolean not null default false,
  show_profile boolean not null default true,
  show_whatsapp boolean not null default false,
  allow_dm boolean not null default true,
  show_network_suggestions boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists "current_role" text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists whatsapp_contact text;
alter table public.profiles add column if not exists weekly_digest boolean not null default true;
alter table public.profiles add column if not exists event_reminders boolean not null default true;
alter table public.profiles add column if not exists mentions_replies boolean not null default true;
alter table public.profiles add column if not exists new_forum_activity boolean not null default false;
alter table public.profiles add column if not exists show_profile boolean not null default true;
alter table public.profiles add column if not exists show_whatsapp boolean not null default false;
alter table public.profiles add column if not exists allow_dm boolean not null default true;
alter table public.profiles add column if not exists show_network_suggestions boolean not null default false;
alter table public.profiles add column if not exists profile_photo text;
alter table public.applications add column if not exists profile_photo text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('member', 'admin'));
  end if;
end;
$$;

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  author text not null,
  topic text not null default 'General',
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.forum_posts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.forum_posts add column if not exists media_path text;

create table if not exists public.forum_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.forum_posts(id) on delete set null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 120),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists idx_forum_reports_created_at on public.forum_reports(created_at desc);
create unique index if not exists idx_forum_reports_pending_reporter_post
  on public.forum_reports(reporter_id, post_id)
  where status = 'pending';

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  media_path text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_profile_id <> recipient_profile_id)
);
alter table public.direct_messages add column if not exists media_path text;
alter table public.direct_messages alter column content drop not null;
alter table public.direct_messages drop constraint if exists direct_messages_content_check;
alter table public.direct_messages drop constraint if exists direct_messages_content_or_media_check;
alter table public.direct_messages
  add constraint direct_messages_content_or_media_check
  check (
    (content is not null and char_length(content) between 1 and 5000)
    or (content is null and media_path is not null)
  );
create index if not exists idx_direct_messages_sender_created
  on public.direct_messages(sender_profile_id, created_at desc);
create index if not exists idx_direct_messages_recipient_created
  on public.direct_messages(recipient_profile_id, created_at desc);

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

create table if not exists public.resource_library (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  category text not null default 'Leadership' check (char_length(category) between 1 and 80),
  summary text not null check (char_length(summary) between 1 and 1500),
  content text,
  resource_url text,
  media_path text,
  published boolean not null default true,
  review_status text not null default 'approved'
    check (review_status in ('pending', 'approved', 'rejected')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (content is not null or resource_url is not null or media_path is not null)
);
create index if not exists idx_resource_library_published_created
  on public.resource_library(published, created_at desc);
alter table public.resource_library add column if not exists media_path text;
alter table public.resource_library add column if not exists review_status text not null default 'approved'
  check (review_status in ('pending', 'approved', 'rejected'));
alter table public.resource_library drop constraint if exists resource_library_check;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'resource_library_content_or_media_check'
      and conrelid = 'public.resource_library'::regclass
  ) then
    alter table public.resource_library
      add constraint resource_library_content_or_media_check
      check (content is not null or resource_url is not null or media_path is not null);
  end if;
end;
$$;

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_profile_id <> recipient_profile_id),
  unique (requester_profile_id, recipient_profile_id)
);
create index if not exists idx_connection_requests_recipient_status
  on public.connection_requests(recipient_profile_id, status);

create or replace function public.can_receive_direct_message(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles
    where id = target_profile_id
      and allow_dm = true
      and auth_user_id <> auth.uid()
  );
$$;

create or replace function public.can_continue_direct_conversation(
  p_sender_profile_id uuid,
  p_recipient_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles sender
    join public.profiles recipient on recipient.id = p_recipient_profile_id
    where sender.id = p_sender_profile_id
      and sender.auth_user_id = auth.uid()
      and sender.id <> recipient.id
      and exists (
        select 1
        from public.direct_messages dm
        where (dm.sender_profile_id = sender.id and dm.recipient_profile_id = recipient.id)
           or (dm.sender_profile_id = recipient.id and dm.recipient_profile_id = sender.id)
      )
  );
$$;

create or replace function public.can_receive_connection_request(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles
    where id = target_profile_id
      and show_profile = true
      and auth_user_id <> auth.uid()
  );
$$;

revoke all on function public.can_receive_direct_message(uuid) from public, anon;
revoke all on function public.can_continue_direct_conversation(uuid, uuid) from public, anon;
revoke all on function public.can_receive_connection_request(uuid) from public, anon;
grant execute on function public.can_receive_direct_message(uuid) to authenticated;
grant execute on function public.can_continue_direct_conversation(uuid, uuid) to authenticated;
grant execute on function public.can_receive_connection_request(uuid) to authenticated;

create or replace function public.notify_direct_message_recipient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_user_id uuid;
  sender_name text;
begin
  select auth_user_id into recipient_user_id
  from public.profiles
  where id = new.recipient_profile_id;

  select full_name into sender_name
  from public.profiles
  where id = new.sender_profile_id;

  if recipient_user_id is not null then
    insert into public.notifications (user_id, user_email, title, body, category)
    select recipient_user_id, email, 'New message from ' || coalesce(sender_name, 'a member'),
      left(new.content, 240), 'message'
    from public.profiles
    where auth_user_id = recipient_user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_direct_message_notify_recipient on public.direct_messages;
create trigger on_direct_message_notify_recipient
  after insert on public.direct_messages
  for each row execute procedure public.notify_direct_message_recipient();

create or replace function public.notify_connection_request_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile_id uuid;
  actor_name text;
begin
  if tg_op = 'INSERT' then
    target_profile_id := new.recipient_profile_id;
    select full_name into actor_name from public.profiles where id = new.requester_profile_id;
  elsif new.status = 'requested' and new.status <> old.status then
    target_profile_id := new.recipient_profile_id;
    select full_name into actor_name from public.profiles where id = new.requester_profile_id;
  elsif new.status in ('accepted', 'declined') and new.status <> old.status then
    target_profile_id := new.requester_profile_id;
    select full_name into actor_name from public.profiles where id = new.recipient_profile_id;
  else
    return new;
  end if;

  insert into public.notifications (user_id, user_email, title, body, category)
  select auth_user_id, email,
    case
      when new.status = 'requested' then 'New connection request'
      when new.status = 'accepted' then 'Connection request accepted'
      else 'Connection request updated'
    end,
    coalesce(actor_name, 'A member') ||
      case when new.status = 'requested' then ' sent you a connection request.'
        when new.status = 'accepted' then ' accepted your connection request.'
        else ' declined your connection request.' end,
    'connection'
  from public.profiles
  where id = target_profile_id and auth_user_id is not null;
  return new;
end;
$$;

drop trigger if exists on_connection_request_notify on public.connection_requests;
create trigger on_connection_request_notify
  after insert or update of status on public.connection_requests
  for each row execute procedure public.notify_connection_request_change();

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null default 'Community event',
  description text,
  date timestamptz,
  venue text,
  seats_available integer not null default 0,
  price text,
  status text not null default 'published' check (status in ('published', 'cancelled')),
  rsvp_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.events add column if not exists event_type text not null default 'Community event';
alter table public.events add column if not exists price text;
alter table public.events add column if not exists status text not null default 'published';
alter table public.events add column if not exists rsvp_count integer not null default 0;
alter table public.events add column if not exists media_path text;

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

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create or replace function public.update_event_rsvp_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.events
    set rsvp_count = rsvp_count + 1
    where id = new.event_id and status = 'published'
      and (seats_available = 0 or rsvp_count < seats_available);
    if not found then
      raise exception 'This event is full or no longer available.';
    end if;
    return new;
  end if;

  update public.events
  set rsvp_count = greatest(rsvp_count - 1, 0)
  where id = old.event_id;
  return old;
end;
$$;

drop trigger if exists on_event_rsvp_count_change on public.event_rsvps;
create trigger on_event_rsvp_count_change
  before insert or delete on public.event_rsvps
  for each row execute procedure public.update_event_rsvp_count();

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  unread boolean not null default true,
  created_at timestamptz not null default now(),
  category text not null default 'general'
    check (category in ('message', 'connection', 'event', 'conversation', 'general'))
);
alter table public.notifications add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.notifications add column if not exists category text not null default 'general'
  check (category in ('message', 'connection', 'event', 'conversation', 'general'));
update public.notifications
set category = case
  when title ilike 'New message from %' then 'message'
  when title ilike '%connection request%' then 'connection'
  else 'general'
end
where category = 'general';

create or replace function public.notify_published_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'published' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'published' then
    return new;
  end if;

  insert into public.notifications (user_id, user_email, title, body, category)
  select auth_user_id, email, 'New event: ' || new.title,
    left(coalesce(new.description, 'A new event is available to view.'), 240),
    'event'
  from public.profiles
  where auth_user_id is not null;
  return new;
end;
$$;

drop trigger if exists on_published_event_notify_members on public.events;
create trigger on_published_event_notify_members
  after insert or update of status on public.events
  for each row execute procedure public.notify_published_event();

create or replace function public.notify_new_community_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, user_email, title, body, category)
  select auth_user_id, email, 'New community conversation',
    left(new.content, 240), 'conversation'
  from public.profiles
  where auth_user_id is not null
    and auth_user_id is distinct from new.user_id;
  return new;
end;
$$;

drop trigger if exists on_forum_post_notify_members on public.forum_posts;
create trigger on_forum_post_notify_members
  after insert on public.forum_posts
  for each row execute procedure public.notify_new_community_conversation();

create index if not exists idx_applications_email on public.applications(email);
create index if not exists idx_profiles_auth_user_id on public.profiles(auth_user_id);
create index if not exists idx_forum_posts_created_at on public.forum_posts(created_at desc);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_category_unread
  on public.notifications(user_id, category, unread, created_at desc);

create or replace view public.member_directory
with (security_invoker = false)
as
  select id, full_name, "current_role", company, location, linkedin, bio, allow_dm, profile_photo,
    case when show_whatsapp then whatsapp_contact else null end as whatsapp_contact
  from public.profiles
  where show_profile = true;

revoke all on public.member_directory from anon;
grant select on public.member_directory to authenticated;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

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

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_auth_user();

create or replace function public.set_forum_post_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select full_name into new.author
  from public.profiles
  where auth_user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_forum_post_set_author on public.forum_posts;
create trigger on_forum_post_set_author
  before insert on public.forum_posts
  for each row execute procedure public.set_forum_post_author();

alter table public.applications enable row level security;
alter table public.profiles enable row level security;
alter table public.forum_posts enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.notifications enable row level security;

revoke all on public.applications, public.profiles, public.forum_posts, public.forum_reports, public.direct_messages, public.direct_call_invites, public.resource_library, public.connection_requests, public.events, public.event_submissions, public.event_rsvps, public.notifications
  from anon, authenticated;
grant insert on public.applications to anon, authenticated;
grant select, update, delete on public.applications to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.forum_posts to authenticated;
grant select, insert, update on public.forum_reports to authenticated;
grant select, insert on public.direct_messages to authenticated;
grant update (read_at) on public.direct_messages to authenticated;
grant select on public.direct_call_invites to authenticated;
grant insert (id, caller_profile_id, recipient_profile_id, mode) on public.direct_call_invites to authenticated;
grant delete on public.direct_call_invites to authenticated;
grant select, insert, update on public.resource_library to authenticated;
grant select, insert on public.connection_requests to authenticated;
grant update (status) on public.connection_requests to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert on public.event_submissions to authenticated;
grant select, insert, delete on public.event_rsvps to authenticated;
grant select, update on public.notifications to authenticated;

drop policy if exists "Anyone can submit an application" on public.applications;
create policy "Anyone can submit an application"
  on public.applications for insert
  to anon, authenticated
  with check (status = 'pending' and auth_user_id is null);
drop policy if exists "Admins can manage applications" on public.applications;
create policy "Admins can manage applications"
  on public.applications for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Authenticated members can view profiles" on public.profiles;
create policy "Authenticated members can view profiles"
  on public.profiles for select
  to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());
drop policy if exists "Members can update their own profile" on public.profiles;
create policy "Members can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth_user_id = auth.uid() or public.is_admin())
  with check (
    (auth_user_id = auth.uid() and role = public.current_user_role())
    or public.is_admin()
  );

drop policy if exists "Members can read forum posts" on public.forum_posts;
create policy "Members can read forum posts"
  on public.forum_posts for select
  to authenticated
  using (true);
drop policy if exists "Members can create own forum posts" on public.forum_posts;
create policy "Members can create own forum posts"
  on public.forum_posts for insert
  to authenticated
  with check (user_id = auth.uid());
drop policy if exists "Authors and admins can update forum posts" on public.forum_posts;
create policy "Authors and admins can update forum posts"
  on public.forum_posts for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "Authors and admins can delete forum posts" on public.forum_posts;
create policy "Authors and admins can delete forum posts"
  on public.forum_posts for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

alter table public.forum_reports enable row level security;
drop policy if exists "Members can submit forum reports" on public.forum_reports;
create policy "Members can submit forum reports"
  on public.forum_reports for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );
drop policy if exists "Admins can view forum reports" on public.forum_reports;
create policy "Admins can view forum reports"
  on public.forum_reports for select
  to authenticated
  using (public.is_admin());
drop policy if exists "Admins can update forum reports" on public.forum_reports;
create policy "Admins can update forum reports"
  on public.forum_reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.direct_messages enable row level security;
alter table public.direct_call_invites enable row level security;
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
      and exists (
        select 1
        from public.direct_messages dm
        where (dm.sender_profile_id = caller.id and dm.recipient_profile_id = recipient.id)
           or (dm.sender_profile_id = recipient.id and dm.recipient_profile_id = caller.id)
      )
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
drop policy if exists "Participants can view direct messages" on public.direct_messages;
create policy "Participants can view direct messages"
  on public.direct_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = sender_profile_id and auth_user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles
      where id = recipient_profile_id and auth_user_id = auth.uid()
    )
  );
drop policy if exists "Members can message opted-in members" on public.direct_messages;
drop policy if exists "Members can message opted-in members or continue conversations" on public.direct_messages;
create policy "Members can message opted-in members or continue conversations"
  on public.direct_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = sender_profile_id and auth_user_id = auth.uid()
    )
    and (
      public.can_receive_direct_message(recipient_profile_id)
      or public.can_continue_direct_conversation(sender_profile_id, recipient_profile_id)
    )
  );
drop policy if exists "Recipients can mark messages read" on public.direct_messages;
create policy "Recipients can mark messages read"
  on public.direct_messages for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = recipient_profile_id and auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = recipient_profile_id and auth_user_id = auth.uid()
    )
  );

alter table public.resource_library enable row level security;
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
drop policy if exists "Admins can manage resources" on public.resource_library;
create policy "Admins can manage resources"
  on public.resource_library for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.connection_requests enable row level security;
drop policy if exists "Members can view their connection requests" on public.connection_requests;
create policy "Members can view their connection requests"
  on public.connection_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = requester_profile_id and auth_user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles
      where id = recipient_profile_id and auth_user_id = auth.uid()
    )
  );
drop policy if exists "Members can request visible profiles" on public.connection_requests;
create policy "Members can request visible profiles"
  on public.connection_requests for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = requester_profile_id and auth_user_id = auth.uid()
    )
    and public.can_receive_connection_request(recipient_profile_id)
    and status = 'requested'
  );
drop policy if exists "Participants can update connection request status" on public.connection_requests;
create policy "Participants can update connection request status"
  on public.connection_requests for update
  to authenticated
  using (
    (status = 'requested' and exists (
      select 1 from public.profiles
      where id = recipient_profile_id and auth_user_id = auth.uid()
    ))
    or (status in ('requested', 'declined', 'withdrawn') and exists (
      select 1 from public.profiles
      where id = requester_profile_id and auth_user_id = auth.uid()
    ))
  )
  with check (
    (status in ('accepted', 'declined') and exists (
      select 1 from public.profiles
      where id = recipient_profile_id and auth_user_id = auth.uid()
    ))
    or (status in ('withdrawn', 'requested') and exists (
      select 1 from public.profiles
      where id = requester_profile_id and auth_user_id = auth.uid()
    ))
  );

drop policy if exists "Members can view events" on public.events;
create policy "Members can view events"
  on public.events for select
  to authenticated
  using (status = 'published' or public.is_admin());
drop policy if exists "Admins can manage events" on public.events;
create policy "Admins can manage events"
  on public.events for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.event_submissions enable row level security;
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

drop policy if exists "Members can view event RSVP totals" on public.event_rsvps;
create policy "Members can view event RSVP totals"
  on public.event_rsvps for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "Members can RSVP for themselves" on public.event_rsvps;
create policy "Members can RSVP for themselves"
  on public.event_rsvps for insert
  to authenticated
  with check (user_id = auth.uid());
drop policy if exists "Members can cancel their own RSVP" on public.event_rsvps;
create policy "Members can cancel their own RSVP"
  on public.event_rsvps for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create or replace function public.admin_event_rsvp_attendees(p_event_id uuid)
returns table (
  full_name text,
  email text,
  reserved_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required to view event attendees.'
      using errcode = '42501';
  end if;

  return query
  select profiles.full_name, profiles.email, event_rsvps.created_at
  from public.event_rsvps
  join public.profiles on profiles.auth_user_id = event_rsvps.user_id
  where event_rsvps.event_id = p_event_id
  order by event_rsvps.created_at asc;
end;
$$;

revoke all on function public.admin_event_rsvp_attendees(uuid) from public, anon;
grant execute on function public.admin_event_rsvp_attendees(uuid) to authenticated;

drop policy if exists "Members can view own notifications" on public.notifications;
create policy "Members can view own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "Members can update own notifications" on public.notifications;
create policy "Members can update own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount_ugx integer not null default 50000 check (amount_ugx = 50000),
  billing_period text not null default 'annual' check (billing_period = 'annual'),
  payment_method text not null default 'MTN Mobile Money',
  payer_phone text not null check (char_length(payer_phone) between 7 and 30),
  transaction_reference text not null check (char_length(transaction_reference) between 4 and 120),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.subscription_payments add column if not exists expires_at timestamptz;
create unique index if not exists idx_subscription_payments_reference
  on public.subscription_payments (lower(transaction_reference));
create index if not exists idx_subscription_payments_profile_created
  on public.subscription_payments (profile_id, created_at desc);
alter table public.subscription_payments enable row level security;
revoke all on public.subscription_payments from anon, authenticated;
grant select, insert on public.subscription_payments to authenticated;
grant update (status, reviewed_by, reviewed_at) on public.subscription_payments to authenticated;
drop policy if exists "Members can view own subscription payments" on public.subscription_payments;
create policy "Members can view own subscription payments"
  on public.subscription_payments for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.profiles
      where profiles.id = profile_id and profiles.auth_user_id = auth.uid()
    )
  );
drop policy if exists "Members can submit own pending subscription payments" on public.subscription_payments;
create policy "Members can submit own pending subscription payments"
  on public.subscription_payments for insert
  to authenticated
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and exists (
      select 1 from public.profiles
      where profiles.id = profile_id and profiles.auth_user_id = auth.uid()
    )
  );
drop policy if exists "Admins can review subscription payments" on public.subscription_payments;
create policy "Admins can review subscription payments"
  on public.subscription_payments for update
  to authenticated
  using (public.is_admin())
  with check (
    public.is_admin()
    and status in ('verified', 'rejected')
    and reviewed_by = auth.uid()
    and reviewed_at is not null
  );

create or replace function public.set_subscription_payment_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'verified' and old.status is distinct from 'verified' then
    new.expires_at := now() + interval '1 year';
  elsif new.status <> 'verified' then
    new.expires_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists on_subscription_payment_verified on public.subscription_payments;
create trigger on_subscription_payment_verified
  before update of status on public.subscription_payments
  for each row execute procedure public.set_subscription_payment_expiry();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4', 'video/webm', 'audio/webm']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can read application photos" on storage.objects;
create policy "Admins can read application photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'community-media' and (storage.foldername(name))[1] = 'applications' and public.is_admin());

drop policy if exists "Applicants can upload application photos" on storage.objects;
create policy "Applicants can upload application photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = 'applications');

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

create or replace function public.can_access_direct_message_media(
  p_message_id text,
  p_sender_auth_user_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.direct_messages dm
    join public.profiles sender on sender.id = dm.sender_profile_id
    join public.profiles recipient on recipient.id = dm.recipient_profile_id
    where dm.id::text = p_message_id
      and sender.auth_user_id::text = p_sender_auth_user_id
      and auth.uid() in (sender.auth_user_id, recipient.auth_user_id)
  );
$$;

revoke all on function public.can_access_direct_message_media(text, text) from public, anon;
grant execute on function public.can_access_direct_message_media(text, text) to authenticated;

drop policy if exists "Message participants can read message attachments" on storage.objects;
create policy "Message participants can read message attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'messages'
    and public.can_access_direct_message_media(
      (storage.foldername(name))[2],
      (storage.foldername(name))[3]
    )
  );

drop policy if exists "Members can upload own message attachments" on storage.objects;
create policy "Members can upload own message attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'messages'
    and (storage.foldername(name))[3] = auth.uid()::text
  );

drop policy if exists "Members can delete own message attachments" on storage.objects;
create policy "Members can delete own message attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'messages'
    and (storage.foldername(name))[3] = auth.uid()::text
  );

drop policy if exists "Owners and admins can read subscription receipts" on storage.objects;
create policy "Owners and admins can read subscription receipts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'subscriptions'
    and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "Members can upload own profile photos" on storage.objects;
create policy "Members can upload own profile photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = 'profiles' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists "Members can delete own profile photos" on storage.objects;
create policy "Members can delete own profile photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'community-media' and (storage.foldername(name))[1] = 'profiles' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists "Admins can manage event and resource media" on storage.objects;
create policy "Admins can manage event and resource media"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] in ('events', 'resources')
    and public.is_admin()
  )
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] in ('events', 'resources')
    and public.is_admin()
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

drop policy if exists "Members can manage their forum media" on storage.objects;
create policy "Members can manage their forum media"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'community-media' and (storage.foldername(name))[1] = 'forum' and (storage.foldername(name))[2] = auth.uid()::text)
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = 'forum' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists "Members can upload own subscription receipts" on storage.objects;
create policy "Members can upload own subscription receipts"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = 'subscriptions' and (storage.foldername(name))[2] = auth.uid()::text);

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
        and exists (
          select 1
          from public.direct_messages dm
          where (dm.sender_profile_id = first_member.id and dm.recipient_profile_id = second_member.id)
             or (dm.sender_profile_id = second_member.id and dm.recipient_profile_id = first_member.id)
        )
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

drop policy if exists "Authenticated members can receive online status" on realtime.messages;
create policy "Authenticated members can receive online status"
  on realtime.messages for select
  to authenticated
  using (
    realtime.topic() = 'member-presence'
    and auth.uid() is not null
  );

drop policy if exists "Listed members can share online status" on realtime.messages;
create policy "Listed members can share online status"
  on realtime.messages for insert
  to authenticated
  with check (
    realtime.topic() = 'member-presence'
    and exists (
      select 1
      from public.profiles
      where auth_user_id = auth.uid()
        and show_profile = true
    )
  );

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

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['notifications', 'direct_messages', 'connection_requests']
    loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;
