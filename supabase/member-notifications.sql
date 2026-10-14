alter table public.notifications
  add column if not exists category text not null default 'general'
  check (category in ('message', 'connection', 'event', 'conversation', 'general'));

update public.notifications
set category = case
  when title ilike 'New message from %' then 'message'
  when title ilike '%connection request%' then 'connection'
  else 'general'
end
where category = 'general';

create index if not exists idx_notifications_user_category_unread
  on public.notifications(user_id, category, unread, created_at desc);

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
