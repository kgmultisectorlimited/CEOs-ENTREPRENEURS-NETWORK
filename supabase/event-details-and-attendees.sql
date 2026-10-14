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
