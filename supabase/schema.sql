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
  bio text,
  role text not null default 'member' check (role in ('member', 'admin')),
  weekly_digest boolean not null default true,
  event_reminders boolean not null default true,
  mentions_replies boolean not null default true,
  new_forum_activity boolean not null default false,
  show_profile boolean not null default true,
  allow_dm boolean not null default true,
  show_network_suggestions boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists "current_role" text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists weekly_digest boolean not null default true;
alter table public.profiles add column if not exists event_reminders boolean not null default true;
alter table public.profiles add column if not exists mentions_replies boolean not null default true;
alter table public.profiles add column if not exists new_forum_activity boolean not null default false;
alter table public.profiles add column if not exists show_profile boolean not null default true;
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

create table if not exists public.resource_library (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  category text not null default 'Leadership' check (char_length(category) between 1 and 80),
  summary text not null check (char_length(summary) between 1 and 1500),
  content text,
  resource_url text,
  media_path text,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (content is not null or resource_url is not null or media_path is not null)
);
create index if not exists idx_resource_library_published_created
  on public.resource_library(published, created_at desc);
alter table public.resource_library add column if not exists media_path text;
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
revoke all on function public.can_receive_connection_request(uuid) from public, anon;
grant execute on function public.can_receive_direct_message(uuid) to authenticated;
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
    insert into public.notifications (user_id, user_email, title, body)
    select recipient_user_id, email, 'New message from ' || coalesce(sender_name, 'a member'),
      left(new.content, 240)
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

  insert into public.notifications (user_id, user_email, title, body)
  select auth_user_id, email,
    case
      when new.status = 'requested' then 'New connection request'
      when new.status = 'accepted' then 'Connection request accepted'
      else 'Connection request updated'
    end,
    coalesce(actor_name, 'A member') ||
      case when new.status = 'requested' then ' sent you a connection request.'
        when new.status = 'accepted' then ' accepted your connection request.'
        else ' declined your connection request.' end
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
  created_at timestamptz not null default now()
);
alter table public.notifications add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists idx_applications_email on public.applications(email);
create index if not exists idx_profiles_auth_user_id on public.profiles(auth_user_id);
create index if not exists idx_forum_posts_created_at on public.forum_posts(created_at desc);
create index if not exists idx_notifications_user_id on public.notifications(user_id);

create or replace view public.member_directory
with (security_invoker = false)
as
  select id, full_name, "current_role", company, location, linkedin, bio, allow_dm, profile_photo
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
    linkedin
  )
  values (
    new.id,
    approved_application.full_name,
    new.email,
    approved_application.position,
    approved_application.company,
    approved_application.phone,
    approved_application.location,
    approved_application.linkedin
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

revoke all on public.applications, public.profiles, public.forum_posts, public.forum_reports, public.direct_messages, public.resource_library, public.connection_requests, public.events, public.event_rsvps, public.notifications
  from anon, authenticated;
grant insert on public.applications to anon, authenticated;
grant select, update, delete on public.applications to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.forum_posts to authenticated;
grant select, insert, update on public.forum_reports to authenticated;
grant select, insert on public.direct_messages to authenticated;
grant update (read_at) on public.direct_messages to authenticated;
grant select, insert, update on public.resource_library to authenticated;
grant select, insert on public.connection_requests to authenticated;
grant update (status) on public.connection_requests to authenticated;
grant select, insert, update, delete on public.events to authenticated;
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
create policy "Members can message opted-in members"
  on public.direct_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = sender_profile_id and auth_user_id = auth.uid()
    )
    and public.can_receive_direct_message(recipient_profile_id)
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
  using (published = true or public.is_admin());
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
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4', 'video/webm']
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
    and (storage.foldername(name))[1] in ('profiles', 'events', 'forum', 'resources')
  );

drop policy if exists "Message participants can read message attachments" on storage.objects;
create policy "Message participants can read message attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'messages'
    and exists (
      select 1
      from public.direct_messages dm
      join public.profiles sender on sender.id = dm.sender_profile_id
      join public.profiles recipient on recipient.id = dm.recipient_profile_id
      where dm.id::text = (storage.foldername(name))[2]
        and sender.auth_user_id::text = (storage.foldername(name))[3]
        and auth.uid() in (sender.auth_user_id, recipient.auth_user_id)
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
