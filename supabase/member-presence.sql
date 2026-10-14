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
